import json
import os
from datetime import datetime, timedelta
from typing import Any

VECTOR_STORE_DIR = os.getenv("VECTOR_STORE_DIR", "vector_store")
ACTIVITY_PATH = os.path.join(VECTOR_STORE_DIR, "activity_log.json")


def _load_events() -> list[dict[str, Any]]:
    if not os.path.exists(ACTIVITY_PATH):
        return []

    try:
        with open(ACTIVITY_PATH, "r") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_events(events: list[dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(ACTIVITY_PATH), exist_ok=True)
    with open(ACTIVITY_PATH, "w") as f:
        json.dump(events[-500:], f)


def record_event(event_type: str, title: str, status: str = "success", **metadata: Any) -> None:
    events = _load_events()
    events.append({
        "id": f"event_{int(datetime.now().timestamp() * 1000)}",
        "type": event_type,
        "title": title,
        "status": status,
        "created_at": datetime.now().isoformat(),
        **metadata,
    })
    _save_events(events)


def get_recent_events(limit: int = 8) -> list[dict[str, Any]]:
    return sorted(_load_events(), key=lambda event: event.get("created_at", ""), reverse=True)[:limit]


def get_events() -> list[dict[str, Any]]:
    return _load_events()


def delete_event(event_id: str) -> bool:
    events = _load_events()
    remaining_events = [event for event in events if event.get("id") != event_id]
    if len(remaining_events) == len(events):
        return False

    _save_events(remaining_events)
    return True


def count_events(event_type: str | None = None) -> int:
    events = _load_events()
    if event_type is None:
        return len(events)
    return sum(1 for event in events if event.get("type") == event_type)


def average_duration_ms(event_types: set[str] | None = None) -> float:
    durations = []
    for event in _load_events():
        if event_types and event.get("type") not in event_types:
            continue
        duration_ms = event.get("duration_ms")
        if isinstance(duration_ms, (int, float)):
            durations.append(duration_ms)

    return sum(durations) / len(durations) if durations else 0.0


def query_trends(days: int = 7) -> list[dict[str, Any]]:
    today = datetime.now().date()
    buckets = {
        today - timedelta(days=offset): {"queries": 0, "documents": 0}
        for offset in range(days - 1, -1, -1)
    }

    for event in _load_events():
        try:
            event_date = datetime.fromisoformat(event.get("created_at", "")).date()
        except ValueError:
            continue

        if event_date not in buckets:
            continue

        if event.get("type") in {"semantic_search", "rag_query"}:
            buckets[event_date]["queries"] += 1
        elif event.get("type") == "upload":
            buckets[event_date]["documents"] += 1

    return [
        {
            "name": date.strftime("%a"),
            "date": date.isoformat(),
            **values,
        }
        for date, values in buckets.items()
    ]
