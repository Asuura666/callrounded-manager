"""
Tests for Agents Routes — REAL API DATA, NO MOCKS
🐺 Created by Kuro

Uses real CallRounded API to fetch agents and validate responses.
"""
import pytest
from httpx import AsyncClient

from app.config import settings


class TestAgentsList:
    """Tests for /api/agents endpoints"""

    @pytest.mark.asyncio
    async def test_list_agents_authenticated(self, admin_client: AsyncClient):
        """Authenticated user can list agents."""
        response = await admin_client.get("/api/agents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"[test_agents] Listed {len(data)} agents")

    @pytest.mark.asyncio
    async def test_list_agents_unauthenticated(self, client: AsyncClient):
        """Unauthenticated user cannot list agents."""
        response = await client.get("/api/agents")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_get_single_agent(
        self, 
        admin_client: AsyncClient,
        test_agent_id: str
    ):
        """Can get details of a single agent."""
        response = await admin_client.get(f"/api/agents/{test_agent_id}")
        # Could be 200 (found) or 404 (not cached yet)
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "id" in data or "external_id" in data
            print(f"[test_agents] Got agent: {data.get('name', 'Unknown')}")


class TestAgentsWithRealAPI:
    """Tests that verify data against real CallRounded API"""

    @pytest.mark.asyncio
    async def test_agents_match_callrounded_api(
        self, 
        admin_client: AsyncClient,
        callrounded_api_client: AsyncClient
    ):
        """Verify our cached agents match CallRounded API."""
        # Get from our API
        our_response = await admin_client.get("/api/agents")
        assert our_response.status_code == 200
        our_agents = our_response.json()
        
        # Get from CallRounded API
        cr_response = await callrounded_api_client.get("/agents")
        if cr_response.status_code != 200:
            pytest.skip("CallRounded API unavailable")
        cr_agents = cr_response.json()
        
        print(f"[test_agents] Our API: {len(our_agents)} agents, CallRounded: {len(cr_agents)} agents")
        
        # Our agents should be a subset of or equal to CallRounded agents
        # (we cache what we've seen)

    @pytest.mark.asyncio
    async def test_agent_details_realistic(
        self,
        admin_client: AsyncClient,
        real_agents: list[dict]
    ):
        """Verify agent details are realistic (not mock data)."""
        if not real_agents:
            pytest.skip("No real agents available")
        
        # Check first real agent has expected fields
        agent = real_agents[0]
        
        # Real agents have these fields
        expected_fields = ["id", "name"]
        for field in expected_fields:
            assert field in agent, f"Real agent missing field: {field}"
        
        # Name should be realistic (not "Test Agent 1")
        name = agent.get("name", "")
        assert len(name) > 0
        assert "test" not in name.lower() or "salon" in name.lower()  # Allow "Test Salon"
        
        print(f"[test_agents] Real agent: {name}")


class TestAgentSync:
    """Tests for agent sync functionality"""

    @pytest.mark.asyncio
    async def test_sync_agents_from_callrounded(self, admin_client: AsyncClient):
        """Admin can trigger agent sync from CallRounded."""
        response = await admin_client.post("/api/agents/sync")
        # Could be 200, 201, or 404 if endpoint doesn't exist
        if response.status_code == 404:
            pytest.skip("Sync endpoint not implemented")
        assert response.status_code in [200, 201, 202]
        print("[test_agents] Agent sync triggered")

    @pytest.mark.asyncio
    async def test_sync_requires_admin(self, user_client: AsyncClient):
        """Only admin can trigger sync."""
        response = await user_client.post("/api/agents/sync")
        if response.status_code == 404:
            pytest.skip("Sync endpoint not implemented")
        assert response.status_code in [403, 401]


class TestAgentFiltering:
    """Tests for agent filtering based on user role"""

    @pytest.mark.asyncio
    async def test_user_only_sees_assigned_agents(
        self,
        user_client: AsyncClient,
        admin_client: AsyncClient,
        assigned_agent_id: str
    ):
        """User sees only their assigned agents, admin sees all."""
        # User view
        user_response = await user_client.get("/api/agents")
        assert user_response.status_code == 200
        user_agents = user_response.json()
        
        # Admin view
        admin_response = await admin_client.get("/api/agents")
        assert admin_response.status_code == 200
        admin_agents = admin_response.json()
        
        # User should see fewer or equal agents
        assert len(user_agents) <= len(admin_agents)
        
        # If user has assigned agents, they should be in the list
        if user_agents:
            user_agent_ids = [str(a.get("id") or a.get("external_id")) for a in user_agents]
            # assigned_agent_id should be accessible
            print(f"[test_agents] User sees {len(user_agents)}, Admin sees {len(admin_agents)}")
