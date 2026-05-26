from typing import List
import logging
import hashlib
import math
import os
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "384"))
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "hash").lower()
_model = None


def _get_transformer_model():
    global _model

    if _model is not None:
        return _model

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise RuntimeError(
            "Sentence Transformers is not installed. Use EMBEDDING_PROVIDER=hash "
            "or install sentence-transformers on a larger instance."
        ) from exc

    _model = SentenceTransformer("all-MiniLM-L6-v2")
    logger.info("Sentence Transformers model 'all-MiniLM-L6-v2' loaded successfully.")
    return _model


def _hash_embedding(text: str) -> List[float]:
    vector = [0.0] * DIMENSION
    tokens = re.findall(r"[a-z0-9]+", (text or "").lower())

    for token in tokens:
        digest = hashlib.md5(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "little") % DIMENSION
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[index] += sign

    norm = math.sqrt(sum(value * value for value in vector))
    if norm:
        vector = [value / norm for value in vector]

    return vector

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generates vector embeddings for a list of texts.
    """
    try:
        if EMBEDDING_PROVIDER == "sentence-transformers":
            model = _get_transformer_model()
            embeddings = model.encode(texts).tolist()
        else:
            embeddings = [_hash_embedding(text) for text in texts]

        logger.info(f"Generated {len(embeddings)} embeddings.")
        return embeddings
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        raise

