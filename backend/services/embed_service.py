from sentence_transformers import SentenceTransformer
from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the model once and reuse it
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Sentence Transformers model 'all-MiniLM-L6-v2' loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load Sentence Transformers model: {e}")
    model = None

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generates vector embeddings for a list of texts.
    """
    if not model:
        raise RuntimeError("Sentence Transformers model is not available.")
    
    try:
        embeddings = model.encode(texts).tolist()
        logger.info(f"Generated {len(embeddings)} embeddings.")
        return embeddings
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        raise

