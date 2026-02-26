"""
Reports routes — Weekly report configuration
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth import get_current_user
from ..models import WeeklyReportConfig, User

router = APIRouter(prefix="/reports")


# ============================================================================
# SCHEMAS
# ============================================================================

class ScheduleSchema(BaseModel):
    day: str = "monday"
    time: str = "09:00"

class IncludeSchema(BaseModel):
    call_summary: bool = True
    analytics: bool = True
    alerts: bool = True
    recommendations: bool = False

class ReportConfigResponse(BaseModel):
    enabled: bool
    recipients: list[str]
    schedule: ScheduleSchema
    include: IncludeSchema
    last_sent: Optional[str] = None
    next_scheduled: Optional[str] = None

class ReportConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    recipients: Optional[list[str]] = None
    schedule: Optional[ScheduleSchema] = None
    include: Optional[IncludeSchema] = None


# ============================================================================
# HELPERS
# ============================================================================

async def get_or_create_config(tenant_id, db: AsyncSession) -> "WeeklyReportConfig":
    result = await db.execute(
        select(WeeklyReportConfig).where(WeeklyReportConfig.tenant_id == tenant_id)
    )
    config = result.scalar_one_or_none()
    if not config:
        config = WeeklyReportConfig(tenant_id=tenant_id)
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


def config_to_response(config: "WeeklyReportConfig") -> dict:
    recipients = [r.strip() for r in (config.recipients or "").split(",") if r.strip()]
    return {
        "enabled": config.enabled,
        "recipients": recipients,
        "schedule": {
            "day": config.schedule_day,
            "time": config.schedule_time,
        },
        "include": {
            "call_summary": config.include_call_summary,
            "analytics": config.include_analytics,
            "alerts": config.include_alerts,
            "recommendations": config.include_recommendations,
        },
        "last_sent": config.last_sent_at.isoformat() if config.last_sent_at else None,
        "next_scheduled": None,  # Could compute from schedule
    }


# ============================================================================
# ROUTES
# ============================================================================

@router.get("/weekly/config")
async def get_weekly_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config = await get_or_create_config(current_user.tenant_id, db)
    return config_to_response(config)


@router.patch("/weekly/config")
async def update_weekly_config(
    update: ReportConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config = await get_or_create_config(current_user.tenant_id, db)
    
    if update.enabled is not None:
        config.enabled = update.enabled
    if update.recipients is not None:
        config.recipients = ",".join(update.recipients)
    if update.schedule is not None:
        config.schedule_day = update.schedule.day
        config.schedule_time = update.schedule.time
    if update.include is not None:
        config.include_call_summary = update.include.call_summary
        config.include_analytics = update.include.analytics
        config.include_alerts = update.include.alerts
        config.include_recommendations = update.include.recommendations
    
    await db.commit()
    await db.refresh(config)
    return config_to_response(config)


@router.post("/weekly/send-now")
async def send_weekly_report_now(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config = await get_or_create_config(current_user.tenant_id, db)
    
    if not config.enabled:
        raise HTTPException(status_code=400, detail="Weekly reports are disabled")
    
    # For now, mark as sent (actual email sending to be implemented)
    config.last_sent_at = datetime.utcnow()
    await db.commit()
    
    return {"status": "sent", "sent_at": config.last_sent_at.isoformat()}
