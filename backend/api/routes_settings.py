from fastapi import APIRouter, HTTPException

from backend.models.schemas import EmbeddingSettings, LLMSettings, MaintenanceResponse, VectorDBSettings
from backend.services import classification_service, chunk_service, document_service, embed_service, settings_service, vector_service
from pathlib import Path
import time

router = APIRouter()

UPLOAD_DIR = Path("backend/uploads").resolve()
MIME_TYPE_BY_FILE_TYPE = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}


def _format_file_size(bytes_size: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} TB"


def _unique_documents() -> list[dict]:
    documents = {}
    for item in vector_service.metadata:
        doc_id = item.get("doc_id")
        if doc_id and doc_id not in documents:
            documents[doc_id] = item.copy()
    return list(documents.values())


@router.get("/settings/llm", response_model=LLMSettings)
async def get_llm_settings():
    try:
        return LLMSettings(**settings_service.get_llm_settings())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.put("/settings/llm", response_model=LLMSettings)
async def update_llm_settings(settings: LLMSettings):
    try:
        if settings.temperature < 0 or settings.temperature > 2:
            raise HTTPException(status_code=400, detail="Temperature must be between 0 and 2.")

        if settings.max_tokens < 1 or settings.max_tokens > 8192:
            raise HTTPException(status_code=400, detail="Max tokens must be between 1 and 8192.")

        return LLMSettings(**settings_service.update_llm_settings(settings.dict()))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.get("/settings/embedding", response_model=EmbeddingSettings)
async def get_embedding_settings():
    try:
        return EmbeddingSettings(**settings_service.get_embedding_settings())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.put("/settings/embedding", response_model=EmbeddingSettings)
async def update_embedding_settings(settings: EmbeddingSettings):
    try:
        if settings.chunk_size < 128 or settings.chunk_size > 4000:
            raise HTTPException(status_code=400, detail="Chunk size must be between 128 and 4000.")

        if settings.chunk_overlap < 0 or settings.chunk_overlap >= settings.chunk_size:
            raise HTTPException(status_code=400, detail="Chunk overlap must be smaller than chunk size.")

        return EmbeddingSettings(**settings_service.update_embedding_settings(settings.dict()))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.get("/settings/vector-db", response_model=VectorDBSettings)
async def get_vector_db_settings():
    try:
        return VectorDBSettings(**settings_service.get_vector_db_settings())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.put("/settings/vector-db", response_model=VectorDBSettings)
async def update_vector_db_settings(settings: VectorDBSettings):
    try:
        if not settings.engine.strip():
            raise HTTPException(status_code=400, detail="Database engine is required.")
        if not settings.host.strip():
            raise HTTPException(status_code=400, detail="Database host is required.")

        return VectorDBSettings(**settings_service.update_vector_db_settings(settings.dict()))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.post("/settings/maintenance/reindex", response_model=MaintenanceResponse)
async def reindex_document_library():
    try:
        started_at = time.perf_counter()
        documents = _unique_documents()
        embedding_settings = settings_service.get_embedding_settings()
        chunk_size = int(embedding_settings.get("chunk_size", 500))
        chunk_overlap = int(embedding_settings.get("chunk_overlap", 50))

        vector_service.reset_store()

        indexed = 0
        skipped = []
        for document in documents:
            doc_id = document.get("doc_id")
            filename = document.get("filename")
            file_type = document.get("file_type", "unknown")
            mime_type = MIME_TYPE_BY_FILE_TYPE.get(file_type)
            file_path = (UPLOAD_DIR / Path(filename or "").name).resolve()

            if not doc_id or not filename or not mime_type or UPLOAD_DIR not in file_path.parents or not file_path.exists():
                skipped.append(filename or doc_id or "Unknown")
                continue

            page_count, _, text = document_service.extract_text_from_file(str(file_path), mime_type)
            if not text.strip():
                skipped.append(filename)
                continue

            chunks = chunk_service.chunk_text(text, chunk_size=chunk_size, overlap=chunk_overlap)
            embeddings = embed_service.generate_embeddings(chunks)
            file_size = file_path.stat().st_size
            category = classification_service.classify_document(text, filename)

            vector_service.add_chunks(doc_id, chunks, embeddings, {
                "filename": filename,
                "file_type": file_type,
                "file_size_bytes": file_size,
                "file_size_label": _format_file_size(file_size),
                "uploaded_at": document.get("uploaded_at"),
                "category": category,
                "status": "processed",
                "semantic_score": document.get("semantic_score", 0.95),
                "pages": page_count,
            })
            indexed += 1

        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        return MaintenanceResponse(
            success=True,
            message=f"Re-indexed {indexed} document{'s' if indexed != 1 else ''}.",
            data={
                "indexed": indexed,
                "skipped": skipped,
                "duration_ms": duration_ms,
                "chunks": len(vector_service.metadata),
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.post("/settings/maintenance/wipe", response_model=MaintenanceResponse)
async def wipe_vector_database():
    try:
        vector_service.reset_store()
        return MaintenanceResponse(
            success=True,
            message="Vector database wiped.",
            data={"documents": 0, "chunks": 0},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
