"""
Text cleaning and processing utilities for semantic search results.

Handles:
- PDF extraction artifacts (merged words, broken formatting)
- Excessive whitespace and line breaks
- Section heading detection
- Snippet extraction (1-3 sentences)
- Reranking with keyword overlap scoring
"""

import re
import logging
from typing import Tuple
from collections import Counter

logger = logging.getLogger(__name__)


def fix_merged_words(text: str) -> str:
    """
    Attempt to fix common PDF extraction issues where words are merged.
    
    Examples:
        "Toensurecollision" -> "To ensure collision"
        "theobstacledetection" -> "the obstacle detection"
        "wastestedwithina20cm" -> "was tested within a 20 cm"
    """
    # Fix camelCase-like patterns where lowercase follows uppercase within words
    # This is a heuristic; only apply where reasonably confident
    fixed = re.sub(r'([a-z])([A-Z][a-z]+)', r'\1 \2', text)
    
    # Additional heuristic: detect sequences of lowercase letters followed by
    # more lowercase that should probably be separate words
    # Look for patterns like "theword" that might be "the word"
    # Very cautious - only for common short words at the start
    common_prefixes = [
        (r'\bthe([a-z]+[a-z]{2,})', r'the \1'),  # "theword" -> "the word"
        (r'\band([a-z]+[a-z]{2,})', r'and \1'),  # "andword" -> "and word"
        (r'\bwith([a-z]+[a-z]{2,})', r'with \1'),  # "withword" -> "with word"
        (r'\bwas([a-z]+[a-z]{2,})', r'was \1'),  # "wasword" -> "was word"
    ]
    
    for pattern, replacement in common_prefixes:
        fixed = re.sub(pattern, replacement, fixed, flags=re.IGNORECASE)
    
    return fixed


def normalize_whitespace(text: str) -> str:
    """
    Normalize excessive whitespace and line breaks.
    
    - Remove extra line breaks (keep max 1)
    - Collapse multiple spaces
    - Remove leading/trailing whitespace
    """
    # Remove hyphenated line breaks (e.g., "multi-\nline" -> "multiline")
    text = re.sub(r'-\s*\n\s*', '', text)
    # Replace single newlines with spaces to fix broken lines
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    # Replace multiple newlines with single newline
    text = re.sub(r'\n\s*\n+', '\n', text)
    # Replace multiple spaces with single space
    text = re.sub(r' +', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text


def detect_section_boundary(text: str) -> int | None:
    """
    Detect where a new section starts (e.g., "C. YOLOv8-Based Object Detection").
    
    Returns the index where the section heading starts, or None if not found.
    
    Common patterns:
        - "A. SectionName"
        - "1. SectionName"
        - "### SectionName"
        - "## SectionName"
    """
    # Match patterns like "A.", "B.", "1.", etc. followed by capital letter
    section_pattern = r'\n\s*[A-Z0-9]\.\s+[A-Z]'
    match = re.search(section_pattern, text)
    if match:
        return match.start()
    
    # Also match markdown-style headers
    markdown_pattern = r'\n#+\s+[A-Z]'
    match = re.search(markdown_pattern, text)
    if match:
        return match.start()
    
    return None


def is_reference_section(text: str) -> bool:
    """
    Detect if text is from a References or Bibliography section.
    
    Patterns:
        - Starts with citation number: "[1]", "[13]", etc.
        - Author citations with commas: "J. Arshad, M.A. Ashraf, ..."
        - Contains "et al."
        - Has URLs or DOIs
        - Ends with publication info: "pp.1-4", "vol. 10", etc.
    """
    # Check for citation numbers at start: [1], [13], etc.
    if re.match(r'^\s*\[\d+\]', text):
        return True
    
    # Check for author patterns: "LastName, FirstInitial."
    if re.search(r'[A-Z][a-z]+,\s+[A-Z]\.', text):
        return True
    
    # Check for "et al."
    if re.search(r'et\s+al\.', text):
        return True
    
    # Check for URLs/DOIs
    if re.search(r'(http|doi|www\.)', text, re.IGNORECASE):
        return True
    
    # Check for publication patterns: "pp.1-4", "vol.", "ISBN"
    if re.search(r'(pp\.|vol\.|ISBN|ISSN)\s+', text, re.IGNORECASE):
        return True
    
    # Check for year patterns: "(2023)", "(2024)", etc. at the end
    if re.search(r'\(\d{4}\)\s*\.?\s*$', text.strip()):
        return True
    
    return False


def remove_citation_numbers(text: str) -> str:
    """
    Remove citation numbers like [1], [13], [27] from text.
    
    Example:
        "The algorithm [1] uses deep learning [27]" 
        -> "The algorithm uses deep learning"
    """
    # Remove citation numbers in square brackets
    text = re.sub(r'\s*\[\d+\]\s*', ' ', text)
    # Clean up resulting double spaces
    text = re.sub(r' +', ' ', text)
    return text.strip()


def remove_reference_lines(text: str) -> str:
    """
    Remove lines that appear to be from a References section.
    
    Keeps the main content but removes bibliography entries.
    """
    lines = text.split('\n')
    filtered_lines = []
    
    for line in lines:
        # Skip lines that look like references
        if is_reference_section(line):
            continue
        filtered_lines.append(line)
    
    return '\n'.join(filtered_lines).strip()


def filter_reference_content(text: str) -> str:
    """
    Clean text by removing reference/bibliography content.
    
    Pipeline:
    1. Remove citation numbers [1], [13], etc.
    2. Filter out reference section lines
    3. Normalize whitespace
    """
    if not text:
        return ""
    
    # Step 1: Remove citation numbers
    text = remove_citation_numbers(text)
    
    # Step 2: Filter reference lines
    text = remove_reference_lines(text)
    
    return text


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences with a simple, robust regex."""
    if not text:
        return []
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text.strip()) if s.strip()]


def _is_heading_like(sentence: str) -> bool:
    """Heuristic to detect headings or section titles."""
    if not sentence:
        return False
    if len(sentence) < 12 and sentence.isupper():
        return True
    if re.match(r'^[A-Z0-9\s\-\:]+$', sentence) and len(sentence.split()) <= 6:
        return True
    if re.match(r'^[A-Z0-9]\.?\s+[A-Z]', sentence):
        return True
    return False


def extract_relevant_snippet(text: str, query: str | None, max_sentences: int = 3) -> str:
    """
    Extract 1-3 complete sentences, preferring the most relevant window for the query.
    """
    # First check for section boundaries and truncate if found
    section_idx = detect_section_boundary(text)
    if section_idx is not None and section_idx > 0:
        text = text[:section_idx]

    sentences = _split_sentences(text)
    if not sentences:
        return ""

    # Filter out heading-like or very short sentences
    candidates = [s for s in sentences if len(s) >= 20 and not _is_heading_like(s)]
    if not candidates:
        candidates = sentences

    if not query:
        snippet = ' '.join(candidates[:max_sentences])
        return snippet[:497] + '...' if len(snippet) > 500 else snippet

    query_keywords = extract_query_keywords(query)
    best_score = -1.0
    best_window = candidates[:max_sentences]

    # Build windows over original sentence list to preserve order
    for start_idx in range(0, len(sentences)):
        window = sentences[start_idx:start_idx + max_sentences]
        if not window:
            continue
        window_text = ' '.join(window)
        if _is_heading_like(window[0]):
            continue

        window_words = set(re.findall(r'\b\w+\b', window_text.lower()))
        overlap = len(query_keywords & window_words) if query_keywords else 0
        number_bonus = 0.05 if re.search(r'\d+', window_text) else 0.0
        length_penalty = -0.05 if len(window_text) < 60 else 0.0
        score = overlap + number_bonus + length_penalty

        if score > best_score:
            best_score = score
            best_window = window

    snippet = ' '.join(best_window)
    if len(snippet) > 500:
        snippet = snippet[:497] + '...'
    return snippet.strip()


def clean_chunk_text(chunk_text: str) -> str:
    """
    Main cleaning function combining all cleanup steps.
    
    Pipeline:
    1. Fix merged words from PDF extraction
    2. Normalize whitespace
    3. Return cleaned text
    """
    if not chunk_text:
        return ""
    
    # Step 1: Fix merged words
    text = fix_merged_words(chunk_text)
    
    # Step 2: Normalize whitespace
    text = normalize_whitespace(text)
    # Remove stray control characters
    text = re.sub(r'[\x00-\x1F\x7F]', ' ', text)
    text = re.sub(r' +', ' ', text).strip()
    
    return text


def create_title_from_filename(filename: str, max_length: int = 50) -> str:
    """
    Create a clean, readable title from a filename.
    
    - Remove file extension
    - Replace underscores/hyphens with spaces
    - Capitalize properly
    """
    # Remove file extension
    name_without_ext = re.sub(r'\.[a-z0-9]+$', '', filename, flags=re.IGNORECASE)
    
    # Replace underscores and hyphens with spaces
    title = re.sub(r'[_-]', ' ', name_without_ext)
    
    # Capitalize first letter of each word
    title = ' '.join(word.capitalize() for word in title.split())
    
    # Truncate if too long
    if len(title) > max_length:
        title = title[:max_length].rsplit(' ', 1)[0] + '...'
    
    return title


def convert_distance_to_similarity_score(distance: float) -> float:
    """
    Convert L2 distance (from FAISS) to a similarity score (0-1).
    
    L2 distance ranges from 0 to ~2 for normalized embeddings.
    We convert using: similarity = 1 / (1 + distance)
    
    This gives:
        - distance 0 -> similarity 1.0
        - distance 1 -> similarity 0.5
        - distance 2 -> similarity 0.33
    """
    if distance < 0:
        distance = 0
    similarity = 1.0 / (1.0 + distance)
    return round(similarity, 4)


def process_search_result(
    raw_result: dict,
    include_debug: bool = False,
    query: str | None = None
) -> Tuple[dict, str | None]:
    """
    Process a raw search result into a clean, formatted response.
    
    Args:
        raw_result: Dictionary from vector_service.search_similar()
        include_debug: If True, include raw chunk_text for debugging
    
    Returns:
        Tuple of (cleaned_result_dict, optional_raw_chunk_text)
    """
    chunk_text = raw_result.get('text', '')
    raw_distance = raw_result.get('score', 0)
    
    # Clean the chunk text
    cleaned_text = clean_chunk_text(chunk_text)
    
    # Filter out reference/bibliography content
    cleaned_text = filter_reference_content(cleaned_text)
    
    # Extract snippet (1-3 sentences) with query relevance
    snippet = extract_relevant_snippet(cleaned_text, query=query, max_sentences=3)
    
    # If cleaning resulted in empty snippet, use first 200 chars as fallback
    if not snippet:
        snippet = cleaned_text[:200] + ('...' if len(cleaned_text) > 200 else '')
    
    # Convert distance to similarity score
    similarity_score = convert_distance_to_similarity_score(raw_distance)
    
    # Create clean title from filename
    filename = raw_result.get('filename', 'Unknown')
    title = create_title_from_filename(filename)
    
    result = {
        'document_id': raw_result.get('doc_id', 'unknown'),
        'filename': filename,
        'page': raw_result.get('page', None),
        'title': title,
        'snippet': snippet,
        'score': similarity_score,
        'category': raw_result.get('category', 'Unknown'),
        'file_type': raw_result.get('file_type', 'unknown'),
    }
    
    # Optionally include raw text for debug/Postman mode
    debug_text = chunk_text if include_debug else None
    
    return result, debug_text


def extract_query_keywords(query: str) -> set[str]:
    """
    Extract meaningful keywords from a query for reranking.
    Filters out common stop words.
    
    Examples:
        "GDPR compliance requirements" -> {"gdpr", "compliance", "requirements"}
        "ultrasonic sensor collision avoidance threshold 20 cm" -> {"ultrasonic", "sensor", "collision", "avoidance", "threshold"}
    """
    stop_words = {
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'what',
        'which', 'who', 'when', 'where', 'why', 'how'
    }
    
    # Split on whitespace and punctuation, convert to lowercase
    words = re.findall(r'\b\w+\b', query.lower())
    
    # Filter: keep only words longer than 2 chars and not in stop words
    keywords = {w for w in words if len(w) > 2 and w not in stop_words}
    
    return keywords


def calculate_keyword_overlap_score(
    snippet: str,
    query_keywords: set[str],
    query_text: str | None = None,
    max_score: float = 0.3
) -> float:
    """
    Calculate keyword overlap bonus (0 to max_score).
    
    Higher overlap = higher bonus.
    Numbers and technical terms get higher weight.
    """
    if not query_keywords:
        return 0.0
    
    snippet_lower = snippet.lower()
    
    # Count exact word matches
    snippet_words = set(re.findall(r'\b\w+\b', snippet_lower))
    matches = len(query_keywords & snippet_words)
    
    # Bonus for containing numbers (often technical specs)
    has_numbers = bool(re.search(r'\d+', snippet))
    number_bonus = 0.05 if has_numbers else 0.0

    # Bonus for exact phrase match
    phrase_bonus = 0.0
    if query_text:
        normalized_query = re.sub(r'\s+', ' ', query_text.strip().lower())
        if normalized_query and normalized_query in snippet_lower:
            phrase_bonus = 0.05
    
    # Calculate overlap ratio
    if not query_keywords:
        overlap_ratio = 0.0
    else:
        overlap_ratio = matches / len(query_keywords)
    
    # Convert ratio to score
    keyword_score = overlap_ratio * max_score + number_bonus + phrase_bonus
    
    return min(keyword_score, max_score)  # Cap at max_score


def calculate_noise_penalty(text: str) -> float:
    """
    Detect and penalize noisy/incomplete chunks.
    
    Penalties applied for:
    - Excessive special characters (PDF noise)
    - Very short text (incomplete)
    - Unbalanced brackets/quotes (corruption)
    - Lots of line breaks (fragmented)
    
    Returns penalty value (0 to -0.2)
    """
    if not text or len(text) < 20:
        return -0.2  # Too short, likely incomplete
    
    penalty = 0.0
    
    # Penalty for excessive special characters (> 20% of text)
    special_char_ratio = len(re.findall(r'[^a-zA-Z0-9\s\.\,\-\'\"]', text)) / len(text)
    if special_char_ratio > 0.2:
        penalty -= 0.05
    
    # Penalty for many line breaks indicating fragmentation
    line_break_ratio = text.count('\n') / len(text.split())
    if line_break_ratio > 0.3:
        penalty -= 0.05
    
    # Penalty for unbalanced brackets/quotes
    open_brackets = text.count('(') + text.count('[')
    close_brackets = text.count(')') + text.count(']')
    if abs(open_brackets - close_brackets) > 2:
        penalty -= 0.03
    
    return max(penalty, -0.2)  # Cap maximum penalty


def rerank_results(
    results: list[dict],
    query: str,
    semantic_weight: float = 0.7,
    keyword_weight: float = 0.2,
    quality_weight: float = 0.1,
) -> list[dict]:
    """
    Rerank search results using combined scoring.
    
    Final score = (semantic_score * semantic_weight) +
                  (keyword_overlap * keyword_weight) +
                  (quality_adjustment * quality_weight)
    
    Args:
        results: List of processed search results with 'score' and 'snippet'
        query: Original search query
        semantic_weight: Weight for original semantic similarity (default 0.7)
        keyword_weight: Weight for keyword overlap (default 0.2)
        quality_weight: Weight for content quality (default 0.1)
    
    Returns:
        Reranked results sorted by combined score
    """
    if not results:
        return []
    
    query_keywords = extract_query_keywords(query)
    
    # Calculate reranking scores
    for result in results:
        semantic_score = result.get('score', 0.5)
        
        # Normalize semantic score if needed
        if semantic_score > 1.0:
            semantic_score = convert_distance_to_similarity_score(semantic_score)
        
        snippet = result.get('snippet', '')
        
        # Calculate components
        keyword_score = calculate_keyword_overlap_score(snippet, query_keywords, query_text=query)
        quality_score = 1.0 + calculate_noise_penalty(snippet)  # 0.8 to 1.0
        
        # Weighted combination
        combined_score = (
            semantic_score * semantic_weight +
            keyword_score * keyword_weight +
            quality_score * quality_weight
        )
        
        # Store original and combined scores
        result['score'] = min(combined_score, 1.0)  # Cap at 1.0
        result['_semantic_score'] = semantic_score
        result['_keyword_score'] = keyword_score
        result['_quality_score'] = quality_score
    
    # Sort by combined score descending
    results_sorted = sorted(results, key=lambda x: x['score'], reverse=True)
    
    return results_sorted

