from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query

from backend.api.routes_dashboard import _format_duration, _unique_documents, dashboard_category_breakdown
from backend.services import activity_service

router = APIRouter()


def _parse_created_at(event: dict) -> datetime | None:
    try:
        return datetime.fromisoformat(event.get("created_at", ""))
    except ValueError:
        return None


def _query_events(days: int | None = None) -> list[dict]:
    events = [
        event for event in activity_service.get_events()
        if event.get("type") in {"semantic_search", "rag_query"}
    ]
    if not days:
        return events

    start_at = datetime.now() - timedelta(days=days)
    return [
        event for event in events
        if (created_at := _parse_created_at(event)) and created_at >= start_at
    ]


def _query_events_between(start_at: datetime, end_at: datetime) -> list[dict]:
    return [
        event for event in activity_service.get_events()
        if event.get("type") in {"semantic_search", "rag_query"}
        and (created_at := _parse_created_at(event))
        and start_at <= created_at < end_at
    ]


def _average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


@router.get("/analytics/overview")
async def analytics_overview(days: int = Query(30, ge=1, le=365)):
    try:
        query_events = _query_events(days)
        scores = [
            event.get("average_score")
            for event in query_events
            if isinstance(event.get("average_score"), (int, float))
        ]
        durations = [
            event.get("duration_ms")
            for event in query_events
            if isinstance(event.get("duration_ms"), (int, float))
        ]
        avg_score = _average(scores)
        total_queries = len(query_events)

        return {
            "total_queries": total_queries,
            "processed_docs": len(_unique_documents()),
            "avg_retrieval_score": round(avg_score, 4),
            "avg_retrieval_score_label": f"{round(avg_score * 100)}%",
            "avg_response_time_ms": round(_average(durations), 2),
            "avg_response_time_label": _format_duration(_average(durations)),
            "usage_growth_percent": 0,
            "category_breakdown": await dashboard_category_breakdown(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.get("/analytics/top-documents")
async def analytics_top_documents(days: int = Query(30, ge=1, le=365)):
    try:
        now = datetime.now()
        current_start = now - timedelta(days=days)
        previous_start = current_start - timedelta(days=days)
        previous_events = _query_events_between(previous_start, current_start)

        previous_counts = defaultdict(int)
        for event in previous_events:
            for document in event.get("documents", []):
                document_key = document.get("id") or document.get("filename") or "Unknown"
                previous_counts[document_key] += 1

        document_stats = defaultdict(lambda: {
            "id": None,
            "name": "Unknown",
            "queries": 0,
            "score_total": 0.0,
            "score_count": 0,
            "duration_total": 0.0,
            "duration_count": 0,
        })

        for event in _query_events(days):
            duration_ms = event.get("duration_ms")
            for document in event.get("documents", []):
                document_key = document.get("id") or document.get("filename") or "Unknown"
                stats = document_stats[document_key]
                stats["id"] = document_key
                stats["name"] = document.get("filename", "Unknown")
                stats["queries"] += 1

                score = document.get("score")
                if isinstance(score, (int, float)):
                    stats["score_total"] += score
                    stats["score_count"] += 1

                if isinstance(duration_ms, (int, float)):
                    stats["duration_total"] += duration_ms
                    stats["duration_count"] += 1

        documents = []
        for stats in document_stats.values():
            avg_score = stats["score_total"] / stats["score_count"] if stats["score_count"] else 0.0
            avg_duration = stats["duration_total"] / stats["duration_count"] if stats["duration_count"] else 0.0
            previous_queries = previous_counts.get(stats["id"], 0)
            if previous_queries == 0:
                trend_percent = 100 if stats["queries"] > 0 else 0
            else:
                trend_percent = round(((stats["queries"] - previous_queries) / previous_queries) * 100)
            trend_label = f"{'+' if trend_percent > 0 else ''}{trend_percent}%"
            documents.append({
                "id": stats["id"],
                "name": stats["name"],
                "queries": stats["queries"],
                "avgTime": _format_duration(avg_duration),
                "score": f"{round(avg_score * 100)}%",
                "trend": trend_label,
            })

        return sorted(documents, key=lambda item: item["queries"], reverse=True)[:5]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.get("/analytics/query-trends")
async def analytics_query_trends(days: int = Query(7, ge=1, le=365)):
    try:
        return activity_service.query_trends(days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
