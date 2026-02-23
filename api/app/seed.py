"""Seed script — creates default tenant and admin user."""

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import hash_password
from .database import async_session, engine
from .models import Base, Tenant, User


ADMIN_USERS = [
    {
        "email": "admin@wi-agency.fr",
        "password": "Admin2026!",
        "role": "TENANT_ADMIN",
    },
]


async def seed():
    # Create tables if they do not exist (dev convenience; use alembic in prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Tenant
        result = await db.execute(select(Tenant).where(Tenant.name == "W&I Agency"))
        tenant = result.scalar_one_or_none()
        if not tenant:
            # Check for old tenant name and rename
            result_old = await db.execute(select(Tenant).where(Tenant.name == "CallRounded Demo"))
            tenant = result_old.scalar_one_or_none()
            if tenant:
                tenant.name = "W&I Agency"
                print(f"✓ Tenant renamed: CallRounded Demo → W&I Agency ({tenant.id})")
            else:
                tenant = Tenant(name="W&I Agency", plan="pro")
                db.add(tenant)
                await db.flush()
                print(f"✓ Tenant created: {tenant.name} ({tenant.id})")
        else:
            print(f"· Tenant exists: {tenant.name} ({tenant.id})")

        # Admin users
        for admin in ADMIN_USERS:
            result = await db.execute(
                select(User).where(User.email == admin["email"], User.tenant_id == tenant.id)
            )
            user = result.scalar_one_or_none()
            if not user:
                user = User(
                    tenant_id=tenant.id,
                    email=admin["email"],
                    password_hash=hash_password(admin["password"]),
                    role=admin["role"],
                    is_active=True,
                )
                db.add(user)
                print(f"✓ Admin user created: {user.email}")
            else:
                print(f"· Admin user exists: {user.email}")

        await db.commit()

    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
