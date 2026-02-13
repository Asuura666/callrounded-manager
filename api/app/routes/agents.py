"""
CallRounded Manager - Agent Routes
🐺 Updated by Kuro - Added role-based filtering
"""
from fastapi import APIRouter, HTTPException, status

from ..deps import AccessibleAgentIds, CurrentUser, DBSession, TenantId
from ..services import callrounded as cr

router = APIRouter()


@router.get("")
async def list_agents(
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
):
    """List agents. Users see only their assigned agents, admins see all."""
    agents = await cr.list_agents()
    
    # Filter by accessible agents if user is not admin
    if accessible_agents is not None:
        agents = [a for a in agents if a.get("id") in accessible_agents]
    
    return agents


@router.get("/{agent_id}")
async def get_agent(
    agent_id: str,
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
):
    """Get agent details. Users can only access assigned agents."""
    # Check access
    if accessible_agents is not None and agent_id not in accessible_agents:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cet agent"
        )
    
    return await cr.get_agent(agent_id)


@router.patch("/{agent_id}")
async def update_agent(
    agent_id: str,
    payload: dict,
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
):
    """Update agent. Users can only modify assigned agents."""
    # Check access
    if accessible_agents is not None and agent_id not in accessible_agents:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cet agent"
        )
    
    return await cr.update_agent(agent_id, payload)
