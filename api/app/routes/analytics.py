"""
CallRounded Manager - Analytics Routes
🐺 Created by Kuro - Sprint 3
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy import select

from ..deps import AccessibleAgentIds, CurrentUser, DBSession, TenantId
from ..models import WeeklyReport
from ..services import callrounded as cr

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ============================================================================
# SCHEMAS
# ============================================================================

class DailyStats(BaseModel):
    date: str
    total_calls: int
    completed_calls: int
    missed_calls: int
    avg_duration: float
    total_cost: float


class HourlyDistribution(BaseModel):
    hour: int
    call_count: int


class AgentPerformance(BaseModel):
    agent_id: str
    agent_name: str
    total_calls: int
    completed_calls: int
    completion_rate: float
    avg_duration: float


class AnalyticsOverview(BaseModel):
    period: str  # "day", "week", "month"
    total_calls: int
    completed_calls: int
    missed_calls: int
    failed_calls: int
    completion_rate: float
    avg_duration: float
    total_cost: float
    
    # Comparisons
    calls_change_pct: float | None = None
    completion_rate_change: float | None = None
    
    # Breakdowns
    daily_stats: list[DailyStats] = []
    hourly_distribution: list[HourlyDistribution] = []
    agent_performance: list[AgentPerformance] = []


class WeeklyReportOut(BaseModel):
    id: str
    week_start: datetime
    week_end: datetime
    total_calls: int
    completed_calls: int
    missed_calls: int
    avg_duration: float
    total_cost: float
    calls_change_pct: float | None
    generated_at: datetime
    sent_at: datetime | None

    model_config = {"from_attributes": True}


# ============================================================================
# HELPERS
# ============================================================================

def parse_date(date_str: str) -> datetime:
    """Parse date string to datetime."""
    return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)


def get_period_dates(period: str) -> tuple[datetime, datetime]:
    """Get start and end dates for a period."""
    now = datetime.now(timezone.utc)
    
    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "week":
        start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    else:
        # Default to last 7 days
        start = now - timedelta(days=7)
        end = now
    
    return start, end


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
    db: DBSession,
    period: str = Query("week", enum=["day", "week", "month"]),
    from_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """
    Get analytics overview for dashboard.
    
    Returns aggregated stats with daily breakdown and agent performance.
    """
    # Determine date range
    if from_date and to_date:
        start_dt = parse_date(from_date)
        end_dt = parse_date(to_date).replace(hour=23, minute=59, second=59)
    else:
        start_dt, end_dt = get_period_dates(period)
    
    # Fetch calls from API
    try:
        raw = await cr.list_calls(limit=1000)
        all_calls = raw.get("data", []) if isinstance(raw, dict) else raw
    except Exception as e:
        logger.error(f"Error fetching calls: {e}")
        all_calls = []
    
    # Filter by date and accessible agents
    calls = []
    for c in all_calls:
        # Parse start time
        start_str = c.get("start_time")
        if not start_str:
            continue
        
        try:
            call_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
            if call_dt.tzinfo is None:
                call_dt = call_dt.replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            continue
        
        # Filter by date
        if call_dt < start_dt or call_dt > end_dt:
            continue
        
        # Filter by accessible agents
        agent_id = str(c.get("agent_id", "")) if c.get("agent_id") else None
        if accessible_agents is not None and agent_id not in accessible_agents:
            continue
        
        calls.append({**c, "_parsed_dt": call_dt, "_agent_id": agent_id})
    
    # Compute stats
    total_calls = len(calls)
    completed_calls = sum(1 for c in calls if c.get("status") == "completed")
    missed_calls = sum(1 for c in calls if c.get("status") == "missed")
    failed_calls = sum(1 for c in calls if c.get("status") == "failed")
    
    durations = [c.get("duration_seconds", 0) for c in calls if c.get("duration_seconds")]
    avg_duration = sum(durations) / len(durations) if durations else 0.0
    
    total_cost = sum(c.get("cost", 0) or 0 for c in calls)
    
    completion_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0.0
    
    # Daily breakdown
    daily_map = {}
    for c in calls:
        date_key = c["_parsed_dt"].strftime("%Y-%m-%d")
        if date_key not in daily_map:
            daily_map[date_key] = {
                "total": 0, "completed": 0, "missed": 0, 
                "durations": [], "cost": 0
            }
        
        daily_map[date_key]["total"] += 1
        if c.get("status") == "completed":
            daily_map[date_key]["completed"] += 1
        elif c.get("status") == "missed":
            daily_map[date_key]["missed"] += 1
        
        if c.get("duration_seconds"):
            daily_map[date_key]["durations"].append(c["duration_seconds"])
        if c.get("cost"):
            daily_map[date_key]["cost"] += c["cost"]
    
    daily_stats = [
        DailyStats(
            date=date,
            total_calls=data["total"],
            completed_calls=data["completed"],
            missed_calls=data["missed"],
            avg_duration=sum(data["durations"]) / len(data["durations"]) if data["durations"] else 0,
            total_cost=round(data["cost"], 2),
        )
        for date, data in sorted(daily_map.items())
    ]
    
    # Hourly distribution
    hourly_map = {h: 0 for h in range(24)}
    for c in calls:
        hour = c["_parsed_dt"].hour
        hourly_map[hour] += 1
    
    hourly_distribution = [
        HourlyDistribution(hour=h, call_count=count)
        for h, count in hourly_map.items()
    ]
    
    # Agent performance
    agent_map = {}
    for c in calls:
        agent_id = c["_agent_id"] or "unknown"
        if agent_id not in agent_map:
            agent_map[agent_id] = {
                "total": 0, "completed": 0, "durations": []
            }
        
        agent_map[agent_id]["total"] += 1
        if c.get("status") == "completed":
            agent_map[agent_id]["completed"] += 1
        if c.get("duration_seconds"):
            agent_map[agent_id]["durations"].append(c["duration_seconds"])
    
    agent_performance = [
        AgentPerformance(
            agent_id=agent_id,
            agent_name=f"Agent {agent_id[:8]}..." if agent_id != "unknown" else "Inconnu",
            total_calls=data["total"],
            completed_calls=data["completed"],
            completion_rate=round(data["completed"] / data["total"] * 100, 1) if data["total"] > 0 else 0,
            avg_duration=round(sum(data["durations"]) / len(data["durations"]), 1) if data["durations"] else 0,
        )
        for agent_id, data in sorted(agent_map.items(), key=lambda x: x[1]["total"], reverse=True)
    ]
    
    return AnalyticsOverview(
        period=period,
        total_calls=total_calls,
        completed_calls=completed_calls,
        missed_calls=missed_calls,
        failed_calls=failed_calls,
        completion_rate=round(completion_rate, 1),
        avg_duration=round(avg_duration, 1),
        total_cost=round(total_cost, 2),
        daily_stats=daily_stats,
        hourly_distribution=hourly_distribution,
        agent_performance=agent_performance,
    )


@router.get("/trends")
async def get_trends(
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
    db: DBSession,
    days: int = Query(30, ge=7, le=90),
):
    """Get call volume trends over time."""
    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(days=days)
    
    try:
        raw = await cr.list_calls(limit=1000)
        all_calls = raw.get("data", []) if isinstance(raw, dict) else raw
    except Exception:
        all_calls = []
    
    # Group by date
    trend_data = {}
    for c in all_calls:
        start_str = c.get("start_time")
        if not start_str:
            continue
        
        try:
            call_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
            if call_dt.tzinfo is None:
                call_dt = call_dt.replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            continue
        
        if call_dt < start_dt or call_dt > end_dt:
            continue
        
        agent_id = str(c.get("agent_id", "")) if c.get("agent_id") else None
        if accessible_agents is not None and agent_id not in accessible_agents:
            continue
        
        date_key = call_dt.strftime("%Y-%m-%d")
        if date_key not in trend_data:
            trend_data[date_key] = {"calls": 0, "completed": 0, "cost": 0}
        
        trend_data[date_key]["calls"] += 1
        if c.get("status") == "completed":
            trend_data[date_key]["completed"] += 1
        if c.get("cost"):
            trend_data[date_key]["cost"] += c["cost"]
    
    # Fill missing dates
    result = []
    current = start_dt
    while current <= end_dt:
        date_key = current.strftime("%Y-%m-%d")
        data = trend_data.get(date_key, {"calls": 0, "completed": 0, "cost": 0})
        result.append({
            "date": date_key,
            "calls": data["calls"],
            "completed": data["completed"],
            "cost": round(data["cost"], 2),
        })
        current += timedelta(days=1)
    
    return {"days": days, "data": result}


@router.get("/weekly-reports", response_model=list[WeeklyReportOut])
async def list_weekly_reports(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
    limit: int = Query(10, ge=1, le=52),
):
    """List generated weekly reports."""
    result = await db.execute(
        select(WeeklyReport)
        .where(WeeklyReport.tenant_id == tenant_id)
        .order_by(WeeklyReport.week_start.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/peak-hours")
async def get_peak_hours(
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
    db: DBSession,
    days: int = Query(30, ge=7, le=90),
):
    """Analyze peak call hours."""
    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(days=days)
    
    try:
        raw = await cr.list_calls(limit=1000)
        all_calls = raw.get("data", []) if isinstance(raw, dict) else raw
    except Exception:
        all_calls = []
    
    # Group by hour and day of week
    hourly = {h: 0 for h in range(24)}
    daily = {d: 0 for d in range(7)}  # 0=Monday
    
    for c in all_calls:
        start_str = c.get("start_time")
        if not start_str:
            continue
        
        try:
            call_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
            if call_dt.tzinfo is None:
                call_dt = call_dt.replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            continue
        
        if call_dt < start_dt or call_dt > end_dt:
            continue
        
        agent_id = str(c.get("agent_id", "")) if c.get("agent_id") else None
        if accessible_agents is not None and agent_id not in accessible_agents:
            continue
        
        hourly[call_dt.hour] += 1
        daily[call_dt.weekday()] += 1
    
    # Find peaks
    peak_hour = max(hourly, key=hourly.get)
    peak_day = max(daily, key=daily.get)
    day_names = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
    
    return {
        "peak_hour": peak_hour,
        "peak_hour_calls": hourly[peak_hour],
        "peak_day": day_names[peak_day],
        "peak_day_calls": daily[peak_day],
        "hourly_distribution": [{"hour": h, "calls": c} for h, c in hourly.items()],
        "daily_distribution": [{"day": day_names[d], "calls": c} for d, c in daily.items()],
    }
