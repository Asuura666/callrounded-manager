"""
CallRounded Manager - Admin Routes
🐺 Created by Kuro - User management and agent assignments
"""
import uuid
from datetime import datetime

import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from ..auth import hash_password
from ..deps import AdminUser, DBSession, TenantId
from ..models import Role, Tenant, User, UserAgentAssignment, AgentCache
from ..schemas import TenantPatch

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================================
# SCHEMAS
# ============================================================================

class UserCreate(BaseModel):
    email: str
    password: str
    role: str = Role.USER.value


class UserUpdate(BaseModel):
    email: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime
    assigned_agents: list[str] = []

    model_config = {"from_attributes": True}


class AgentAssignment(BaseModel):
    agent_external_id: str


class AgentAssignmentBulk(BaseModel):
    agent_external_ids: list[str]


class AssignmentOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    agent_external_id: str
    assigned_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# USER CRUD
# ============================================================================

@router.get("/users", response_model=list[UserOut])
async def list_users(
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """List all users in the tenant."""
    logger.info("admin.list_users", admin_id=str(admin.id), tenant_id=str(tenant_id))
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.agent_assignments))
        .where(User.tenant_id == tenant_id)
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    
    return [
        UserOut(
            id=u.id,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            assigned_agents=[a.agent_external_id for a in u.agent_assignments],
        )
        for u in users
    ]


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Create a new user in the tenant."""
    logger.info("admin.create_user", admin_id=str(admin.id), email=body.email, role=body.role)
    
    # Validate role
    if body.role not in [r.value for r in Role]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle invalide. Valeurs acceptées: {[r.value for r in Role]}"
        )
    
    # Check if email already exists in tenant
    existing = await db.execute(
        select(User).where(User.tenant_id == tenant_id, User.email == body.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un utilisateur avec cet email existe déjà"
        )
    
    # Create user
    user = User(
        tenant_id=tenant_id,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info("admin.user_created", user_id=str(user.id), email=user.email)
    
    return UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        assigned_agents=[],
    )


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Get a specific user."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.agent_assignments))
        .where(User.id == user_id, User.tenant_id == tenant_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    
    return UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        assigned_agents=[a.agent_external_id for a in user.agent_assignments],
    )


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Update a user."""
    logger.info("admin.update_user", admin_id=str(admin.id), user_id=str(user_id))
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.agent_assignments))
        .where(User.id == user_id, User.tenant_id == tenant_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    
    # Prevent self-demotion for admins
    if user.id == admin.id and body.role and body.role != user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas modifier votre propre rôle"
        )
    
    # Validate role if provided
    if body.role and body.role not in [r.value for r in Role]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle invalide. Valeurs acceptées: {[r.value for r in Role]}"
        )
    
    # Apply updates
    if body.email is not None:
        user.email = body.email
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    
    await db.commit()
    await db.refresh(user)
    
    logger.info("admin.user_updated", user_id=str(user.id))
    
    return UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        assigned_agents=[a.agent_external_id for a in user.agent_assignments],
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Delete a user."""
    logger.info("admin.delete_user", admin_id=str(admin.id), user_id=str(user_id))
    
    # Prevent self-deletion
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    
    await db.delete(user)
    await db.commit()
    
    logger.info("admin.user_deleted", user_id=str(user_id))


# ============================================================================
# AGENT ASSIGNMENTS
# ============================================================================

@router.get("/users/{user_id}/agents", response_model=list[AssignmentOut])
async def list_user_agents(
    user_id: uuid.UUID,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """List agents assigned to a user."""
    # Verify user exists in tenant
    user_result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    
    result = await db.execute(
        select(UserAgentAssignment)
        .where(UserAgentAssignment.user_id == user_id)
        .order_by(UserAgentAssignment.assigned_at.desc())
    )
    return result.scalars().all()


@router.post("/users/{user_id}/agents", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
async def assign_agent(
    user_id: uuid.UUID,
    body: AgentAssignment,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Assign an agent to a user."""
    logger.info(
        "admin.assign_agent",
        admin_id=str(admin.id),
        user_id=str(user_id),
        agent_id=body.agent_external_id,
    )
    
    # Verify user exists in tenant
    user_result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    
    # Verify agent exists in tenant cache
    agent_result = await db.execute(
        select(AgentCache).where(
            AgentCache.tenant_id == tenant_id,
            AgentCache.external_id == body.agent_external_id,
        )
    )
    if not agent_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent non trouvé")
    
    # Check if already assigned
    existing = await db.execute(
        select(UserAgentAssignment).where(
            UserAgentAssignment.user_id == user_id,
            UserAgentAssignment.agent_external_id == body.agent_external_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Agent déjà assigné à cet utilisateur"
        )
    
    # Create assignment
    assignment = UserAgentAssignment(
        user_id=user_id,
        agent_external_id=body.agent_external_id,
        assigned_by=admin.id,
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    
    logger.info("admin.agent_assigned", assignment_id=str(assignment.id))
    
    return assignment


@router.post("/users/{user_id}/agents/bulk", response_model=list[AssignmentOut], status_code=status.HTTP_201_CREATED)
async def assign_agents_bulk(
    user_id: uuid.UUID,
    body: AgentAssignmentBulk,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Assign multiple agents to a user at once."""
    logger.info(
        "admin.assign_agents_bulk",
        admin_id=str(admin.id),
        user_id=str(user_id),
        count=len(body.agent_external_ids),
    )
    
    # Verify user exists in tenant
    user_result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    
    # Get existing assignments
    existing_result = await db.execute(
        select(UserAgentAssignment.agent_external_id)
        .where(UserAgentAssignment.user_id == user_id)
    )
    existing_ids = {row[0] for row in existing_result.fetchall()}
    
    # Create new assignments
    assignments = []
    for agent_id in body.agent_external_ids:
        if agent_id not in existing_ids:
            assignment = UserAgentAssignment(
                user_id=user_id,
                agent_external_id=agent_id,
                assigned_by=admin.id,
            )
            db.add(assignment)
            assignments.append(assignment)
    
    await db.commit()
    
    # Refresh all
    for a in assignments:
        await db.refresh(a)
    
    logger.info("admin.agents_assigned_bulk", count=len(assignments))
    
    return assignments


@router.delete("/users/{user_id}/agents/{agent_external_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_agent(
    user_id: uuid.UUID,
    agent_external_id: str,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Remove an agent assignment from a user."""
    logger.info(
        "admin.unassign_agent",
        admin_id=str(admin.id),
        user_id=str(user_id),
        agent_id=agent_external_id,
    )
    
    result = await db.execute(
        delete(UserAgentAssignment)
        .where(
            UserAgentAssignment.user_id == user_id,
            UserAgentAssignment.agent_external_id == agent_external_id,
        )
        .returning(UserAgentAssignment.id)
    )
    
    if not result.fetchone():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignation non trouvée")
    
    await db.commit()
    logger.info("admin.agent_unassigned")


# ============================================================================
# TENANT AGENTS (for assignment UI)
# ============================================================================

@router.get("/agents")
async def list_all_agents(
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """List all agents in tenant (for assignment dropdown)."""
    result = await db.execute(
        select(AgentCache)
        .where(AgentCache.tenant_id == tenant_id)
        .order_by(AgentCache.name)
    )
    agents = result.scalars().all()
    
    return [
        {
            "external_id": a.external_id,
            "name": a.name,
            "status": a.status,
        }
        for a in agents
    ]


# ── Tenant Settings ───────────────────────────────────────────────────

@router.get("/tenant")
async def get_tenant(db: DBSession, tenant_id: TenantId, admin: AdminUser):
    """Get current tenant info."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant non trouvé")
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "display_name": tenant.display_name,
        "plan": tenant.plan,
        "created_at": tenant.created_at.isoformat(),
    }


@router.patch("/tenant")
async def update_tenant(body: TenantPatch, db: DBSession, tenant_id: TenantId, admin: AdminUser):
    """Update tenant settings (display_name)."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant non trouvé")

    if body.display_name is not None:
        tenant.display_name = body.display_name

    await db.commit()
    await db.refresh(tenant)

    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "display_name": tenant.display_name,
        "plan": tenant.plan,
        "created_at": tenant.created_at.isoformat(),
    }
