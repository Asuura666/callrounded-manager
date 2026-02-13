"""
CallRounded Manager - Alerts Routes
🐺 Created by Kuro - Sprint 4
"""
import json
import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, update

from ..deps import AdminUser, CurrentUser, DBSession, TenantId
from ..models import AlertRule, AlertEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ============================================================================
# SCHEMAS
# ============================================================================

class ConditionMissedCalls(BaseModel):
    threshold: int = 5  # Number of missed calls
    period_minutes: int = 60  # Time window


class ConditionLowCompletion(BaseModel):
    threshold_pct: float = 50.0  # Completion rate below this
    min_calls: int = 10  # Minimum calls to evaluate


class ConditionHighCost(BaseModel):
    threshold_amount: float = 100.0  # Cost threshold
    period_hours: int = 24


class ConditionNoActivity(BaseModel):
    inactive_hours: int = 4  # No calls for X hours


class AlertRuleCreate(BaseModel):
    name: str
    description: str | None = None
    rule_type: str  # missed_calls, low_completion, high_cost, no_activity
    conditions: dict
    notify_email: bool = True
    notify_webhook: bool = False
    webhook_url: str | None = None
    cooldown_minutes: int = 60


class AlertRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    conditions: dict | None = None
    notify_email: bool | None = None
    notify_webhook: bool | None = None
    webhook_url: str | None = None
    is_active: bool | None = None
    cooldown_minutes: int | None = None


class AlertRuleOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    rule_type: str
    conditions: dict
    notify_email: bool
    notify_webhook: bool
    webhook_url: str | None
    is_active: bool
    last_triggered: datetime | None
    trigger_count: int
    cooldown_minutes: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertEventOut(BaseModel):
    id: uuid.UUID
    rule_id: uuid.UUID
    severity: str
    title: str
    message: str
    context: dict | None
    notified_at: datetime | None
    acknowledged_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# RULE PRESETS
# ============================================================================

RULE_PRESETS = {
    "missed_calls_spike": {
        "name": "Pic d'appels manqués",
        "description": "Alerte quand trop d'appels sont manqués en peu de temps",
        "rule_type": "missed_calls",
        "conditions": {"threshold": 5, "period_minutes": 60},
        "cooldown_minutes": 30,
    },
    "low_completion_rate": {
        "name": "Taux de complétion bas",
        "description": "Alerte quand le taux de réponse est trop faible",
        "rule_type": "low_completion",
        "conditions": {"threshold_pct": 50.0, "min_calls": 10},
        "cooldown_minutes": 120,
    },
    "high_daily_cost": {
        "name": "Coût journalier élevé",
        "description": "Alerte quand les coûts dépassent le seuil",
        "rule_type": "high_cost",
        "conditions": {"threshold_amount": 50.0, "period_hours": 24},
        "cooldown_minutes": 240,
    },
    "no_activity": {
        "name": "Pas d'activité",
        "description": "Alerte quand aucun appel depuis trop longtemps",
        "rule_type": "no_activity",
        "conditions": {"inactive_hours": 4},
        "cooldown_minutes": 60,
    },
}


# ============================================================================
# ENDPOINTS - RULES
# ============================================================================

@router.get("/rules", response_model=list[AlertRuleOut])
async def list_rules(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
    active_only: bool = Query(False),
):
    """List all alert rules."""
    query = select(AlertRule).where(AlertRule.tenant_id == tenant_id)
    
    if active_only:
        query = query.where(AlertRule.is_active == True)
    
    query = query.order_by(AlertRule.created_at.desc())
    
    result = await db.execute(query)
    rules = result.scalars().all()
    
    return [
        AlertRuleOut(
            id=r.id,
            name=r.name,
            description=r.description,
            rule_type=r.rule_type,
            conditions=json.loads(r.conditions) if r.conditions else {},
            notify_email=r.notify_email,
            notify_webhook=r.notify_webhook,
            webhook_url=r.webhook_url,
            is_active=r.is_active,
            last_triggered=r.last_triggered,
            trigger_count=r.trigger_count,
            cooldown_minutes=r.cooldown_minutes,
            created_at=r.created_at,
        )
        for r in rules
    ]


@router.get("/rules/presets")
async def list_presets(current_user: CurrentUser):
    """List available rule presets."""
    return {"presets": RULE_PRESETS}


@router.post("/rules", response_model=AlertRuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(
    body: AlertRuleCreate,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Create a new alert rule."""
    logger.info(f"Creating alert rule '{body.name}' for tenant {tenant_id}")
    
    # Validate rule type
    valid_types = ["missed_calls", "low_completion", "high_cost", "no_activity", "custom"]
    if body.rule_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rule_type. Must be one of: {valid_types}"
        )
    
    rule = AlertRule(
        tenant_id=tenant_id,
        name=body.name,
        description=body.description,
        rule_type=body.rule_type,
        conditions=json.dumps(body.conditions),
        notify_email=body.notify_email,
        notify_webhook=body.notify_webhook,
        webhook_url=body.webhook_url,
        cooldown_minutes=body.cooldown_minutes,
        created_by=admin.id,
    )
    
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    
    logger.info(f"Alert rule created: {rule.id}")
    
    return AlertRuleOut(
        id=rule.id,
        name=rule.name,
        description=rule.description,
        rule_type=rule.rule_type,
        conditions=json.loads(rule.conditions),
        notify_email=rule.notify_email,
        notify_webhook=rule.notify_webhook,
        webhook_url=rule.webhook_url,
        is_active=rule.is_active,
        last_triggered=rule.last_triggered,
        trigger_count=rule.trigger_count,
        cooldown_minutes=rule.cooldown_minutes,
        created_at=rule.created_at,
    )


@router.post("/rules/from-preset/{preset_id}", response_model=AlertRuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule_from_preset(
    preset_id: str,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Create a rule from a preset."""
    if preset_id not in RULE_PRESETS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preset not found"
        )
    
    preset = RULE_PRESETS[preset_id]
    
    rule = AlertRule(
        tenant_id=tenant_id,
        name=preset["name"],
        description=preset["description"],
        rule_type=preset["rule_type"],
        conditions=json.dumps(preset["conditions"]),
        cooldown_minutes=preset["cooldown_minutes"],
        notify_email=True,
        created_by=admin.id,
    )
    
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    
    return AlertRuleOut(
        id=rule.id,
        name=rule.name,
        description=rule.description,
        rule_type=rule.rule_type,
        conditions=json.loads(rule.conditions),
        notify_email=rule.notify_email,
        notify_webhook=rule.notify_webhook,
        webhook_url=rule.webhook_url,
        is_active=rule.is_active,
        last_triggered=rule.last_triggered,
        trigger_count=rule.trigger_count,
        cooldown_minutes=rule.cooldown_minutes,
        created_at=rule.created_at,
    )


@router.patch("/rules/{rule_id}", response_model=AlertRuleOut)
async def update_rule(
    rule_id: uuid.UUID,
    body: AlertRuleUpdate,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Update an alert rule."""
    result = await db.execute(
        select(AlertRule).where(
            AlertRule.id == rule_id,
            AlertRule.tenant_id == tenant_id,
        )
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    
    # Apply updates
    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "conditions" and value is not None:
            setattr(rule, field, json.dumps(value))
        else:
            setattr(rule, field, value)
    
    await db.commit()
    await db.refresh(rule)
    
    return AlertRuleOut(
        id=rule.id,
        name=rule.name,
        description=rule.description,
        rule_type=rule.rule_type,
        conditions=json.loads(rule.conditions),
        notify_email=rule.notify_email,
        notify_webhook=rule.notify_webhook,
        webhook_url=rule.webhook_url,
        is_active=rule.is_active,
        last_triggered=rule.last_triggered,
        trigger_count=rule.trigger_count,
        cooldown_minutes=rule.cooldown_minutes,
        created_at=rule.created_at,
    )


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: uuid.UUID,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Delete an alert rule."""
    result = await db.execute(
        select(AlertRule).where(
            AlertRule.id == rule_id,
            AlertRule.tenant_id == tenant_id,
        )
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    
    await db.delete(rule)
    await db.commit()


# ============================================================================
# ENDPOINTS - EVENTS
# ============================================================================

@router.get("/events", response_model=list[AlertEventOut])
async def list_events(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
    limit: int = Query(50, ge=1, le=200),
    severity: str | None = Query(None, enum=["info", "warning", "critical"]),
    acknowledged: bool | None = Query(None),
):
    """List alert events."""
    query = select(AlertEvent).where(AlertEvent.tenant_id == tenant_id)
    
    if severity:
        query = query.where(AlertEvent.severity == severity)
    
    if acknowledged is not None:
        if acknowledged:
            query = query.where(AlertEvent.acknowledged_at.isnot(None))
        else:
            query = query.where(AlertEvent.acknowledged_at.is_(None))
    
    query = query.order_by(AlertEvent.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return [
        AlertEventOut(
            id=e.id,
            rule_id=e.rule_id,
            severity=e.severity,
            title=e.title,
            message=e.message,
            context=json.loads(e.context) if e.context else None,
            notified_at=e.notified_at,
            acknowledged_at=e.acknowledged_at,
            created_at=e.created_at,
        )
        for e in events
    ]


@router.post("/events/{event_id}/acknowledge", response_model=AlertEventOut)
async def acknowledge_event(
    event_id: uuid.UUID,
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Acknowledge an alert event."""
    result = await db.execute(
        select(AlertEvent).where(
            AlertEvent.id == event_id,
            AlertEvent.tenant_id == tenant_id,
        )
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    event.acknowledged_at = datetime.now(timezone.utc)
    event.acknowledged_by = current_user.id
    
    await db.commit()
    await db.refresh(event)
    
    return AlertEventOut(
        id=event.id,
        rule_id=event.rule_id,
        severity=event.severity,
        title=event.title,
        message=event.message,
        context=json.loads(event.context) if event.context else None,
        notified_at=event.notified_at,
        acknowledged_at=event.acknowledged_at,
        created_at=event.created_at,
    )


@router.post("/events/acknowledge-all", status_code=status.HTTP_200_OK)
async def acknowledge_all_events(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Acknowledge all unacknowledged events."""
    now = datetime.now(timezone.utc)
    
    result = await db.execute(
        update(AlertEvent)
        .where(
            AlertEvent.tenant_id == tenant_id,
            AlertEvent.acknowledged_at.is_(None),
        )
        .values(
            acknowledged_at=now,
            acknowledged_by=current_user.id,
        )
        .returning(AlertEvent.id)
    )
    
    count = len(result.fetchall())
    await db.commit()
    
    return {"acknowledged": count}


@router.get("/stats")
async def get_alert_stats(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Get alert statistics."""
    # Count unacknowledged
    unack_result = await db.execute(
        select(AlertEvent).where(
            AlertEvent.tenant_id == tenant_id,
            AlertEvent.acknowledged_at.is_(None),
        )
    )
    unacknowledged = len(unack_result.scalars().all())
    
    # Count by severity (last 24h)
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    recent_result = await db.execute(
        select(AlertEvent).where(
            AlertEvent.tenant_id == tenant_id,
            AlertEvent.created_at >= yesterday,
        )
    )
    recent_events = recent_result.scalars().all()
    
    by_severity = {"info": 0, "warning": 0, "critical": 0}
    for e in recent_events:
        if e.severity in by_severity:
            by_severity[e.severity] += 1
    
    # Active rules
    rules_result = await db.execute(
        select(AlertRule).where(
            AlertRule.tenant_id == tenant_id,
            AlertRule.is_active == True,
        )
    )
    active_rules = len(rules_result.scalars().all())
    
    return {
        "unacknowledged": unacknowledged,
        "last_24h": len(recent_events),
        "by_severity": by_severity,
        "active_rules": active_rules,
    }
