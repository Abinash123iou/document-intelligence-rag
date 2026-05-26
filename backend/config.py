import os
from dotenv import load_dotenv

load_dotenv()
backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Runtime storage configuration
VECTOR_STORE_DIR = os.getenv("VECTOR_STORE_DIR", "vector_store")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "backend/uploads")
VECTOR_STORE_PATH = os.path.join(VECTOR_STORE_DIR, "faiss_index.bin")
