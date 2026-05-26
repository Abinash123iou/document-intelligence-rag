import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.services import activity_service, document_service, chunk_service, embed_service, vector_service, classification_service
from backend.models.schemas import UploadResponse, UploadSuccessData, ErrorResponse
import uuid
from datetime import datetime
import os
import time
from pathlib import Path

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define allowed MIME types
ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt"
}

CANONICAL_MIME_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}

ALLOWED_EXTENSIONS = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".txt": "txt",
}

def resolve_file_type(file: UploadFile) -> str | None:
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type in ALLOWED_MIME_TYPES:
        return ALLOWED_MIME_TYPES[content_type]

    return ALLOWED_EXTENSIONS.get(Path(file.filename or "").suffix.lower())

def format_file_size(bytes_size: int) -> str:
    """Convert bytes to human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} TB"

@router.post("/upload", response_model=UploadResponse, responses={400: {"model": ErrorResponse}})
@router.post("/upload-document", response_model=UploadResponse, responses={400: {"model": ErrorResponse}})
async def upload_document(file: UploadFile = File(...)):
    """
    Uploads a document (PDF, DOCX, TXT), classifies it, extracts text, and processes it.
    """
    file_type = resolve_file_type(file)
    if not file_type:
        logger.warning(f"Unsupported file type uploaded: {file.content_type}")
        return ErrorResponse(
            success=False,
            message="Unsupported file type. Please upload PDF, DOCX, or TXT files.",
            error_code="UNSUPPORTED_FILE"
        )

    upload_dir = "backend/uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_path = f"{upload_dir}/{file.filename}"
    
    started_at = time.perf_counter()

    try:
        file_size = 0
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            file_size = buffer.tell()

        logger.info(f"File '{file.filename}' uploaded successfully.")
        
        page_count, char_count, text = document_service.extract_text_from_file(file_path, CANONICAL_MIME_TYPES[file_type])

        if not text.strip():
            logger.warning(f"No text could be extracted from '{file.filename}'.")
            raise HTTPException(status_code=400, detail="No text could be extracted from the document.")

        doc_type = classification_service.classify_document(text, file.filename)
        logger.info(f"Document '{file.filename}' classified as: {doc_type}")

        chunks = chunk_service.chunk_text(text)
        
        embeddings = embed_service.generate_embeddings(chunks)
        
        doc_id = str(uuid.uuid4())
        
        # Create document metadata to store with chunks
        file_size_bytes = file_size
        file_size_label = format_file_size(file_size_bytes)
        
        doc_metadata = {
            "filename": file.filename,
            "file_type": file_type,
            "file_size_bytes": file_size_bytes,
            "file_size_label": file_size_label,
            "uploaded_at": datetime.now().isoformat(),
            "category": doc_type,
            "status": "processed",
            "semantic_score": 0.95
        }
        
        vector_service.add_chunks(doc_id, chunks, embeddings, doc_metadata)
        activity_service.record_event(
            "upload",
            file.filename,
            status="completed",
            document_id=doc_id,
            chunks=len(chunks),
            duration_ms=round((time.perf_counter() - started_at) * 1000, 2),
        )

        success_data = UploadSuccessData(
            id=doc_id,
            filename=file.filename,
            file_type=file_type,
            file_size_bytes=file_size,
            uploaded_at=datetime.now().isoformat(),
            status="processed",
            pages=page_count,
            chunks=len(chunks),
            category=doc_type,
            embedding_status="completed",
            index_status="completed"
        )

        return UploadResponse(
            success=True,
            message="Document uploaded and processed successfully",
            data=success_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"An error occurred during file upload or processing: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
    finally:
        file.file.close()

