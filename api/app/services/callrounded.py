"""CallRounded API client — proxies all external calls through the backend."""

import logging
from typing import Any

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 15.0


def _headers() -> dict[str, str]:
    return {"X-Api-Key": settings.CALLROUNDED_API_KEY, "Accept": "application/json"}


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=settings.CALLROUNDED_API_URL, headers=_headers(), timeout=_TIMEOUT)


# ── Agents ────────────────────────────────────────────────────────────

async def list_agents() -> list[dict[str, Any]]:
    try:
        async with _client() as client:
            resp = await client.get("/agents")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded list_agents failed: %s", exc)
        return []


async def get_agent(agent_id: str) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.get(f"/agents/{agent_id}")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded get_agent(%s) failed: %s", agent_id, exc)
        return None


async def patch_agent(agent_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.patch(f"/agents/{agent_id}", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded patch_agent(%s) failed: %s", agent_id, exc)
        return None


# ── Calls ─────────────────────────────────────────────────────────────

async def list_calls(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    try:
        async with _client() as client:
            resp = await client.get("/calls", params={"limit": limit, "offset": offset})
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded list_calls failed: %s", exc)
        return []


async def get_call(call_id: str) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.get(f"/calls/{call_id}")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded get_call(%s) failed: %s", call_id, exc)
        return None


# ── Phone Numbers ─────────────────────────────────────────────────────

async def list_phone_numbers() -> list[dict[str, Any]]:
    try:
        async with _client() as client:
            resp = await client.get("/phone-numbers")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded list_phone_numbers failed: %s", exc)
        return []


async def patch_phone_number(pn_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.patch(f"/phone-numbers/{pn_id}", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded patch_phone_number(%s) failed: %s", pn_id, exc)
        return None


# ── Knowledge Bases ───────────────────────────────────────────────────

async def list_knowledge_bases() -> list[dict[str, Any]]:
    try:
        async with _client() as client:
            # The API may not have a list endpoint; try common patterns
            resp = await client.get("/knowledge-bases")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded list_knowledge_bases failed: %s", exc)
        return []


async def get_knowledge_base(kb_id: str) -> dict[str, Any] | None:
    try:
        async with _client() as client:
            resp = await client.get(f"/knowledge-bases/{kb_id}")
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("CallRounded get_knowledge_base(%s) failed: %s", kb_id, exc)
        return None
