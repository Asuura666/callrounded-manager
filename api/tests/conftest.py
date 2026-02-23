"""
CallRounded Manager — Test Fixtures
🐺 Created by Kuro

ZERO MOCK DATA — Uses real database and real API calls.
Uses pytest-asyncio auto mode to avoid event loop conflicts.
"""
import asyncio
import os
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

# ============================================================================
# CONFIGURATION
# ============================================================================

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://callrounded:callrounded@db:5432/callrounded_test"
)

# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)


# ============================================================================
# DATABASE ENGINE (Created once per session, in the right event loop)
# ============================================================================

_test_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker | None = None


def get_test_engine() -> AsyncEngine:
    """Get or create the test engine."""
    global _test_engine
    if _test_engine is None:
        _test_engine = create_async_engine(
            TEST_DATABASE_URL,
            echo=False,
            pool_pre_ping=False,  # Disable to avoid ping issues
            pool_size=5,
            max_overflow=10,
        )
    return _test_engine


def get_session_factory() -> async_sessionmaker:
    """Get or create the session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_test_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


# ============================================================================
# DATABASE SETUP (Tables created once)
# ============================================================================

@pytest_asyncio.fixture(scope="module")
async def setup_database():
    """Create all tables at the start of the test module."""
    from app.models import Base
    
    engine = get_test_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    # Dispose engine
    await engine.dispose()
    global _test_engine, _session_factory
    _test_engine = None
    _session_factory = None


@pytest_asyncio.fixture
async def db(setup_database) -> AsyncGenerator[AsyncSession, None]:
    """Get a fresh database session for each test."""
    factory = get_session_factory()
    session = factory()
    try:
        yield session
    finally:
        # Simple cleanup without async operations that might conflict
        pass


# ============================================================================
# TENANT & USER FIXTURES
# ============================================================================

@pytest_asyncio.fixture
async def test_tenant(db: AsyncSession):
    """Create a test tenant with real data."""
    from app.models import Tenant
    
    tenant = Tenant(
        id=uuid.uuid4(),
        name=f"Test Tenant {uuid.uuid4().hex[:8]}",
        plan="pro"
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant


@pytest_asyncio.fixture
async def admin_user(db: AsyncSession, test_tenant):
    """Create an admin user with real credentials."""
    from app.models import User, Role
    from app.auth import hash_password
    
    user = User(
        id=uuid.uuid4(),
        tenant_id=test_tenant.id,
        email=f"admin_{uuid.uuid4().hex[:8]}@test.callrounded.com",
        password_hash=hash_password("AdminPass123!"),
        role=Role.TENANT_ADMIN.value,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def regular_user(db: AsyncSession, test_tenant):
    """Create a regular user with real credentials."""
    from app.models import User, Role
    from app.auth import hash_password
    
    user = User(
        id=uuid.uuid4(),
        tenant_id=test_tenant.id,
        email=f"user_{uuid.uuid4().hex[:8]}@test.callrounded.com",
        password_hash=hash_password("UserPass123!"),
        role=Role.USER.value,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ============================================================================
# TOKEN FIXTURES
# ============================================================================

@pytest.fixture
def admin_token(admin_user):
    """Generate a real JWT token for admin user."""
    from app.auth import create_access_token
    return create_access_token(
        str(admin_user.id),
        str(admin_user.tenant_id),
        admin_user.role
    )


@pytest.fixture
def user_token(regular_user):
    """Generate a real JWT token for regular user."""
    from app.auth import create_access_token
    return create_access_token(
        str(regular_user.id),
        str(regular_user.tenant_id),
        regular_user.role
    )


# ============================================================================
# HTTP CLIENT FIXTURES
# ============================================================================

@pytest_asyncio.fixture
async def client(setup_database) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client for testing the API with overridden database."""
    from app.main import app
    from app.deps import get_db
    
    # Override database dependency to use test database
    async def override_get_db():
        factory = get_session_factory()
        async with factory() as session:
            try:
                yield session
            finally:
                await session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    finally:
        app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_client(client: AsyncClient, admin_token: str) -> AsyncClient:
    """HTTP client with admin authentication."""
    client.cookies.set("access_token", admin_token)
    return client


@pytest_asyncio.fixture
async def user_client(client: AsyncClient, user_token: str) -> AsyncClient:
    """HTTP client with regular user authentication."""
    client.cookies.set("access_token", user_token)
    return client


# ============================================================================
# AGENT FIXTURES
# ============================================================================

@pytest.fixture
def test_agent_id():
    """Real agent ID from CallRounded API."""
    from app.config import settings
    agent_id = settings.CALLROUNDED_AGENT_ID
    if not agent_id:
        pytest.skip("CALLROUNDED_AGENT_ID not configured")
    return agent_id


@pytest.fixture
def test_user_id(regular_user):
    """ID of the test regular user."""
    return str(regular_user.id)


@pytest_asyncio.fixture
async def assigned_agent_id(db: AsyncSession, regular_user, test_agent_id: str):
    """Assign a real agent to the test user."""
    from app.models import UserAgentAssignment
    
    assignment = UserAgentAssignment(
        user_id=regular_user.id,
        agent_external_id=test_agent_id
    )
    db.add(assignment)
    await db.commit()
    return test_agent_id


# ============================================================================
# CALLROUNDED API FIXTURES
# ============================================================================

@pytest_asyncio.fixture
async def callrounded_api_client() -> AsyncGenerator[AsyncClient, None]:
    """HTTP client for the real CallRounded API."""
    from app.config import settings
    
    if not settings.CALLROUNDED_API_KEY or settings.CALLROUNDED_API_KEY == "demo":
        pytest.skip("CALLROUNDED_API_KEY not configured")
    
    async with AsyncClient(
        base_url=settings.CALLROUNDED_API_URL,
        headers={"Authorization": f"Bearer {settings.CALLROUNDED_API_KEY}"}
    ) as api_client:
        yield api_client


@pytest_asyncio.fixture
async def real_agents(callrounded_api_client: AsyncClient):
    """Fetch real agents from CallRounded API."""
    response = await callrounded_api_client.get("/agents")
    if response.status_code != 200:
        pytest.skip(f"Failed to fetch agents: {response.status_code}")
    return response.json()


@pytest_asyncio.fixture
async def real_calls(callrounded_api_client: AsyncClient, test_agent_id: str):
    """Fetch real calls from CallRounded API."""
    response = await callrounded_api_client.get(
        f"/agents/{test_agent_id}/calls",
        params={"limit": 10}
    )
    if response.status_code != 200:
        return []
    return response.json()
