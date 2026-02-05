"""Seed script — creates default tenant and admin user."""

import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import hash_password
from .database import async_session, engine
from .models import Base, Tenant, User


async def seed():
    # Create tables if they do not exist (dev convenience; use alembic in prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Tenant
        result = await db.execute(select(Tenant).where(Tenant.name == "CallRounded Demo"))
        tenant = result.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name="CallRounded Demo", plan="pro")
            db.add(tenant)
            await db.flush()
            print(f"✓ Tenant created: {tenant.name} ({tenant.id})")
        else:
            print(f"· Tenant exists: {tenant.name} ({tenant.id})")

        # Admin user
        result = await db.execute(select(User).where(User.email == "admin@callrounded.local"))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                tenant_id=tenant.id,
                email="admin@callrounded.local",
                password_hash=hash_password("CallRounded2026!"),
                role="TENANT_ADMIN",
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
