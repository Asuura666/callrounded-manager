from datetime import datetime, timezone, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select

from ..deps import CurrentUser, DBSession, TenantId
from ..models import AgentCache, CallCache
from ..schemas import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    # Agents
    agents_q = await db.execute(
        select(func.count()).select_from(AgentCache).where(AgentCache.tenant_id == tenant_id)
    )
    total_agents = agents_q.scalar() or 0

    active_q = await db.execute(
        select(func.count()).select_from(AgentCache).where(
            AgentCache.tenant_id == tenant_id, AgentCache.status == "active"
        )
    )
    active_agents = active_q.scalar() or 0

    # Calls today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    calls_today_q = await db.execute(
        select(func.count()).select_from(CallCache).where(
            CallCache.tenant_id == tenant_id, CallCache.started_at >= today_start
        )
    )
    total_calls_today = calls_today_q.scalar() or 0

    completed_q = await db.execute(
        select(func.count()).select_from(CallCache).where(
            CallCache.tenant_id == tenant_id,
            CallCache.started_at >= today_start,
            CallCache.status == "completed",
        )
    )
    completed_calls = completed_q.scalar() or 0

    missed_q = await db.execute(
        select(func.count()).select_from(CallCache).where(
            CallCache.tenant_id == tenant_id,
            CallCache.started_at >= today_start,
            CallCache.status == "missed",
        )
    )
    missed_calls = missed_q.scalar() or 0

    avg_q = await db.execute(
        select(func.avg(CallCache.duration)).where(
            CallCache.tenant_id == tenant_id, CallCache.started_at >= today_start
        )
    )
    avg_duration = round(avg_q.scalar() or 0.0, 1)

    response_rate = round((completed_calls / total_calls_today * 100) if total_calls_today else 0.0, 1)

    return DashboardStats(
        total_agents=total_agents,
        active_agents=active_agents,
        total_calls_today=total_calls_today,
        completed_calls=completed_calls,
        missed_calls=missed_calls,
        avg_duration=avg_duration,
        response_rate=response_rate,
    )
