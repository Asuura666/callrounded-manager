from datetime import datetime, timezone

from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import CurrentUser, DBSession, TenantId
from ..models import CallCache
from ..schemas import CallOut
from ..services import callrounded as cr

router = APIRouter()


@router.get("", response_model=list[CallOut])
async def list_calls(
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: str | None = Query(None),
    agent_id: str | None = Query(None),
):
    calls = await cr.list_calls(limit=limit, offset=offset)
    now = datetime.now(timezone.utc)
    results: list[CallOut] = []

    for c in calls:
        ext_id = str(c.get("id", ""))
        call_status = c.get("status", "unknown")
        agent_ext = c.get("agent_id") or c.get("agent_external_id")

        # Apply filters
        if status and call_status != status:
            continue
        if agent_id and str(agent_ext) != agent_id:
            continue

        call_out = CallOut(
            id=ext_id,
            agent_external_id=str(agent_ext) if agent_ext else None,
            caller_number=c.get("caller_number") or c.get("from"),
            duration=c.get("duration"),
            status=call_status,
            transcription=c.get("transcription"),
            recording_url=c.get("recording_url"),
            started_at=c.get("started_at") or c.get("created_at"),
            ended_at=c.get("ended_at"),
        )
        results.append(call_out)

        # Upsert cache
        existing = await db.execute(
            select(CallCache).where(CallCache.tenant_id == tenant_id, CallCache.external_call_id == ext_id)
        )
        cached = existing.scalar_one_or_none()
        if cached:
            cached.status = call_status
            cached.duration = c.get("duration")
            cached.transcription = c.get("transcription")
            cached.recording_url = c.get("recording_url")
            cached.synced_at = now
        else:
            db.add(CallCache(
                tenant_id=tenant_id,
                agent_external_id=str(agent_ext) if agent_ext else None,
                external_call_id=ext_id,
                caller_number=c.get("caller_number") or c.get("from"),
                duration=c.get("duration"),
                status=call_status,
                transcription=c.get("transcription"),
                recording_url=c.get("recording_url"),
                started_at=c.get("started_at") or c.get("created_at"),
                ended_at=c.get("ended_at"),
                synced_at=now,
            ))

    await db.commit()

    # Fallback to cache if API returned nothing
    if not results:
        q = select(CallCache).where(CallCache.tenant_id == tenant_id).order_by(CallCache.started_at.desc()).limit(limit).offset(offset)
        if status:
            q = q.where(CallCache.status == status)
        if agent_id:
            q = q.where(CallCache.agent_external_id == agent_id)
        cached_calls = await db.execute(q)
        for c in cached_calls.scalars().all():
            results.append(CallOut(
                id=c.external_call_id, agent_external_id=c.agent_external_id,
                caller_number=c.caller_number, duration=c.duration, status=c.status,
                transcription=c.transcription, recording_url=c.recording_url,
                started_at=c.started_at, ended_at=c.ended_at,
            ))

    return results


@router.get("/{call_id}", response_model=CallOut | None)
async def get_call(call_id: str, db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    call = await cr.get_call(call_id)
    if call:
        return CallOut(
            id=str(call.get("id", call_id)),
            agent_external_id=str(call.get("agent_id", "")) if call.get("agent_id") else None,
            caller_number=call.get("caller_number") or call.get("from"),
            duration=call.get("duration"),
            status=call.get("status", "unknown"),
            transcription=call.get("transcription"),
            recording_url=call.get("recording_url"),
            started_at=call.get("started_at") or call.get("created_at"),
            ended_at=call.get("ended_at"),
        )
    # Fallback
    q = await db.execute(
        select(CallCache).where(CallCache.tenant_id == tenant_id, CallCache.external_call_id == call_id)
    )
    cached = q.scalar_one_or_none()
    if cached:
        return CallOut(
            id=cached.external_call_id, agent_external_id=cached.agent_external_id,
            caller_number=cached.caller_number, duration=cached.duration, status=cached.status,
            transcription=cached.transcription, recording_url=cached.recording_url,
            started_at=cached.started_at, ended_at=cached.ended_at,
        )
    return None
