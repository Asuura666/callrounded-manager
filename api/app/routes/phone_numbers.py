"""
CallRounded Manager - Phone Numbers Routes
🦊 Shiro — Bug #7: Extract phone numbers from call data
since the /phone-numbers API endpoint is not available.
"""
from fastapi import APIRouter

from ..deps import AccessibleAgentIds, CurrentUser, DBSession, TenantId
from ..services import callrounded as cr
from .calls import get_agent_name

router = APIRouter()


@router.get("")
async def list_phone_numbers(
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
):
    """
    Extract phone numbers from call data since the /phone-numbers API
    endpoint is not available in CallRounded API v1.
    We deduce our numbers from the 'to_number' field in calls.
    """
    try:
        raw = await cr.list_calls(limit=200)
        calls = raw.get("data", []) if isinstance(raw, dict) else raw

        # Extract unique to_numbers (our numbers that receive calls)
        numbers_map: dict[str, dict] = {}
        for c in calls:
            to_num = c.get("to_number")
            if to_num and to_num not in numbers_map:
                agent_id = c.get("agent_id")
                agent_str = str(agent_id) if agent_id else None
                numbers_map[to_num] = {
                    "number": to_num,
                    "agent_id": agent_str,
                    "agent_name": None,
                    "call_count": 0,
                    "last_call": None,
                    "status": "active",
                }
            if to_num:
                numbers_map[to_num]["call_count"] += 1
                start = c.get("start_time")
                if start:
                    current_last = numbers_map[to_num]["last_call"]
                    if not current_last or start > current_last:
                        numbers_map[to_num]["last_call"] = start

        # Get agent names
        for num_data in numbers_map.values():
            if num_data["agent_id"]:
                num_data["agent_name"] = await get_agent_name(num_data["agent_id"])

        return list(numbers_map.values())
    except Exception:
        return []
