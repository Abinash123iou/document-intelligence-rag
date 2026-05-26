import re
from typing import Dict

CLASSIFICATION_RULES: Dict[str, Dict[str, int]] = {
    "resume": {
        r"\b(curriculum vitae|resume)\b": 5,
        r"\b(education|experience|skills|objective|career objective|projects)\b": 1,
    },
    "report": {
        r"\b(project report|mini project|major project|final report|internship report)\b": 6,
        r"\b(submitted in partial fulfillment|bonafide certificate|certificate|department of|guided by)\b": 4,
        r"\b(report|executive summary|findings|recommendations|analysis|appendix)\b": 2,
    },
    "research_paper": {
        r"\b(doi|issn|journal|volume|article id|received|accepted|published)\b": 4,
        r"\b(correspondence should be addressed|conflicts of interest|data availability)\b": 4,
        r"\b(abstract|introduction|methodology|results|conclusion|references)\b": 1,
    },
}

def classify_document(text: str, source_name: str = "") -> str:
    """
    Classifies a document based on keyword patterns in its text.

    Args:
        text: The extracted text of the document.
        source_name: Optional filename or title to include in classification.

    Returns:
        A string representing the document's classification.
    """
    # Convert text to lowercase for case-insensitive matching
    lower_text = f"{source_name}\n{text}".lower()

    scores = {}

    for doc_type, rules in CLASSIFICATION_RULES.items():
        score = 0
        for pattern, weight in rules.items():
            score += len(re.findall(pattern, lower_text, re.IGNORECASE)) * weight
        scores[doc_type] = score

    best_type, best_score = max(scores.items(), key=lambda item: item[1])
    if best_score > 0:
        return best_type

    return "general_document"
