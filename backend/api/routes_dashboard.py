from collections import Counter
from datetime import datetime

from fastapi import APIRouter, HTTPException

from backend.services import activity_service, vector_service

router = APIRouter()


def _unique_documents() -> dict[str, dict]:
    documents = {}
    for chunk_metadata in vector_service.metadata:
        doc_id = chunk_metadata.get("doc_id")
        if doc_id and doc_id not in documents:
            documents[doc_id] = chunk_metadata
    return documents


def _format_duration(duration_ms: float) -> str:
    if duration_ms <= 0:
        return "0ms"
    if duration_ms < 1000:
        return f"{round(duration_ms)}ms"
    return f"{duration_ms / 1000:.1f}s"


def _relative_time(created_at: str) -> str:
    try:
        created = datetime.fromisoformat(created_at)
    except ValueError:
        return "Recently"

    delta = datetime.now() - created
    if delta.days > 0:
        return f"{delta.days} day{'s' if delta.days != 1 else ''} ago"

    hours = delta.seconds // 3600
    if hours > 0:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"

    minutes = delta.seconds // 60
    if minutes > 0:
        return f"{minutes} min{'s' if minutes != 1 else ''} ago"

    return "Just now"


@router.get("/dashboard/summary")
async def dashboard_summary():
    try:
        documents = _unique_documents()
        total_chunks = len(vector_service.metadata)
        total_ai_queries = activity_service.count_events("rag_query")
        average_retrieval_ms = activity_service.average_duration_ms({"semantic_search", "rag_query"})

        return {
            "total_documents": len(documents),
            "total_embeddings": total_chunks,
            "total_chunks": total_chunks,
            "total_ai_queries": total_ai_queries,
            "average_retrieval_ms": round(average_retrieval_ms, 2),
            "average_retrieval_label": _format_duration(average_retrieval_ms),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.get("/dashboard/recent-activity")
async def dashboard_recent_activity():
    try:
        return [
            {
                "id": event.get("id"),
                "type": event.get("type"),
                "title": event.get("title", "Activity"),
                "time": _relative_time(event.get("created_at", "")),
                "created_at": event.get("created_at"),
                "status": event.get("status", "success"),
            }
            for event in activity_service.get_recent_events()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.delete("/dashboard/recent-activity/{activity_id}")
async def delete_dashboard_activity(activity_id: str):
    try:
        deleted = activity_service.delete_event(activity_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Activity item not found.")

        return {
            "success": True,
            "message": "Activity item deleted.",
            "data": {"id": activity_id},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.get("/dashboard/category-breakdown")
async def dashboard_category_breakdown():
    try:
        category_counts = Counter(
            metadata.get("category", "Uncategorized")
            for metadata in _unique_documents().values()
        )
        colors = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#14B8A6"]

        return [
            {
                "name": category.replace("_", " ").title(),
                "value": count,
                "color": colors[index % len(colors)],
            }
            for index, (category, count) in enumerate(category_counts.items())
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.get("/dashboard/query-trends")
async def dashboard_query_trends():
    try:
        return activity_service.query_trends(days=7)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
