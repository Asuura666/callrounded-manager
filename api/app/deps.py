"""
CallRounded Manager - Dependencies
🐺 Updated by Kuro - Added role-based access control
"""
import uuid
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .auth import decode_token
from .database import async_session
from .models import Role, User, UserAgentAssignment


# ============================================================================
# DATABASE
# ============================================================================

async def get_db():
    async with async_session() as session:
        yield session


DBSession = Annotated[AsyncSession, Depends(get_db)]


# ============================================================================
# AUTHENTICATION
# ============================================================================

async def get_current_user(
    db: DBSession,
    access_token: str | None = Cookie(default=None),
) -> User:
    """Get current authenticated user with agent assignments preloaded."""
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    
    payload = decode_token(access_token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.agent_assignments))
        .where(User.id == uuid.UUID(user_id), User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# ============================================================================
# AUTHORIZATION
# ============================================================================

async def require_admin(current_user: CurrentUser) -> User:
    """Require user to be TENANT_ADMIN or SUPER_ADMIN."""
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    return current_user


AdminUser = Annotated[User, Depends(require_admin)]


async def require_super_admin(current_user: CurrentUser) -> User:
    """Require user to be SUPER_ADMIN."""
    if current_user.role != Role.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux super administrateurs"
        )
    return current_user


SuperAdminUser = Annotated[User, Depends(require_super_admin)]


# ============================================================================
# TENANT GUARD
# ============================================================================

def tenant_guard(current_user: CurrentUser) -> uuid.UUID:
    """Return the tenant_id from the authenticated user."""
    return current_user.tenant_id


TenantId = Annotated[uuid.UUID, Depends(tenant_guard)]


# ============================================================================
# AGENT ACCESS
# ============================================================================

async def get_accessible_agent_ids(
    current_user: CurrentUser,
    db: DBSession,
) -> list[str] | None:
    """
    Get list of agent external IDs accessible by current user.
    Returns None if user is admin (can access all agents).
    Returns list of assigned agent IDs otherwise.
    """
    if current_user.is_admin():
        return None  # Admin can access all
    
    return [a.agent_external_id for a in current_user.agent_assignments]


AccessibleAgentIds = Annotated[list[str] | None, Depends(get_accessible_agent_ids)]


def filter_by_accessible_agents(
    agent_ids: list[str] | None,
    agent_external_id: str,
) -> bool:
    """Check if an agent is accessible."""
    if agent_ids is None:
        return True  # Admin can access all
    return agent_external_id in agent_ids
