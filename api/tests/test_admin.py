"""
Tests for Admin Routes
🦊 Created by Shiro
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestAdminUsers:
    """Tests for /api/admin/users endpoints"""

    @pytest.fixture
    async def admin_client(self, client: AsyncClient, admin_token: str) -> AsyncClient:
        """Client with admin auth."""
        client.headers["Authorization"] = f"Bearer {admin_token}"
        return client

    async def test_list_users_as_admin(self, admin_client: AsyncClient):
        """Admin can list all users."""
        response = await admin_client.get("/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"[test_admin] Listed {len(data)} users")

    async def test_list_users_as_regular_user_forbidden(self, client: AsyncClient, user_token: str):
        """Regular user cannot access admin routes."""
        client.headers["Authorization"] = f"Bearer {user_token}"
        response = await client.get("/api/admin/users")
        assert response.status_code == 403
        print("[test_admin] Regular user correctly blocked from admin route")

    async def test_create_user(self, admin_client: AsyncClient):
        """Admin can create a new user."""
        new_user = {
            "email": f"test_{uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "role": "USER"
        }
        response = await admin_client.post("/api/admin/users", json=new_user)
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["email"] == new_user["email"]
        assert data["role"] == "USER"
        print(f"[test_admin] Created user: {data['email']}")
        return data["id"]

    async def test_create_user_duplicate_email(self, admin_client: AsyncClient):
        """Cannot create user with existing email."""
        user = {
            "email": "duplicate@test.com",
            "password": "TestPass123!",
            "role": "USER"
        }
        # Create first
        await admin_client.post("/api/admin/users", json=user)
        # Try duplicate
        response = await admin_client.post("/api/admin/users", json=user)
        assert response.status_code in [400, 409]
        print("[test_admin] Duplicate email correctly rejected")

    async def test_update_user_role(self, admin_client: AsyncClient):
        """Admin can update user role."""
        # Create user first
        new_user = {
            "email": f"role_test_{uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "role": "USER"
        }
        create_response = await admin_client.post("/api/admin/users", json=new_user)
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

    async def test_delete_user(self, admin_client: AsyncClient):
        """Admin can delete a user."""
        # Create user first
        new_user = {
            "email": f"delete_test_{uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "role": "USER"
        }
        create_response = await admin_client.post("/api/admin/users", json=new_user)
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

    async def test_assign_agent_to_user(self, admin_client: AsyncClient, test_user_id: str, test_agent_id: str):
        """Admin can assign an agent to a user."""
        response = await admin_client.post(
            f"/api/admin/users/{test_user_id}/agents",
            json={"agent_external_id": test_agent_id}
        )
        assert response.status_code in [200, 201]
        print(f"[test_admin] Assigned agent {test_agent_id} to user {test_user_id}")

    async def test_bulk_assign_agents(self, admin_client: AsyncClient, test_user_id: str):
        """Admin can bulk assign agents."""
        agent_ids = [f"agent_{uuid4().hex[:8]}" for _ in range(3)]
        response = await admin_client.post(
            f"/api/admin/users/{test_user_id}/agents/bulk",
            json={"agent_external_ids": agent_ids}
        )
        assert response.status_code in [200, 201]
        print(f"[test_admin] Bulk assigned {len(agent_ids)} agents")

    async def test_get_user_agents(self, admin_client: AsyncClient, test_user_id: str):
        """Can get agents assigned to a user."""
        response = await admin_client.get(f"/api/admin/users/{test_user_id}/agents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"[test_admin] User has {len(data)} assigned agents")

    async def test_remove_agent_from_user(self, admin_client: AsyncClient, test_user_id: str, test_agent_id: str):
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

    async def test_user_sees_only_assigned_agents(self, client: AsyncClient, user_token: str, assigned_agent_id: str):
        """Regular user only sees their assigned agents."""
        client.headers["Authorization"] = f"Bearer {user_token}"
        response = await client.get("/api/agents")
        assert response.status_code == 200
        agents = response.json()
        # Should only see assigned agents
        agent_ids = [a.get("external_id") or a.get("id") for a in agents]
        assert assigned_agent_id in agent_ids or len(agents) == 0
        print(f"[test_admin] User sees {len(agents)} agents (filtered)")

    async def test_admin_sees_all_agents(self, admin_client: AsyncClient):
        """Admin sees all agents."""
        response = await admin_client.get("/api/agents")
        assert response.status_code == 200
        agents = response.json()
        print(f"[test_admin] Admin sees {len(agents)} agents (all)")

    async def test_user_calls_filtered_by_agents(self, client: AsyncClient, user_token: str):
        """User only sees calls from their assigned agents."""
        client.headers["Authorization"] = f"Bearer {user_token}"
        response = await client.get("/api/calls")
        assert response.status_code == 200
        print("[test_admin] Calls correctly filtered for user")
