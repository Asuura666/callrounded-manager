from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from ..auth import create_access_token, create_refresh_token, verify_password, decode_token
from ..deps import CurrentUser, DBSession
from ..models import User, Tenant
from ..schemas import LoginRequest, UserResponse
from fastapi import Cookie

router = APIRouter()


@router.post("/login")
async def login(body: LoginRequest, response: Response, db: DBSession):
    result = await db.execute(select(User).where(User.email == body.email, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")

    access = create_access_token(str(user.id), str(user.tenant_id), user.role)
    refresh = create_refresh_token(str(user.id), str(user.tenant_id), user.role)

    response.set_cookie("access_token", access, httponly=True, samesite="lax", secure=True, max_age=900)
    response.set_cookie("refresh_token", refresh, httponly=True, samesite="lax", secure=True, max_age=7 * 86400)

    # Fetch tenant name
    t = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = t.scalar_one_or_none()

    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        tenant_id=user.tenant_id,
        tenant_name=tenant.display_name or tenant.name if tenant else None,
        tenant_display_name=tenant.display_name if tenant else None,
        agent_enabled=tenant.agent_enabled if tenant else True,
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"detail": "Déconnexion réussie"}


@router.get("/me")
async def me(current_user: CurrentUser, db: DBSession):
    t = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = t.scalar_one_or_none()
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        tenant_id=current_user.tenant_id,
        tenant_name=tenant.display_name or tenant.name if tenant else None,
        tenant_display_name=tenant.display_name if tenant else None,
        agent_enabled=tenant.agent_enabled if tenant else True,
    )


@router.post("/refresh")
async def refresh_token(response: Response, db: DBSession, refresh_token: str | None = Cookie(default=None)):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token manquant")
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalide")

    user_id = payload.get("sub")
    tenant_id = payload.get("tenant_id")
    role = payload.get("role")

    access = create_access_token(user_id, tenant_id, role)
    response.set_cookie("access_token", access, httponly=True, samesite="lax", secure=True, max_age=900)
    return {"detail": "Token rafraîchi"}
