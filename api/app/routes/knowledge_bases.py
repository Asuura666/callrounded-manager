from fastapi import APIRouter

from ..deps import CurrentUser, DBSession, TenantId

router = APIRouter()


@router.get("")
async def list_knowledge_bases(db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    """Knowledge bases list - not available via API, return empty."""
    return []


@router.get("/{kb_id}")
async def get_knowledge_base(kb_id: str, db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    return None
