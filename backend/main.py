from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import routes_upload, routes_search, routes_rag, routes_dashboard, routes_analytics, routes_settings
import os

API_DESCRIPTION = """
Document Intelligence RAG API for uploading documents, extracting text, indexing chunks,
semantic search, document previews, analytics, and retrieval-augmented chat.

Use the deployed API base URL:

`https://docintel-backend-8nqr.onrender.com/api/v1`

Main flows:

- Upload PDF, DOCX, or TXT documents.
- Retrieve and manage indexed documents.
- Run semantic search with `/api/v1/semantic-search`.
- Ask RAG questions with `/api/v1/rag-query`.
- Preview original files, extracted text, or formatted DOCX HTML.
"""

OPENAPI_TAGS = [
    {
        "name": "Health",
        "description": "Service health and root status endpoints.",
    },
    {
        "name": "Upload",
        "description": "Upload PDF, DOCX, and TXT files for extraction, classification, chunking, and indexing.",
    },
    {
        "name": "Documents & Search",
        "description": "List, manage, preview, download, and semantically search indexed documents.",
    },
    {
        "name": "RAG",
        "description": "Retrieval-augmented generation endpoint for document-grounded answers.",
    },
    {
        "name": "Dashboard",
        "description": "Operational dashboard summary, recent activity, category breakdown, and query trends.",
    },
    {
        "name": "Analytics",
        "description": "Analytics views for usage, top documents, and query trends.",
    },
    {
        "name": "Settings",
        "description": "LLM, embedding, vector DB, and maintenance settings.",
    },
]

app = FastAPI(
    title="Document Intelligence RAG API",
    description=API_DESCRIPTION,
    version="1.0.0",
    openapi_tags=OPENAPI_TAGS,
    swagger_ui_parameters={
        "defaultModelsExpandDepth": 1,
        "displayRequestDuration": True,
        "docExpansion": "none",
        "persistAuthorization": True,
        "tryItOutEnabled": True,
    },
)

def _cors_origins() -> list[str]:
    origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=os.getenv(
        "FRONTEND_ORIGIN_REGEX",
        r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$|^https://.*\.vercel\.app$",
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(routes_search.router, prefix="/api/v1", tags=["Documents & Search"])
app.include_router(routes_rag.router, prefix="/api/v1", tags=["RAG"])
app.include_router(routes_dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(routes_analytics.router, prefix="/api/v1", tags=["Analytics"])
app.include_router(routes_settings.router, prefix="/api/v1", tags=["Settings"])

@app.get("/", tags=["Health"], summary="Root health check")
def read_root():
    return {"message": "Welcome to the Document Intelligence API"}

@app.get("/healthz", tags=["Health"], summary="Service health check")
def health_check():
    return {"status": "ok"}
