from datetime import datetime, timezone

from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import CurrentUser, DBSession, TenantId
from ..models import CallCache
from ..schemas import CallOut
from ..services import callrounded as cr

router = APIRouter()


@router.get("")
async def list_calls(
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1),
    status: str | None = Query(None),
    agent_id: str | None = Query(None),
):
    raw = await cr.list_calls(limit=limit, page=page)
    calls = raw.get("data", []) if isinstance(raw, dict) else raw
    now = datetime.now(timezone.utc)
    results = []

    for c in calls:
        ext_id = str(c.get("id", ""))
        call_status = c.get("status", "unknown")
        agent_ext = c.get("agent_id")

        if status and call_status != status:
            continue
        if agent_id and str(agent_ext) != agent_id:
            continue

        results.append({
            "id": ext_id,
            "agent_id": str(agent_ext) if agent_ext else None,
            "from_number": c.get("from_number"),
            "to_number": c.get("to_number"),
            "duration_seconds": c.get("duration_seconds"),
            "status": call_status,
            "transcript_string": c.get("transcript_string"),
            "transcript": c.get("transcript"),
            "cost": c.get("cost"),
            "start_time": c.get("start_time"),
            "end_time": c.get("end_time"),
            "metadata": c.get("metadata"),
            "variable_values": c.get("variable_values"),
        })

    return {
        "data": results,
        "total_items": raw.get("total_items", len(results)),
        "current_page": raw.get("current_page", page),
        "total_pages": raw.get("total_pages", 1),
    }


@router.get("/{call_id}")
async def get_call(call_id: str, db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    call = await cr.get_call(call_id)
    if call:
        return {
            "id": str(call.get("id", call_id)),
            "agent_id": str(call.get("agent_id", "")) if call.get("agent_id") else None,
            "from_number": call.get("from_number"),
            "to_number": call.get("to_number"),
            "duration_seconds": call.get("duration_seconds"),
            "status": call.get("status", "unknown"),
            "transcript_string": call.get("transcript_string"),
            "transcript": call.get("transcript"),
            "cost": call.get("cost"),
            "start_time": call.get("start_time"),
            "end_time": call.get("end_time"),
            "metadata": call.get("metadata"),
            "variable_values": call.get("variable_values"),
            "post_call_answers": call.get("post_call_answers"),
        }
    return None
