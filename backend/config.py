import os
from dotenv import load_dotenv

load_dotenv()
backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Vector store configuration
VECTOR_STORE_PATH = "vector_store/faiss_index.bin"
