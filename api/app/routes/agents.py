from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CurrentUser, DBSession, TenantId
from ..models import AgentCache
from ..schemas import AgentOut, AgentPatch
from ..services import callrounded as cr

router = APIRouter()


@router.get("", response_model=list[AgentOut])
async def list_agents(db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    agents = await cr.list_agents()
    now = datetime.now(timezone.utc)
    results: list[AgentOut] = []

    for a in agents:
        ext_id = str(a.get("id", ""))
        name = a.get("name", "")
        status = a.get("status", "inactive")
        description = a.get("description")

        # Upsert into cache
        existing = await db.execute(
            select(AgentCache).where(AgentCache.tenant_id == tenant_id, AgentCache.external_id == ext_id)
        )
        cached = existing.scalar_one_or_none()
        if cached:
            cached.name = name
            cached.status = status
            cached.description = description
            cached.synced_at = now
        else:
            cached = AgentCache(
                tenant_id=tenant_id, external_id=ext_id, name=name,
                status=status, description=description, synced_at=now,
            )
            db.add(cached)

        results.append(AgentOut(id=ext_id, name=name, status=status, description=description))

    await db.commit()

    # If API returned nothing, fallback to cache
    if not results:
        q = await db.execute(select(AgentCache).where(AgentCache.tenant_id == tenant_id))
        for c in q.scalars().all():
            results.append(AgentOut(id=c.external_id, name=c.name, status=c.status, description=c.description))

    return results


@router.get("/{agent_id}", response_model=AgentOut | None)
async def get_agent(agent_id: str, db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    agent = await cr.get_agent(agent_id)
    if agent:
        return AgentOut(
            id=str(agent.get("id", agent_id)),
            name=agent.get("name", ""),
            status=agent.get("status", "inactive"),
            description=agent.get("description"),
        )
    # Fallback to cache
    q = await db.execute(
        select(AgentCache).where(AgentCache.tenant_id == tenant_id, AgentCache.external_id == agent_id)
    )
    cached = q.scalar_one_or_none()
    if cached:
        return AgentOut(id=cached.external_id, name=cached.name, status=cached.status, description=cached.description)
    return None


@router.patch("/{agent_id}", response_model=AgentOut | None)
async def update_agent(agent_id: str, body: AgentPatch, db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    payload = body.model_dump(exclude_none=True)
    result = await cr.patch_agent(agent_id, payload)

    # Update cache
    now = datetime.now(timezone.utc)
    q = await db.execute(
        select(AgentCache).where(AgentCache.tenant_id == tenant_id, AgentCache.external_id == agent_id)
    )
    cached = q.scalar_one_or_none()
    if cached:
        for k, v in payload.items():
            if hasattr(cached, k):
                setattr(cached, k, v)
        cached.synced_at = now
        await db.commit()

    if result:
        return AgentOut(
            id=str(result.get("id", agent_id)),
            name=result.get("name", ""),
            status=result.get("status", "inactive"),
            description=result.get("description"),
        )

    if cached:
        return AgentOut(id=cached.external_id, name=cached.name, status=cached.status, description=cached.description)
    return None
