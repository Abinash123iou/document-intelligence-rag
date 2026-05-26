from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import routes_upload, routes_search, routes_rag, routes_dashboard, routes_analytics, routes_settings
import os

app = FastAPI(title="Document Intelligence API")

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

app.include_router(routes_upload.router, prefix="/api/v1")
app.include_router(routes_search.router, prefix="/api/v1")
app.include_router(routes_rag.router, prefix="/api/v1")
app.include_router(routes_dashboard.router, prefix="/api/v1")
app.include_router(routes_analytics.router, prefix="/api/v1")
app.include_router(routes_settings.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Document Intelligence API"}
