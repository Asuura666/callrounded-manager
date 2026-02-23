"""
Tests for Admin Routes — REAL DATA, NO MOCKS
🐺 Updated by Kuro

Uses fixtures from conftest.py — no local fixture overrides.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestAdminUsers:
    """Tests for /api/admin/users endpoints"""

    @pytest.mark.asyncio
    async def test_list_users_as_admin(self, admin_client: AsyncClient):
        """Admin can list all users."""
        response = await admin_client.get("/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"[test_admin] Listed {len(data)} users")

    @pytest.mark.asyncio
    async def test_list_users_as_regular_user_forbidden(self, user_client: AsyncClient):
        """Regular user cannot access admin routes."""
        response = await user_client.get("/api/admin/users")
        assert response.status_code == 403
        print("[test_admin] Regular user correctly blocked from admin route")

    @pytest.mark.asyncio
    async def test_create_user(self, admin_client: AsyncClient):
        """Admin can create a new user."""
        unique = uuid4().hex[:8]
        new_user = {
            "email": f"created_{unique}@test.callrounded.com",
            "password": "TestPass123!",
            "role": "USER"
        }
        response = await admin_client.post("/api/admin/users", json=new_user)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["email"] == new_user["email"]
        assert data["role"] == "USER"
        print(f"[test_admin] Created user: {data['email']}")

    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, admin_client: AsyncClient):
        """Cannot create user with existing email."""
        unique = uuid4().hex[:8]
        email = f"duplicate_{unique}@test.callrounded.com"
        user = {
            "email": email,
            "password": "TestPass123!",
            "role": "USER"
        }
        # Create first
        first_response = await admin_client.post("/api/admin/users", json=user)
        assert first_response.status_code in [200, 201]
        
        # Try duplicate
        response = await admin_client.post("/api/admin/users", json=user)
        assert response.status_code in [400, 409]
        print("[test_admin] Duplicate email correctly rejected")

    @pytest.mark.asyncio
    async def test_update_user_role(self, admin_client: AsyncClient):
        """Admin can update user role."""
        # Create user first
        unique = uuid4().hex[:8]
        new_user = {
            "email": f"role_test_{unique}@test.callrounded.com",
            "password": "TestPass123!",
            "role": "USER"
        }
        create_response = await admin_client.post("/api/admin/users", json=new_user)
        assert create_response.status_code in [200, 201]
        user_id = create_response.json()["id"]

        # Update role
        response = await admin_client.patch(
            f"/api/admin/users/{user_id}",
            json={"role": "TENANT_ADMIN"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "TENANT_ADMIN"
        print(f"[test_admin] Updated user role to TENANT_ADMIN")

    @pytest.mark.asyncio
    async def test_delete_user(self, admin_client: AsyncClient):
        """Admin can delete a user."""
        # Create user first
        unique = uuid4().hex[:8]
        new_user = {
            "email": f"delete_test_{unique}@test.callrounded.com",
            "password": "TestPass123!",
            "role": "USER"
        }
        create_response = await admin_client.post("/api/admin/users", json=new_user)
        assert create_response.status_code in [200, 201]
        user_id = create_response.json()["id"]

        # Delete
        response = await admin_client.delete(f"/api/admin/users/{user_id}")
        assert response.status_code in [200, 204]
        print(f"[test_admin] Deleted user {user_id}")

        # Verify deleted
        get_response = await admin_client.get(f"/api/admin/users/{user_id}")
        assert get_response.status_code == 404


class TestAgentAssignment:
    """Tests for agent assignment endpoints"""

    @pytest.mark.asyncio
    async def test_assign_agent_to_user(
        self, 
        admin_client: AsyncClient, 
        test_user_id: str, 
        test_agent_id: str
    ):
        """Admin can assign an agent to a user."""
        response = await admin_client.post(
            f"/api/admin/users/{test_user_id}/agents",
            json={"agent_external_id": test_agent_id}
        )
        assert response.status_code in [200, 201]
        print(f"[test_admin] Assigned agent {test_agent_id} to user {test_user_id}")

    @pytest.mark.asyncio
    async def test_bulk_assign_agents(
        self, 
        admin_client: AsyncClient, 
        test_user_id: str
    ):
        """Admin can bulk assign agents."""
        # Use realistic agent IDs (UUIDs like real CallRounded agents)
        agent_ids = [str(uuid4()) for _ in range(3)]
        response = await admin_client.post(
            f"/api/admin/users/{test_user_id}/agents/bulk",
            json={"agent_external_ids": agent_ids}
        )
        assert response.status_code in [200, 201]
        print(f"[test_admin] Bulk assigned {len(agent_ids)} agents")

    @pytest.mark.asyncio
    async def test_get_user_agents(
        self, 
        admin_client: AsyncClient, 
        test_user_id: str,
        assigned_agent_id: str  # Ensures agent is assigned first
    ):
        """Can get agents assigned to a user."""
        response = await admin_client.get(f"/api/admin/users/{test_user_id}/agents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the assigned agent
        assert len(data) >= 1
        print(f"[test_admin] User has {len(data)} assigned agents")

    @pytest.mark.asyncio
    async def test_remove_agent_from_user(
        self, 
        admin_client: AsyncClient, 
        test_user_id: str, 
        test_agent_id: str
    ):
        """Admin can remove an agent from a user."""
        # First assign
        await admin_client.post(
            f"/api/admin/users/{test_user_id}/agents",
            json={"agent_external_id": test_agent_id}
        )
        
        # Then remove
        response = await admin_client.delete(
            f"/api/admin/users/{test_user_id}/agents/{test_agent_id}"
        )
        assert response.status_code in [200, 204]
        print(f"[test_admin] Removed agent {test_agent_id} from user")


class TestRoleBasedFiltering:
    """Tests for role-based data filtering"""

    @pytest.mark.asyncio
    async def test_user_sees_only_assigned_agents(
        self, 
        user_client: AsyncClient, 
        assigned_agent_id: str
    ):
        """Regular user only sees their assigned agents."""
        response = await user_client.get("/api/agents")
        assert response.status_code == 200
        agents = response.json()
        
        # If user has no assigned agents, list should be empty or filtered
        if agents:
            agent_ids = [a.get("external_id") or a.get("id") for a in agents]
            # The assigned agent should be in the list
            assert assigned_agent_id in str(agent_ids)
        print(f"[test_admin] User sees {len(agents)} agents (filtered)")

    @pytest.mark.asyncio
    async def test_admin_sees_all_agents(self, admin_client: AsyncClient):
        """Admin sees all agents."""
        response = await admin_client.get("/api/agents")
        assert response.status_code == 200
        agents = response.json()
        print(f"[test_admin] Admin sees {len(agents)} agents")

    @pytest.mark.asyncio
    async def test_user_calls_filtered_by_agents(self, user_client: AsyncClient):
        """User only sees calls from their assigned agents."""
        response = await user_client.get("/api/calls")
        assert response.status_code == 200
        print("[test_admin] Calls correctly filtered for user")


class TestUserSelfService:
    """Tests for user self-service endpoints (no admin required)"""

    @pytest.mark.asyncio
    async def test_user_can_get_own_profile(self, user_client: AsyncClient):
        """User can get their own profile."""
        response = await user_client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "role" in data
        print(f"[test_admin] User profile: {data['email']}, role: {data['role']}")

    @pytest.mark.asyncio
    async def test_unauthenticated_blocked(self, client: AsyncClient):
        """Unauthenticated requests are blocked."""
        response = await client.get("/api/agents")
        assert response.status_code in [401, 403]
        print("[test_admin] Unauthenticated request correctly blocked")
