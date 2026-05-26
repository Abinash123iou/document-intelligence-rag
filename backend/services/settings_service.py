import json
import os
from typing import Any

VECTOR_STORE_DIR = os.getenv("VECTOR_STORE_DIR", "vector_store")
SETTINGS_PATH = os.path.join(VECTOR_STORE_DIR, "settings.json")

DEFAULT_LLM_SETTINGS = {
    "provider": "groq",
    "model": "llama-3.1-8b-instant",
    "temperature": 0.0,
    "max_tokens": 512,
}

DEFAULT_EMBEDDING_SETTINGS = {
    "provider": "local",
    "model": "all-MiniLM-L6-v2",
    "chunk_size": 500,
    "chunk_overlap": 50,
}

DEFAULT_VECTOR_DB_SETTINGS = {
    "engine": "faiss",
    "host": f"local://{os.path.join(VECTOR_STORE_DIR, 'faiss_index.bin')}",
    "api_key": "",
}


def _load_settings() -> dict[str, Any]:
    if not os.path.exists(SETTINGS_PATH):
        return {}

    try:
        with open(SETTINGS_PATH, "r") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_settings(settings: dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(SETTINGS_PATH), exist_ok=True)
    with open(SETTINGS_PATH, "w") as f:
        json.dump(settings, f)


def get_llm_settings() -> dict[str, Any]:
    settings = _load_settings()
    return {
        **DEFAULT_LLM_SETTINGS,
        **settings.get("llm", {}),
    }


def update_llm_settings(llm_settings: dict[str, Any]) -> dict[str, Any]:
    settings = _load_settings()
    updated = {
        **DEFAULT_LLM_SETTINGS,
        **llm_settings,
    }
    settings["llm"] = updated
    _save_settings(settings)
    return updated


def get_embedding_settings() -> dict[str, Any]:
    settings = _load_settings()
    return {
        **DEFAULT_EMBEDDING_SETTINGS,
        **settings.get("embedding", {}),
    }


def update_embedding_settings(embedding_settings: dict[str, Any]) -> dict[str, Any]:
    settings = _load_settings()
    updated = {
        **DEFAULT_EMBEDDING_SETTINGS,
        **embedding_settings,
    }
    settings["embedding"] = updated
    _save_settings(settings)
    return updated


def get_vector_db_settings() -> dict[str, Any]:
    settings = _load_settings()
    return {
        **DEFAULT_VECTOR_DB_SETTINGS,
        **settings.get("vector_db", {}),
    }


def update_vector_db_settings(vector_db_settings: dict[str, Any]) -> dict[str, Any]:
    settings = _load_settings()
    updated = {
        **DEFAULT_VECTOR_DB_SETTINGS,
        **vector_db_settings,
    }
    settings["vector_db"] = updated
    _save_settings(settings)
    return updated
