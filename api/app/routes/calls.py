"""
CallRounded Manager - Calls Routes
"""
from fastapi import APIRouter, HTTPException, Query, status

from ..deps import AccessibleAgentIds, CurrentUser, DBSession, TenantId
from ..services import callrounded as cr

router = APIRouter()


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
):
    """List calls with basic info."""
    raw = await cr.list_calls(limit=limit, page=page)
    calls = raw.get("data", []) if isinstance(raw, dict) else raw
    results = []

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
    limit: int = Query(100, ge=1, le=500),
):
    """List calls with rich data formatted for frontend."""
    raw = await cr.list_calls(limit=limit, page=1)
    calls = raw.get("data", []) if isinstance(raw, dict) else raw
    results = []

    for c in calls:
        agent_ext = c.get("agent_id")
        agent_str = str(agent_ext) if agent_ext else None

        if accessible_agents is not None and agent_str not in accessible_agents:
            continue

        # Transform to frontend expected format
        results.append({
            "id": str(c.get("id", "")),
            "external_id": str(c.get("id", "")),
            "agent_name": "Agent de coiffure",
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

    return {"calls": results}


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
    
    # Return in frontend format
    return {
        "id": str(call.get("id", call_id)),
        "external_id": str(call.get("id", call_id)),
        "agent_name": "Agent de coiffure",
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
