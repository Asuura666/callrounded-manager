from fastapi import APIRouter

from ..deps import CurrentUser, DBSession, TenantId
from ..services import callrounded as cr

router = APIRouter()


@router.get("")
async def list_agents(db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    agents = await cr.list_agents()
    return agents


@router.get("/{agent_id}")
async def get_agent(agent_id: str, db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    return await cr.get_agent(agent_id)


@router.patch("/{agent_id}")
async def update_agent(agent_id: str, payload: dict, db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    return await cr.update_agent(agent_id, payload)
