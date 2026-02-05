import uuid
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import decode_token
from .database import async_session
from .models import User


async def get_db():
    async with async_session() as session:
        yield session


DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DBSession,
    access_token: str | None = Cookie(default=None),
) -> User:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    payload = decode_token(access_token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id), User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def tenant_guard(request: Request, current_user: CurrentUser) -> uuid.UUID:
    """Return the tenant_id from the authenticated user."""
    return current_user.tenant_id


TenantId = Annotated[uuid.UUID, Depends(tenant_guard)]
