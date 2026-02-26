"""
CallRounded Manager - Calls Routes
"""
import time
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status

from ..deps import AccessibleAgentIds, CurrentUser, DBSession, TenantId
from ..services import callrounded as cr

router = APIRouter()

# === Bug #2 fix: agent name cache instead of hardcoded ===
_agent_name_cache: dict[str, tuple[str, float]] = {}
_CACHE_TTL = 300  # 5 minutes


async def get_agent_name(agent_id: str | None) -> str:
    """Fetch agent name from CallRounded API with caching."""
    if not agent_id:
        return "Agent inconnu"
    now = time.time()
    if agent_id in _agent_name_cache:
        name, cached_at = _agent_name_cache[agent_id]
        if now - cached_at < _CACHE_TTL:
            return name
    agent = await cr.get_agent(agent_id)
    name = agent.get("name", "Agent inconnu") if agent else "Agent inconnu"
    _agent_name_cache[agent_id] = (name, now)
    return name


def transform_transcript(raw_transcript):
    """Transform CallRounded transcript to frontend format."""
    if not raw_transcript:
        return []
    result = []
    for i, entry in enumerate(raw_transcript):
        role = entry.get("role", "agent")
        speaker = "agent" if role == "agent" else "caller"
        result.append({
            "speaker": speaker,
            "text": entry.get("content", ""),
            "timestamp": i * 5,  # Approximate timestamp
        })
    return result


@router.get("")
async def list_calls(
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1),
    call_status: str | None = Query(None, alias="status"),
    agent_id: str | None = Query(None),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None),
):
    """List calls with basic info."""
    raw = await cr.list_calls(limit=limit, page=page)
    calls = raw.get("data", []) if isinstance(raw, dict) else raw
    results = []

    # Parse date filters (Bug #4)
    filter_from = None
    filter_to = None
    if from_date:
        try:
            filter_from = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    if to_date:
        try:
            filter_to = datetime.strptime(to_date, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, tzinfo=timezone.utc
            )
        except ValueError:
            pass

    for c in calls:
        agent_ext = c.get("agent_id")
        agent_str = str(agent_ext) if agent_ext else None
        c_status = c.get("status", "unknown")

        if call_status and c_status != call_status:
            continue
        if agent_id and agent_str != agent_id:
            continue
        if accessible_agents is not None and agent_str not in accessible_agents:
            continue

        # Date filtering
        if filter_from or filter_to:
            start_str = c.get("start_time")
            if start_str:
                try:
                    start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                    if start_dt.tzinfo is None:
                        start_dt = start_dt.replace(tzinfo=timezone.utc)
                    if filter_from and start_dt < filter_from:
                        continue
                    if filter_to and start_dt > filter_to:
                        continue
                except (ValueError, AttributeError):
                    pass

        results.append({
            "id": str(c.get("id", "")),
            "agent_id": agent_str,
            "from_number": c.get("from_number"),
            "to_number": c.get("to_number"),
            "duration_seconds": c.get("duration_seconds"),
            "status": c_status,
            "transcript_string": c.get("transcript_string"),
            "transcript": c.get("transcript"),
            "cost": c.get("cost"),
            "start_time": c.get("start_time"),
            "end_time": c.get("end_time"),
        })

    return {
        "data": results,
        "total_items": len(results),
        "current_page": page,
        "total_pages": raw.get("total_pages", 1),
    }


@router.get("/rich")
async def list_calls_rich(
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    call_status: str | None = Query(None, alias="status"),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None),
):
    """List calls with rich data formatted for frontend (paginated)."""
    # Fetch more than needed to handle filtering
    fetch_limit = min(limit * 3, 500)
    raw = await cr.list_calls(limit=fetch_limit, page=1)
    calls = raw.get("data", []) if isinstance(raw, dict) else raw
    filtered = []

    # Parse date filters
    filter_from = None
    filter_to = None
    if from_date:
        try:
            filter_from = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    if to_date:
        try:
            filter_to = datetime.strptime(to_date, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, tzinfo=timezone.utc
            )
        except ValueError:
            pass

    for c in calls:
        agent_ext = c.get("agent_id")
        agent_str = str(agent_ext) if agent_ext else None

        if accessible_agents is not None and agent_str not in accessible_agents:
            continue

        c_status = c.get("status", "unknown")
        if call_status and c_status != call_status:
            continue

        # Date filtering
        if filter_from or filter_to:
            start_str = c.get("start_time")
            if start_str:
                try:
                    start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                    if start_dt.tzinfo is None:
                        start_dt = start_dt.replace(tzinfo=timezone.utc)
                    if filter_from and start_dt < filter_from:
                        continue
                    if filter_to and start_dt > filter_to:
                        continue
                except (ValueError, AttributeError):
                    pass

        filtered.append(c)

    # Paginate
    total_items = len(filtered)
    total_pages = max(1, (total_items + limit - 1) // limit)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    page_calls = filtered[start_idx:end_idx]

    results = []
    for c in page_calls:
        agent_ext = c.get("agent_id")
        agent_str = str(agent_ext) if agent_ext else None
        agent_name = await get_agent_name(agent_str)

        results.append({
            "id": str(c.get("id", "")),
            "external_id": str(c.get("id", "")),
            "agent_name": agent_name,
            "caller_number": c.get("from_number") or "",
            "caller_name": None,
            "direction": c.get("direction", "inbound"),
            "status": c.get("status", "completed"),
            "duration_seconds": c.get("duration_seconds") or 0,
            "started_at": c.get("start_time"),
            "ended_at": c.get("end_time"),
            "outcome": None,
            "sentiment": None,
            "transcript": transform_transcript(c.get("transcript")),
            "summary": c.get("transcript_string"),
            "recording_url": c.get("recording_url"),
            "tags": [],
            "cost": c.get("cost") or 0,
        })

    return {
        "calls": results,
        "total_items": total_items,
        "current_page": page,
        "total_pages": total_pages,
        "per_page": limit,
    }


@router.get("/{call_id}")
async def get_call(
    call_id: str,
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
):
    """Get call details with full transcript."""
    call = await cr.get_call(call_id)
    
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appel non trouvé")
    
    agent_id = str(call.get("agent_id", "")) if call.get("agent_id") else None
    
    if accessible_agents is not None and agent_id not in accessible_agents:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cet appel"
        )
    
    # Bug #2: dynamic agent name
    agent_name = await get_agent_name(agent_id)
    
    return {
        "id": str(call.get("id", call_id)),
        "external_id": str(call.get("id", call_id)),
        "agent_name": agent_name,
        "caller_number": call.get("from_number") or "",
        "caller_name": None,
        "direction": call.get("direction", "inbound"),
        "status": call.get("status", "completed"),
        "duration_seconds": call.get("duration_seconds") or 0,
        "started_at": call.get("start_time"),
        "ended_at": call.get("end_time"),
        "outcome": None,
        "sentiment": None,
        "transcript": transform_transcript(call.get("transcript")),
        "summary": call.get("transcript_string"),
        "recording_url": call.get("recording_url"),
        "tags": [],
        "cost": call.get("cost"),
        "variable_values": call.get("variable_values"),
        "post_call_answers": call.get("post_call_answers"),
    }
