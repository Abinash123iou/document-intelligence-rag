from pydantic import BaseModel
from typing import List
from datetime import datetime

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5
    document_ids: list[str] | None = None

class Document(BaseModel):
    id: str
    text: str
    embedding: List[float]

class DocumentUploadResponse(BaseModel):
    doc_id: str # Unique ID for the document
    filename: str
    doc_type: str # Added field for document classification
    page_count: int
    char_count: int
    preview: str
    status: str

class SearchResult(BaseModel):
    text: str
    score: float
    doc_id: str
    chunk_id: int

class SearchResponse(BaseModel):
    results: List[SearchResult]

class SemanticSearchResult(BaseModel):
    document_id: str
    filename: str
    file_type: str = "unknown"
    uploaded_at: datetime | None = None
    page: int | None = None
    chunk_text: str
    score: float
    category: str

class DocumentTextResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    text: str

class DocumentHtmlResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    html: str
    warnings: list[str] = []

class RAGSource(BaseModel):
    document_id: str | None = None
    filename: str
    file_type: str = "unknown"
    page: int | None = None
    chunk_text: str
    score: float

class RAGQuery(BaseModel):
    query: str
    top_k: int = 5
    document_ids: list[str] | None = None

class RAGResponse(BaseModel):
    answer: str
    sources: List[RAGSource]

class LLMSettings(BaseModel):
    provider: str = "groq"
    model: str = "llama-3.1-8b-instant"
    temperature: float = 0.0
    max_tokens: int = 512

class EmbeddingSettings(BaseModel):
    provider: str = "local"
    model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 500
    chunk_overlap: int = 50

class VectorDBSettings(BaseModel):
    engine: str = "faiss"
    host: str = "local://vector_store/faiss_index.bin"
    api_key: str = ""

class MaintenanceResponse(BaseModel):
    success: bool
    message: str
    data: dict = {}

class UploadSuccessData(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    uploaded_at: datetime
    status: str
    pages: int
    chunks: int
    category: str
    embedding_status: str
    index_status: str

class UploadResponse(BaseModel):
    success: bool
    message: str
    data: UploadSuccessData | None = None

class ErrorResponse(BaseModel):
    success: bool
    message: str
    error_code: str

class DocumentListItem(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    file_size_label: str
    uploaded_at: datetime
    category: str
    status: str
    semantic_score: float = 0.0

class DocumentsListResponse(BaseModel):
    success: bool
    data: List[DocumentListItem]

class RenameDocumentRequest(BaseModel):
    filename: str

class ReclassifyDocumentResponse(BaseModel):
    success: bool
    message: str
    data: DocumentListItem

class ReclassifyAllDocumentsResponse(BaseModel):
    success: bool
    message: str
    data: List[DocumentListItem]

class DeleteDocumentResponse(BaseModel):
    success: bool
    message: str
    data: dict = {"id": str}

class CleanedSemanticSearchResult(BaseModel):
    """Cleaned and formatted semantic search result for API responses."""
    document_id: str
    filename: str
    page: int | None = None
    title: str  # Clean, shortened title derived from filename
    snippet: str  # 1-3 sentence excerpt, cleaned and relevant
    score: float  # Similarity score (0-1, converted from distance)
    category: str = "Unknown"
    file_type: str = "unknown"

class CleanedSemanticSearchResponse(BaseModel):
    """Debug/Postman response wrapper for semantic search results."""
    success: bool = True
    query: str
    result_count: int
    results: List[CleanedSemanticSearchResult]
    execution_time_ms: float | None = None

class FrontendSemanticSearchResult(BaseModel):
    """Professional frontend response with complete metadata for UI rendering."""
    rank: int  # Position in results (1-based)
    document_id: str  # Unique document identifier
    filename: str  # Original filename
    page: int | None = None  # Page number (null if not available)
    score: float  # Similarity score (0-1, higher = more relevant)
    snippet: str  # 1-3 sentence clean excerpt
    category: str = "Unknown"  # Document classification

class FrontendSemanticSearchResponse(BaseModel):
    """Professional frontend response with metadata and total count."""
    query: str
    results: List[FrontendSemanticSearchResult]
    total_results: int  # Total number of results returned
