from fastapi import APIRouter, HTTPException
from backend.models.schemas import RAGQuery, RAGResponse, RAGSource
from backend.services import activity_service, rag_service
import logging
import time

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _metadata_for_document(document_id: str) -> dict:
    from backend.services import vector_service
    for chunk_metadata in vector_service.metadata:
        if chunk_metadata.get("doc_id") == document_id and chunk_metadata.get("filename"):
            return chunk_metadata
    return {}

def _semantic_score(distance: float) -> float:
    return round(1 / (1 + max(distance, 0.0)), 4)

@router.post("/rag-query", response_model=RAGResponse)
async def rag_query(query: RAGQuery):
    """
    Performs RAG question-answering.
    """
    started_at = time.perf_counter()

    try:
        # Pass the document_ids from the query to the service
        answer, sources = rag_service.answer_question_with_rag(
            query.query, 
            doc_ids=query.document_ids, 
            top_k=query.top_k
        )
        
        # Format the sources to match RAGSource schema
        source_results = []
        for res in sources:
            doc_id = res.get("doc_id")
            doc_metadata = _metadata_for_document(doc_id) if doc_id else {}
            
            filename = res.get("filename") or doc_metadata.get("filename", "Unknown")
            page = res.get("page")
            
            source_results.append(
                RAGSource(
                    document_id=doc_id,
                    filename=filename,
                    file_type=res.get("file_type") or doc_metadata.get("file_type", "unknown"),
                    page=page,
                    chunk_text=res.get("text", ""),
                    score=_semantic_score(res.get("score", 0.0))
                )
            )
        
        logger.info(f"Successfully answered RAG query: '{query.query}'")
        avg_score = sum(source.score for source in source_results) / len(source_results) if source_results else 0.0
        activity_service.record_event(
            "rag_query",
            f'Chat: "{query.query[:80]}"',
            status="success",
            sources=len(source_results),
            average_score=round(avg_score, 4),
            documents=[
                {
                    "id": source.document_id,
                    "filename": source.filename,
                    "score": source.score,
                }
                for source in source_results
            ],
            duration_ms=round((time.perf_counter() - started_at) * 1000, 2),
        )
        
        return RAGResponse(answer=answer, sources=source_results)
    except Exception as e:
        logger.error(f"An error occurred during RAG query: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
