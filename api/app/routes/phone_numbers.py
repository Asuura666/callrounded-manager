from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CurrentUser, DBSession, TenantId
from ..models import PhoneNumberCache
from ..schemas import PhoneNumberOut, PhoneNumberPatch
from ..services import callrounded as cr

router = APIRouter()


@router.get("", response_model=list[PhoneNumberOut])
async def list_phone_numbers(db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    numbers = await cr.list_phone_numbers()
    now = datetime.now(timezone.utc)
    results: list[PhoneNumberOut] = []

    for pn in numbers:
        ext_id = str(pn.get("id", ""))
        number = pn.get("number", pn.get("phone_number", ""))
        pn_status = pn.get("status", "inactive")
        agent_ext = pn.get("agent_id") or pn.get("agent_external_id")

        existing = await db.execute(
            select(PhoneNumberCache).where(
                PhoneNumberCache.tenant_id == tenant_id, PhoneNumberCache.external_id == ext_id
            )
        )
        cached = existing.scalar_one_or_none()
        if cached:
            cached.number = number
            cached.status = pn_status
            cached.agent_external_id = str(agent_ext) if agent_ext else None
            cached.synced_at = now
        else:
            db.add(PhoneNumberCache(
                tenant_id=tenant_id, external_id=ext_id,
                agent_external_id=str(agent_ext) if agent_ext else None,
                number=number, status=pn_status, synced_at=now,
            ))

        results.append(PhoneNumberOut(
            id=ext_id, agent_external_id=str(agent_ext) if agent_ext else None,
            number=number, status=pn_status,
        ))

    await db.commit()

    if not results:
        q = await db.execute(select(PhoneNumberCache).where(PhoneNumberCache.tenant_id == tenant_id))
        for c in q.scalars().all():
            results.append(PhoneNumberOut(
                id=c.external_id, agent_external_id=c.agent_external_id,
                number=c.number, status=c.status,
            ))

    return results


@router.patch("/{pn_id}", response_model=PhoneNumberOut | None)
async def update_phone_number(
    pn_id: str, body: PhoneNumberPatch, db: DBSession, current_user: CurrentUser, tenant_id: TenantId
):
    payload = body.model_dump(exclude_none=True)
    result = await cr.patch_phone_number(pn_id, payload)

    now = datetime.now(timezone.utc)
    q = await db.execute(
        select(PhoneNumberCache).where(PhoneNumberCache.tenant_id == tenant_id, PhoneNumberCache.external_id == pn_id)
    )
    cached = q.scalar_one_or_none()
    if cached:
        for k, v in payload.items():
            if hasattr(cached, k):
                setattr(cached, k, v)
        cached.synced_at = now
        await db.commit()

    if result:
        return PhoneNumberOut(
            id=str(result.get("id", pn_id)),
            agent_external_id=str(result.get("agent_id", "")) if result.get("agent_id") else None,
            number=result.get("number", result.get("phone_number", "")),
            status=result.get("status", "inactive"),
        )
    if cached:
        return PhoneNumberOut(id=cached.external_id, agent_external_id=cached.agent_external_id, number=cached.number, status=cached.status)
    return None
