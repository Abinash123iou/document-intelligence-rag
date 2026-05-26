import faiss
import numpy as np
from typing import List, Dict, Any
import logging
import os
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FAISS index and metadata storage paths
INDEX_PATH = "vector_store/faiss_index.bin"
METADATA_PATH = "vector_store/metadata.json"

# Ensure the vector_store directory exists
os.makedirs("vector_store", exist_ok=True)

dimension = 384  # Dimension for 'all-MiniLM-L6-v2'
index = None
metadata = []

def create_index():
    """Initializes a new FAISS index."""
    global index
    index = faiss.IndexFlatL2(dimension)
    logger.info("New FAISS index created.")

def reset_store() -> None:
    """Clears the in-memory and persisted vector index metadata."""
    global metadata
    create_index()
    metadata = []
    save_index()
    logger.info("Vector store reset.")

def load_index():
    """Loads the FAISS index and metadata from disk."""
    global index, metadata
    if os.path.exists(INDEX_PATH):
        try:
            index = faiss.read_index(INDEX_PATH)
            logger.info("FAISS index loaded from disk.")
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}. Creating a new one.")
            create_index()
    else:
        create_index()

    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                metadata = json.load(f)
            logger.info("Metadata loaded from disk.")
        except Exception as e:
            logger.error(f"Failed to load metadata: {e}. Starting with empty metadata.")
            metadata = []

def save_index():
    """Saves the FAISS index and metadata to disk."""
    if index is not None:
        try:
            faiss.write_index(index, INDEX_PATH)
            logger.info("FAISS index saved to disk.")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    try:
        with open(METADATA_PATH, "w") as f:
            json.dump(metadata, f)
        logger.info("Metadata saved to disk.")
    except Exception as e:
        logger.error(f"Failed to save metadata: {e}")

# Load the index when the service starts
load_index()

def add_chunks(doc_id: str, chunks: List[str], embeddings: List[List[float]], doc_metadata: Dict[str, Any] | None = None):
    """Adds chunk embeddings and metadata to the index."""
    if index is None:
        raise RuntimeError("FAISS index is not initialized.")
        
    start_index = index.ntotal
    index.add(np.array(embeddings, dtype=np.float32))
    
    for i, chunk in enumerate(chunks):
        chunk_metadata = {
            "doc_id": doc_id,
            "chunk_id": start_index + i,
            "text": chunk
        }
        
        # Keep searchable document context on every chunk so API results are self-contained.
        if doc_metadata:
            chunk_metadata.update(doc_metadata)
        
        metadata.append(chunk_metadata)
    
    save_index()
    logger.info(f"Added {len(chunks)} chunks for document '{doc_id}'.")

def search_similar(query_embedding: List[float], k: int = 5, doc_id: str | None = None, doc_ids: List[str] | None = None) -> List[Dict[str, Any]]:
    """
    Searches for the most similar chunks in the index.
    If doc_id or doc_ids is provided, the search is scoped to those documents.
    """
    if index is None or index.ntotal == 0:
        return []

    # Consolidate target document IDs
    target_doc_ids = []
    if doc_ids:
        target_doc_ids.extend(doc_ids)
    if doc_id and doc_id not in target_doc_ids:
        target_doc_ids.append(doc_id)

    # If document filters are active, find relevant indices
    if target_doc_ids:
        relevant_indices = [i for i, m in enumerate(metadata) if m.get("doc_id") in target_doc_ids]
        if not relevant_indices:
            return [] # No chunks found for these doc_ids
        
        # Create a temporary index with only the relevant vectors
        relevant_vectors = index.reconstruct_n(0, index.ntotal)[relevant_indices]
        temp_index = faiss.IndexFlatL2(dimension)
        temp_index.add(np.array(relevant_vectors, dtype=np.float32))
        
        distances, indices = temp_index.search(np.array([query_embedding], dtype=np.float32), k)
        
        # Map the results from the temporary index back to the original metadata
        original_indices = [relevant_indices[i] for i in indices[0]]
    else:
        # Perform a global search if no document filters are provided
        distances, indices = index.search(np.array([query_embedding], dtype=np.float32), k)
        original_indices = indices[0]

    results = []
    for i, dist in zip(original_indices, distances[0]):
        if 0 <= i < len(metadata):
            result_item = metadata[i].copy() # Use copy to avoid modifying original metadata
            result_item['score'] = float(dist)
            results.append(result_item)
            
    return results

def update_document_metadata(doc_id: str, updates: Dict[str, Any]) -> bool:
    """
    Updates metadata fields for every chunk associated with a document.
    """
    updated = False
    for chunk_metadata in metadata:
        if chunk_metadata.get("doc_id") == doc_id:
            chunk_metadata.update(updates)
            updated = True

    if updated:
        save_index()
        logger.info(f"Updated metadata for document '{doc_id}'.")
    else:
        logger.warning(f"Document '{doc_id}' not found for metadata update.")

    return updated

def delete_document(doc_id: str) -> bool:
    """
    Deletes all chunks associated with a document from the index.
    """
    global index, metadata
    
    if index is None:
        logger.warning("FAISS index is not initialized.")
        return False
    
    # Find all chunks belonging to this document
    indices_to_delete = [i for i, m in enumerate(metadata) if m.get("doc_id") == doc_id]
    
    if not indices_to_delete:
        logger.warning(f"Document '{doc_id}' not found in metadata.")
        return False
    
    try:
        # Create a new index without the chunks to delete
        remaining_vectors = []
        remaining_metadata = []
        
        for i in range(len(metadata)):
            if i not in indices_to_delete:
                # Only add vectors that are still in the index
                try:
                    vector = index.reconstruct(i)
                    remaining_vectors.append(vector)
                    remaining_metadata.append(metadata[i])
                except Exception as e:
                    logger.warning(f"Could not reconstruct vector {i}: {e}")
                    continue
        
        # Rebuild the index
        index = faiss.IndexFlatL2(dimension)
        if remaining_vectors:
            index.add(np.array(remaining_vectors, dtype=np.float32))
        
        metadata = remaining_metadata
        save_index()
        
        logger.info(f"Deleted document '{doc_id}' with {len(indices_to_delete)} chunks.")
        return True
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise
