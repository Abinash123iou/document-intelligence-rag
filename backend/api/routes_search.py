from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
from pathlib import Path
from urllib.parse import quote

from backend.models.schemas import (
    SearchQuery, SemanticSearchResult, DocumentsListResponse, DocumentListItem,
    DeleteDocumentResponse, DocumentHtmlResponse, DocumentTextResponse, ReclassifyAllDocumentsResponse,
    ReclassifyDocumentResponse, RenameDocumentRequest, CleanedSemanticSearchResponse,
    CleanedSemanticSearchResult
)
from backend.services import activity_service, classification_service, document_service, embed_service, vector_service, text_cleaning_service
import logging
from datetime import datetime
import time
from backend.config import UPLOAD_DIR as CONFIG_UPLOAD_DIR

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(CONFIG_UPLOAD_DIR).resolve()
MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain; charset=utf-8",
}

MIME_TYPE_BY_FILE_TYPE = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}

def _content_disposition(disposition_type: str, filename: str) -> str:
    safe_filename = filename.replace('"', '')
    encoded_filename = quote(filename)
    return f'{disposition_type}; filename="{safe_filename}"; filename*=UTF-8\'\'{encoded_filename}'

@router.get("/documents", response_model=DocumentsListResponse)
async def get_documents():
    """
    Retrieves a list of all uploaded documents.
    """
    try:
        # Get unique documents from metadata
        documents_dict = {}
        
        for chunk_metadata in vector_service.metadata:
            doc_id = chunk_metadata.get("doc_id")
            if doc_id and doc_id not in documents_dict:
                documents_dict[doc_id] = {
                    "id": doc_id,
                    "filename": chunk_metadata.get("filename", "Unknown"),
                    "file_type": chunk_metadata.get("file_type", "unknown"),
                    "file_size_bytes": chunk_metadata.get("file_size_bytes", 0),
                    "file_size_label": chunk_metadata.get("file_size_label", "0 B"),
                    "uploaded_at": chunk_metadata.get("uploaded_at", datetime.now().isoformat()),
                    "category": chunk_metadata.get("category", "Uncategorized"),
                    "status": chunk_metadata.get("status", "processed"),
                    "semantic_score": chunk_metadata.get("semantic_score", 0.95)
                }
        
        documents = [DocumentListItem(**doc) for doc in documents_dict.values()]
        
        logger.info(f"Retrieved {len(documents)} documents.")
        
        return DocumentsListResponse(
            success=True,
            data=documents
        )
    except Exception as e:
        logger.error(f"An error occurred while retrieving documents: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@router.delete("/documents/{document_id}", response_model=DeleteDocumentResponse)
async def delete_document(document_id: str):
    """
    Deletes a document and all its associated chunks from the vector store.
    """
    try:
        # First, log all available document IDs for debugging
        available_docs = set()
        for chunk_metadata in vector_service.metadata:
            doc_id = chunk_metadata.get("doc_id")
            if doc_id:
                available_docs.add(doc_id)
        
        logger.info(f"Available documents: {available_docs}")
        logger.info(f"Trying to delete: {document_id}")
        
        success = vector_service.delete_document(document_id)
        
        if not success:
            logger.error(f"Document '{document_id}' not found. Available: {available_docs}")
            raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")
        
        logger.info(f"Document '{document_id}' deleted successfully.")
        
        return DeleteDocumentResponse(
            success=True,
            message="Document deleted successfully",
            data={"id": document_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"An error occurred while deleting document: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@router.patch("/documents/{document_id}/rename", response_model=DocumentListItem)
async def rename_document(document_id: str, payload: RenameDocumentRequest):
    """
    Renames the stored uploaded file and updates document metadata.
    """
    try:
        metadata, current_path = _document_file(document_id)
        requested_name = Path(payload.filename.strip()).name
        if not requested_name:
            raise HTTPException(status_code=400, detail="Filename is required.")

        current_suffix = current_path.suffix
        requested_path = Path(requested_name)
        if requested_path.suffix.lower() != current_suffix.lower():
            requested_name = f"{requested_path.stem}{current_suffix}"

        new_path = (UPLOAD_DIR / requested_name).resolve()
        if UPLOAD_DIR not in new_path.parents:
            raise HTTPException(status_code=400, detail="Invalid filename.")
        if new_path.exists() and new_path != current_path:
            raise HTTPException(status_code=409, detail="A file with that name already exists.")

        if new_path != current_path:
            current_path.rename(new_path)

        updated = vector_service.update_document_metadata(document_id, {"filename": requested_name})
        if not updated:
            raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")

        logger.info(f"Document '{metadata.get('filename')}' renamed to '{requested_name}'.")
        return _document_list_item(document_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"An error occurred while renaming document: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@router.post("/documents/{document_id}/reclassify", response_model=ReclassifyDocumentResponse)
async def reclassify_document(document_id: str):
    """
    Re-runs document classification and updates the category stored in metadata.
    """
    try:
        return ReclassifyDocumentResponse(
            success=True,
            message="Document reclassified.",
            data=_classify_existing_document(document_id),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"An error occurred while reclassifying document: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@router.post("/documents/reclassify-all", response_model=ReclassifyAllDocumentsResponse)
async def reclassify_all_documents():
    """
    Re-runs classification for all indexed documents without rebuilding embeddings.
    """
    try:
        document_ids = []
        for chunk_metadata in vector_service.metadata:
            doc_id = chunk_metadata.get("doc_id")
            if doc_id and doc_id not in document_ids:
                document_ids.append(doc_id)

        reclassified = []
        skipped = 0
        for doc_id in document_ids:
            try:
                reclassified.append(_classify_existing_document(doc_id))
            except HTTPException as exc:
                skipped += 1
                logger.warning(f"Skipped reclassifying '{doc_id}': {exc.detail}")

        message = f"Reclassified {len(reclassified)} document{'s' if len(reclassified) != 1 else ''}."
        if skipped:
            message += f" Skipped {skipped} document{'s' if skipped != 1 else ''}."

        return ReclassifyAllDocumentsResponse(
            success=True,
            message=message,
            data=reclassified,
        )
    except Exception as e:
        logger.error(f"An error occurred while reclassifying all documents: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

def _metadata_for_document(document_id: str) -> dict:
    for chunk_metadata in vector_service.metadata:
        if chunk_metadata.get("doc_id") == document_id and chunk_metadata.get("filename"):
            return chunk_metadata
    return {}

def _document_file(document_id: str) -> tuple[dict, Path]:
    metadata = _metadata_for_document(document_id)
    filename = metadata.get("filename")
    if not filename:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")

    file_path = (UPLOAD_DIR / Path(filename).name).resolve()
    if UPLOAD_DIR not in file_path.parents or not file_path.exists():
        raise HTTPException(status_code=404, detail="Original uploaded file was not found.")

    return metadata, file_path

def _document_list_item(document_id: str) -> DocumentListItem:
    metadata = _metadata_for_document(document_id)
    if not metadata:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")

    return DocumentListItem(
        id=document_id,
        filename=metadata.get("filename", "Unknown"),
        file_type=metadata.get("file_type", "unknown"),
        file_size_bytes=metadata.get("file_size_bytes", 0),
        file_size_label=metadata.get("file_size_label", "0 B"),
        uploaded_at=metadata.get("uploaded_at", datetime.now().isoformat()),
        category=metadata.get("category", "Uncategorized"),
        status=metadata.get("status", "processed"),
        semantic_score=metadata.get("semantic_score", 0.95),
    )

def _classify_existing_document(document_id: str) -> DocumentListItem:
    metadata, file_path = _document_file(document_id)
    file_type = metadata.get("file_type", "unknown")
    mime_type = MIME_TYPE_BY_FILE_TYPE.get(file_type)
    if not mime_type:
        raise HTTPException(status_code=400, detail="Reclassification is not supported for this file type.")

    _, _, text = document_service.extract_text_from_file(str(file_path), mime_type)
    category = classification_service.classify_document(text, metadata.get("filename", file_path.name))
    updated = vector_service.update_document_metadata(document_id, {"category": category})
    if not updated:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")

    return _document_list_item(document_id)

def _semantic_score(distance: float) -> float:
    return round(1 / (1 + max(distance, 0.0)), 4)

@router.post("/semantic-search", response_model=CleanedSemanticSearchResponse)
async def semantic_search(query: SearchQuery):
    """
    Performs semantic search with cleaned, formatted results.
    
    Takes a natural language query and returns the most similar chunks
    with cleaned text snippets ready for frontend display.
    
    Request:
        {
            "query": "GDPR compliance requirements",
            "top_k": 5,
            "document_ids": ["doc_001"]  # optional
        }
    
    Response:
        {
            "success": true,
            "query": "GDPR compliance requirements",
            "result_count": 5,
            "results": [
                {
                    "document_id": "doc_001",
                    "filename": "Q3_2025_Financial_Report.pdf",
                    "page": 22,
                    "title": "Q3 2025 Financial Report",
                    "snippet": "The new GDPR compliance requirements in the EU region...",
                    "score": 0.98,
                    "category": "Report",
                    "file_type": "pdf"
                }
            ],
            "execution_time_ms": 45.2
        }
    """
    started_at = time.perf_counter()
    
    try:
        if not query.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Generate embedding for the query
        query_embedding = embed_service.generate_embeddings([query.query])[0]
        
        # Search vector store with optional document filtering
        raw_results = vector_service.search_similar(
            query_embedding,
            k=query.top_k,
            doc_ids=query.document_ids
        )
        
        if not raw_results:
            logger.info(f"No results found for query: '{query.query}'")
            return CleanedSemanticSearchResponse(
                success=True,
                query=query.query,
                result_count=0,
                results=[],
                execution_time_ms=round((time.perf_counter() - started_at) * 1000, 2)
            )
        
        # Process and clean results
        cleaned_results_dicts = []
        for raw_result in raw_results:
            try:
                cleaned_dict, _ = text_cleaning_service.process_search_result(
                    raw_result,
                    include_debug=False,
                    query=query.query
                )
                cleaned_results_dicts.append(cleaned_dict)
            except Exception as e:
                logger.warning(f"Failed to process result: {e}")
                continue
        
        if not cleaned_results_dicts:
            return CleanedSemanticSearchResponse(
                success=True,
                query=query.query,
                result_count=0,
                results=[],
                execution_time_ms=round((time.perf_counter() - started_at) * 1000, 2)
            )
        
        # Rerank results using keyword overlap and quality scoring
        reranked_dicts = text_cleaning_service.rerank_results(
            cleaned_results_dicts,
            query=query.query,
            semantic_weight=0.7,
            keyword_weight=0.2,
            quality_weight=0.1
        )
        
        # Convert to Pydantic models
        cleaned_results = [CleanedSemanticSearchResult(**d) for d in reranked_dicts]
        
        execution_time = round((time.perf_counter() - started_at) * 1000, 2)
        
        # Log the search activity
        logger.info(f"Semantic search completed: '{query.query}' -> {len(cleaned_results)} results in {execution_time}ms")
        avg_score = sum(result.score for result in cleaned_results) / len(cleaned_results) if cleaned_results else 0.0
        activity_service.record_event(
            "semantic_search",
            f'Search: "{query.query[:80]}"',
            status="success",
            results=len(cleaned_results),
            average_score=round(avg_score, 4),
            documents=[
                {
                    "id": result.document_id,
                    "filename": result.filename,
                    "score": result.score,
                }
                for result in cleaned_results
            ],
            duration_ms=execution_time,
        )
        
        return CleanedSemanticSearchResponse(
            success=True,
            query=query.query,
            result_count=len(cleaned_results),
            results=cleaned_results,
            execution_time_ms=execution_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during semantic search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")

@router.get("/documents/{document_id}/view")
async def view_document(document_id: str):
    """
    Serves the original uploaded document inline for the in-app preview.
    """
    metadata, file_path = _document_file(document_id)
    file_type = metadata.get("file_type", "unknown")
    media_type = MEDIA_TYPES.get(file_type, "application/octet-stream")

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=metadata.get("filename", file_path.name),
        headers={
            "Content-Disposition": _content_disposition("inline", metadata.get("filename", file_path.name)),
        },
    )

@router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    """
    Downloads the original uploaded document.
    """
    metadata, file_path = _document_file(document_id)
    file_type = metadata.get("file_type", "unknown")
    media_type = MEDIA_TYPES.get(file_type, "application/octet-stream")

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=metadata.get("filename", file_path.name),
        headers={
            "Content-Disposition": _content_disposition("attachment", metadata.get("filename", file_path.name)),
        },
    )

@router.get("/documents/{document_id}/text", response_model=DocumentTextResponse)
async def get_document_text(document_id: str):
    """
    Returns extracted text for text-based previews such as DOCX and TXT files.
    """
    metadata, file_path = _document_file(document_id)
    file_type = metadata.get("file_type", "unknown")

    mime_type = MIME_TYPE_BY_FILE_TYPE.get(file_type)
    if not mime_type:
        raise HTTPException(status_code=400, detail="Text preview is not supported for this file type.")

    _, _, text = document_service.extract_text_from_file(str(file_path), mime_type)
    return DocumentTextResponse(
        document_id=document_id,
        filename=metadata.get("filename", file_path.name),
        file_type=file_type,
        text=text,
    )

@router.get("/documents/{document_id}/html", response_model=DocumentHtmlResponse)
async def get_document_html(document_id: str):
    """
    Returns formatted HTML for DOCX previews.
    """
    metadata, file_path = _document_file(document_id)
    file_type = metadata.get("file_type", "unknown")

    if file_type != "docx":
        raise HTTPException(status_code=400, detail="HTML preview is only supported for DOCX files.")

    try:
        html, warnings = document_service.extract_html_from_docx(str(file_path))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return DocumentHtmlResponse(
        document_id=document_id,
        filename=metadata.get("filename", file_path.name),
        file_type=file_type,
        html=html,
        warnings=warnings,
    )
