"""
CallRounded Manager - Dashboard Routes
🐺 Updated by Kuro - Added role-based filtering
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import AccessibleAgentIds, CurrentUser, DBSession, TenantId
from ..models import AgentCache
from ..services import callrounded as cr

router = APIRouter()


@router.get("/stats")
async def dashboard_stats(
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
    from_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """
    Compute dashboard stats from CallRounded API data.
    Users see stats only for their assigned agents.
    """
    try:
        raw = await cr.list_calls(limit=1000)
        calls = raw.get("data", []) if isinstance(raw, dict) else raw
    except Exception:
        calls = []

    # Parse date filters
    filter_from = None
    filter_to = None
    if from_date:
        try:
            filter_from = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    if to_date:
        try:
            filter_to = datetime.strptime(to_date, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, tzinfo=timezone.utc
            )
        except ValueError:
            pass

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_calls = 0
    calls_today = 0
    completed_calls = 0
    missed_calls = 0
    failed_calls = 0
    total_duration = 0.0
    total_cost = 0.0
    duration_count = 0
    seen_agents = set()

    for c in calls:
        agent_id = str(c.get("agent_id", "")) if c.get("agent_id") else None
        
        # Filter by accessible agents (role-based)
        if accessible_agents is not None and agent_id not in accessible_agents:
            continue
        
        start_str = c.get("start_time")
        start_dt = None
        if start_str:
            try:
                start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
            except (ValueError, AttributeError):
                pass

        if filter_from and start_dt and start_dt < filter_from:
            continue
        if filter_to and start_dt and start_dt > filter_to:
            continue

        total_calls += 1
        
        if agent_id:
            seen_agents.add(agent_id)

        status = c.get("status", "unknown")
        if status == "completed":
            completed_calls += 1
        elif status == "missed":
            missed_calls += 1
        elif status == "failed":
            failed_calls += 1

        dur = c.get("duration_seconds")
        if dur and dur > 0:
            total_duration += dur
            duration_count += 1

        cost = c.get("cost")
        if cost:
            total_cost += cost

        if start_dt and start_dt >= today_start:
            calls_today += 1

    avg_duration = round(total_duration / duration_count, 1) if duration_count > 0 else 0.0
    response_rate = round((completed_calls / total_calls * 100), 1) if total_calls > 0 else 0.0

    # Count agents
    if accessible_agents is not None:
        total_agents = len(accessible_agents)
        active_agents = len(seen_agents)
    else:
        # Admin sees all agents
        result = await db.execute(
            select(AgentCache).where(AgentCache.tenant_id == tenant_id)
        )
        all_agents = result.scalars().all()
        total_agents = len(all_agents)
        active_agents = sum(1 for a in all_agents if a.status == "active")

    return {
        "total_agents": total_agents,
        "active_agents": active_agents,
        "total_calls": total_calls,
        "total_calls_today": calls_today,
        "completed_calls": completed_calls,
        "missed_calls": missed_calls,
        "failed_calls": failed_calls,
        "avg_duration": avg_duration,
        "total_cost": round(total_cost, 2),
        "response_rate": response_rate,
    }
