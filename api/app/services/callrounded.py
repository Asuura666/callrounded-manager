"""CallRounded (Rounded) API client — proxies all external calls through the backend."""

import logging
from typing import Any

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 15.0


def _headers() -> dict[str, str]:
    return {"X-Api-Key": settings.CALLROUNDED_API_KEY, "Accept": "application/json"}


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=settings.CALLROUNDED_API_URL,
        headers=_headers(),
        timeout=_TIMEOUT,
    )


# ── Agents ────────────────────────────────────────────────────────────
# NOTE: Rounded API has NO list agents endpoint (GET /agents → 405)
# We use the configured agent ID to fetch the single agent

async def list_agents() -> list[dict[str, Any]]:
    """Return a list with the configured agent (Rounded has no list endpoint)."""
    if not settings.CALLROUNDED_AGENT_ID:
        return []
    agent = await get_agent(settings.CALLROUNDED_AGENT_ID)
    return [agent] if agent else []


async def get_agent(agent_id: str) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.get(f"/agents/{agent_id}")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data)
    except Exception as exc:
        logger.warning("CallRounded get_agent(%s) failed: %s", agent_id, exc)
        return None


async def update_agent(agent_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.patch(f"/agents/{agent_id}", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data)
    except Exception as exc:
        logger.warning("CallRounded update_agent(%s) failed: %s", agent_id, exc)
        return None


async def deploy_agent(agent_id: str) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.post(f"/agents/{agent_id}/deploy")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data)
    except Exception as exc:
        logger.warning("CallRounded deploy_agent(%s) failed: %s", agent_id, exc)
        return None


# ── Calls ─────────────────────────────────────────────────────────────

async def list_calls(limit: int = 50, page: int = 1) -> dict[str, Any]:
    try:
        async with _client() as client:
            resp = await client.get("/calls", params={"limit": limit, "page": page, "use_cursor": False})
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        logger.warning("CallRounded list_calls failed: %s", exc)
        return {"data": [], "total_items": 0}


async def get_call(call_id: str) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.get(f"/calls/{call_id}")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data)
    except Exception as exc:
        logger.warning("CallRounded get_call(%s) failed: %s", call_id, exc)
        return None


async def terminate_call(call_id: str) -> bool:
    try:
        async with _client() as client:
            resp = await client.post(f"/calls/{call_id}/terminate")
            resp.raise_for_status()
            return True
    except Exception as exc:
        logger.warning("CallRounded terminate_call(%s) failed: %s", call_id, exc)
        return False


# ── Phone Numbers ─────────────────────────────────────────────────────

async def list_phone_numbers(limit: int = 50) -> list[dict[str, Any]]:
    try:
        async with _client() as client:
            resp = await client.get("/phone-numbers", params={"limit": limit})
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])
    except Exception as exc:
        logger.warning("CallRounded list_phone_numbers failed: %s", exc)
        return []


async def update_phone_number(phone_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.patch(f"/phone-numbers/{phone_id}", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data)
    except Exception as exc:
        logger.warning("CallRounded update_phone_number(%s) failed: %s", phone_id, exc)
        return None


# ── Knowledge Bases ───────────────────────────────────────────────────

async def get_knowledge_base(kb_id: str) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.get(f"/knowledge-bases/{kb_id}")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data)
    except Exception as exc:
        logger.warning("CallRounded get_knowledge_base(%s) failed: %s", kb_id, exc)
        return None


async def create_agent(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Create a new agent via CallRounded API.
    
    Payload should include:
    - name: str
    - description: str (optional)
    - greeting_message: str (optional)
    - language: str (default: fr-FR)
    - voice: str (optional)
    """
    try:
        logger.info("CallRounded create_agent: %s", payload.get("name"))
        async with _client() as client:
            resp = await client.post("/agents", json=payload)
            resp.raise_for_status()
            data = resp.json()
            logger.info("CallRounded agent created: %s", data.get("data", {}).get("id"))
            return data.get("data", data)
    except Exception as exc:
        logger.error("CallRounded create_agent failed: %s", exc)
        return None


# ── Phone Numbers ─────────────────────────────────────────────────────

async def list_phone_numbers() -> list[dict[str, Any]]:
    """List all phone numbers."""
    try:
        async with _client() as client:
            resp = await client.get("/phone-numbers")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])
    except Exception as exc:
        logger.warning("CallRounded list_phone_numbers failed: %s", exc)
        return []


async def set_phone_redirect(phone_id: str, redirect: bool, redirect_number: str | None = None) -> dict[str, Any] | None:
    """Enable/disable call redirect on a phone number.
    Uses PUT with full payload and is_redirect_enabled field (matches CallRounded dashboard behavior)."""
    try:
        # First GET the current phone number config
        async with _client() as client:
            get_resp = await client.get(f"/phone-numbers/{phone_id}")
            get_resp.raise_for_status()
            current = get_resp.json().get("data", {})
        
        # Build full PUT payload matching CallRounded dashboard format
        payload = {
            "name": current.get("name", ""),
            "number": current.get("number", ""),
            "inbound_agent_id": current.get("inbound_agent_id"),
            "inbound_flow_id": current.get("inbound_flow_id"),
            "is_redirect_enabled": redirect,
            "redirect_phone_number": redirect_number or current.get("redirect_phone_number"),
            "media_encryption": "disable",
            "transport": "auto",
        }
        logger.info("set_phone_redirect PUT payload: is_redirect_enabled=%s for phone %s", redirect, phone_id)
        
        async with _client() as client:
            resp = await client.put(f"/phone-numbers/{phone_id}", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data)
    except Exception as exc:
        logger.warning("CallRounded set_phone_redirect(%s, %s) failed: %s", phone_id, redirect, exc)
        return None
