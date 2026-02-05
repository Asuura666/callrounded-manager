from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CurrentUser, DBSession, TenantId
from ..models import KnowledgeBaseCache
from ..schemas import KnowledgeBaseOut
from ..services import callrounded as cr

router = APIRouter()


@router.get("", response_model=list[KnowledgeBaseOut])
async def list_knowledge_bases(db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    kbs = await cr.list_knowledge_bases()
    now = datetime.now(timezone.utc)
    results: list[KnowledgeBaseOut] = []

    for kb in kbs:
        ext_id = str(kb.get("id", ""))
        name = kb.get("name", "")
        description = kb.get("description")
        source_count = kb.get("source_count", 0)
        agent_ext = kb.get("agent_id") or kb.get("agent_external_id")

        existing = await db.execute(
            select(KnowledgeBaseCache).where(
                KnowledgeBaseCache.tenant_id == tenant_id, KnowledgeBaseCache.external_id == ext_id
            )
        )
        cached = existing.scalar_one_or_none()
        if cached:
            cached.name = name
            cached.description = description
            cached.source_count = source_count
            cached.agent_external_id = str(agent_ext) if agent_ext else None
            cached.synced_at = now
        else:
            db.add(KnowledgeBaseCache(
                tenant_id=tenant_id, external_id=ext_id,
                agent_external_id=str(agent_ext) if agent_ext else None,
                name=name, description=description, source_count=source_count, synced_at=now,
            ))

        results.append(KnowledgeBaseOut(
            id=ext_id, agent_external_id=str(agent_ext) if agent_ext else None,
            name=name, description=description, source_count=source_count,
        ))

    await db.commit()

    if not results:
        q = await db.execute(select(KnowledgeBaseCache).where(KnowledgeBaseCache.tenant_id == tenant_id))
        for c in q.scalars().all():
            results.append(KnowledgeBaseOut(
                id=c.external_id, agent_external_id=c.agent_external_id,
                name=c.name, description=c.description, source_count=c.source_count,
            ))

    return results


@router.get("/{kb_id}", response_model=KnowledgeBaseOut | None)
async def get_knowledge_base(kb_id: str, db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    kb = await cr.get_knowledge_base(kb_id)
    if kb:
        return KnowledgeBaseOut(
            id=str(kb.get("id", kb_id)),
            agent_external_id=str(kb.get("agent_id", "")) if kb.get("agent_id") else None,
            name=kb.get("name", ""),
            description=kb.get("description"),
            source_count=kb.get("source_count", 0),
        )
    q = await db.execute(
        select(KnowledgeBaseCache).where(
            KnowledgeBaseCache.tenant_id == tenant_id, KnowledgeBaseCache.external_id == kb_id
        )
    )
    cached = q.scalar_one_or_none()
    if cached:
        return KnowledgeBaseOut(
            id=cached.external_id, agent_external_id=cached.agent_external_id,
            name=cached.name, description=cached.description, source_count=cached.source_count,
        )
    return None
