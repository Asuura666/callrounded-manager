"""
CallRounded Manager - Google Calendar Integration
🐺 Created by Kuro - Sprint 5
"""
import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from ..config import settings
from ..deps import AdminUser, CurrentUser, DBSession, TenantId
from ..models import CalendarIntegration

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calendar", tags=["Calendar Integration"])


# ============================================================================
# CONFIG
# ============================================================================

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
]


# ============================================================================
# SCHEMAS
# ============================================================================

class CalendarConnectionStatus(BaseModel):
    connected: bool
    email: str | None = None
    calendar_id: str | None = None
    last_sync: datetime | None = None
    events_synced: int = 0


class CalendarEvent(BaseModel):
    id: str | None = None
    summary: str
    description: str | None = None
    start: datetime
    end: datetime
    location: str | None = None
    attendees: list[str] = []


class CalendarEventOut(BaseModel):
    id: str
    summary: str
    description: str | None
    start: datetime
    end: datetime
    location: str | None
    status: str
    html_link: str | None


class CreateEventRequest(BaseModel):
    summary: str
    description: str | None = None
    start: datetime
    end: datetime
    location: str | None = None
    attendees: list[str] = []
    send_notifications: bool = True


class SyncResult(BaseModel):
    synced: int
    created: int
    updated: int
    errors: int


# ============================================================================
# HELPERS
# ============================================================================

def get_redirect_uri() -> str:
    """Get OAuth redirect URI."""
    return f"{settings.FRONTEND_URL}/api/calendar/callback"


async def refresh_access_token(integration: "CalendarIntegration", db: DBSession) -> str:
    """Refresh Google access token if expired."""
    if integration.token_expires_at and integration.token_expires_at > datetime.now(timezone.utc):
        return integration.access_token
    
    if not integration.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not available, please reconnect"
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": integration.refresh_token,
                "grant_type": "refresh_token",
            },
        )
        
        if response.status_code != 200:
            logger.error(f"Token refresh failed: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh token"
            )
        
        data = response.json()
        
        integration.access_token = data["access_token"]
        integration.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 3600))
        
        await db.commit()
        
        return integration.access_token


# ============================================================================
# ENDPOINTS - OAUTH
# ============================================================================

@router.get("/connect")
async def initiate_oauth(
    admin: AdminUser,
    tenant_id: TenantId,
):
    """Initiate Google OAuth flow."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    state = json.dumps({"tenant_id": str(tenant_id), "user_id": str(admin.id)})
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": get_redirect_uri(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    
    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    
    return {"auth_url": auth_url}


@router.get("/callback")
async def oauth_callback(
    request: Request,
    db: DBSession,
    code: str = Query(...),
    state: str = Query(...),
):
    """Handle OAuth callback from Google."""
    try:
        state_data = json.loads(state)
        tenant_id = uuid.UUID(state_data["tenant_id"])
        user_id = uuid.UUID(state_data["user_id"])
    except (json.JSONDecodeError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state")
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "redirect_uri": get_redirect_uri(),
                "grant_type": "authorization_code",
            },
        )
        
        if response.status_code != 200:
            logger.error(f"Token exchange failed: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for token"
            )
        
        token_data = response.json()
    
    # Get user info
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        user_info = user_response.json() if user_response.status_code == 200 else {}
    
    # Save or update integration
    from sqlalchemy import select
    result = await db.execute(
        select(CalendarIntegration).where(CalendarIntegration.tenant_id == tenant_id)
    )
    integration = result.scalar_one_or_none()
    
    if integration:
        integration.access_token = token_data["access_token"]
        integration.refresh_token = token_data.get("refresh_token", integration.refresh_token)
        integration.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
        integration.google_email = user_info.get("email")
        integration.connected_by = user_id
    else:
        integration = CalendarIntegration(
            tenant_id=tenant_id,
            access_token=token_data["access_token"],
            refresh_token=token_data.get("refresh_token"),
            token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600)),
            google_email=user_info.get("email"),
            calendar_id="primary",
            connected_by=user_id,
        )
        db.add(integration)
    
    await db.commit()
    
    logger.info(f"Calendar connected for tenant {tenant_id}")
    
    # Redirect to frontend
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/settings/calendar?connected=true")


@router.get("/status", response_model=CalendarConnectionStatus)
async def get_connection_status(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Get calendar connection status."""
    from sqlalchemy import select
    result = await db.execute(
        select(CalendarIntegration).where(CalendarIntegration.tenant_id == tenant_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        return CalendarConnectionStatus(connected=False)
    
    return CalendarConnectionStatus(
        connected=True,
        email=integration.google_email,
        calendar_id=integration.calendar_id,
        last_sync=integration.last_sync,
        events_synced=integration.events_synced,
    )


@router.post("/disconnect")
async def disconnect_calendar(
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Disconnect Google Calendar."""
    from sqlalchemy import select
    result = await db.execute(
        select(CalendarIntegration).where(CalendarIntegration.tenant_id == tenant_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No calendar connected")
    
    await db.delete(integration)
    await db.commit()
    
    logger.info(f"Calendar disconnected for tenant {tenant_id}")
    
    return {"status": "disconnected"}


# ============================================================================
# ENDPOINTS - EVENTS
# ============================================================================

@router.get("/events", response_model=list[CalendarEventOut])
async def list_events(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
    days: int = Query(7, ge=1, le=30),
):
    """List upcoming calendar events."""
    from sqlalchemy import select
    result = await db.execute(
        select(CalendarIntegration).where(CalendarIntegration.tenant_id == tenant_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not connected")
    
    access_token = await refresh_access_token(integration, db)
    
    # Fetch events
    now = datetime.now(timezone.utc)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=days)).isoformat()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/{integration.calendar_id}/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": 100,
            },
        )
        
        if response.status_code != 200:
            logger.error(f"Failed to fetch events: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch calendar events"
            )
        
        data = response.json()
    
    events = []
    for item in data.get("items", []):
        start = item.get("start", {})
        end = item.get("end", {})
        
        # Parse datetime
        start_dt = start.get("dateTime") or start.get("date")
        end_dt = end.get("dateTime") or end.get("date")
        
        if start_dt and end_dt:
            events.append(CalendarEventOut(
                id=item.get("id"),
                summary=item.get("summary", "Sans titre"),
                description=item.get("description"),
                start=datetime.fromisoformat(start_dt.replace("Z", "+00:00")),
                end=datetime.fromisoformat(end_dt.replace("Z", "+00:00")),
                location=item.get("location"),
                status=item.get("status", "confirmed"),
                html_link=item.get("htmlLink"),
            ))
    
    return events


@router.post("/events", response_model=CalendarEventOut)
async def create_event(
    body: CreateEventRequest,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Create a calendar event (e.g., appointment from call)."""
    from sqlalchemy import select
    result = await db.execute(
        select(CalendarIntegration).where(CalendarIntegration.tenant_id == tenant_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not connected")
    
    access_token = await refresh_access_token(integration, db)
    
    # Build event
    event_body = {
        "summary": body.summary,
        "description": body.description,
        "start": {"dateTime": body.start.isoformat(), "timeZone": "Europe/Paris"},
        "end": {"dateTime": body.end.isoformat(), "timeZone": "Europe/Paris"},
    }
    
    if body.location:
        event_body["location"] = body.location
    
    if body.attendees:
        event_body["attendees"] = [{"email": email} for email in body.attendees]
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GOOGLE_CALENDAR_API}/calendars/{integration.calendar_id}/events",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            params={"sendNotifications": str(body.send_notifications).lower()},
            json=event_body,
        )
        
        if response.status_code not in (200, 201):
            logger.error(f"Failed to create event: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to create calendar event"
            )
        
        item = response.json()
    
    logger.info(f"Calendar event created: {item.get('id')}")
    
    start = item.get("start", {})
    end = item.get("end", {})
    
    return CalendarEventOut(
        id=item.get("id"),
        summary=item.get("summary"),
        description=item.get("description"),
        start=datetime.fromisoformat(start.get("dateTime", "").replace("Z", "+00:00")),
        end=datetime.fromisoformat(end.get("dateTime", "").replace("Z", "+00:00")),
        location=item.get("location"),
        status=item.get("status", "confirmed"),
        html_link=item.get("htmlLink"),
    )


@router.post("/sync", response_model=SyncResult)
async def sync_appointments(
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """
    Sync appointments from calls to calendar.
    
    Looks for completed calls with appointment data and creates calendar events.
    """
    from sqlalchemy import select
    result = await db.execute(
        select(CalendarIntegration).where(CalendarIntegration.tenant_id == tenant_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not connected")
    
    # TODO: Implement actual sync logic
    # - Fetch calls with appointment data from CallRounded
    # - Create calendar events for each appointment
    # - Track synced appointments to avoid duplicates
    
    integration.last_sync = datetime.now(timezone.utc)
    await db.commit()
    
    return SyncResult(
        synced=0,
        created=0,
        updated=0,
        errors=0,
    )


@router.get("/available-slots")
async def get_available_slots(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
    date: str = Query(..., description="Date YYYY-MM-DD"),
    duration_minutes: int = Query(30, ge=15, le=120),
):
    """Get available time slots for a given date."""
    from sqlalchemy import select
    result = await db.execute(
        select(CalendarIntegration).where(CalendarIntegration.tenant_id == tenant_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar not connected")
    
    access_token = await refresh_access_token(integration, db)
    
    # Parse date
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format")
    
    # Get events for that day
    time_min = target_date.replace(hour=0, minute=0, second=0).isoformat()
    time_max = target_date.replace(hour=23, minute=59, second=59).isoformat()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/{integration.calendar_id}/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
            },
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch calendar events"
            )
        
        data = response.json()
    
    # Get busy times
    busy_times = []
    for item in data.get("items", []):
        start = item.get("start", {}).get("dateTime")
        end = item.get("end", {}).get("dateTime")
        if start and end:
            busy_times.append({
                "start": datetime.fromisoformat(start.replace("Z", "+00:00")),
                "end": datetime.fromisoformat(end.replace("Z", "+00:00")),
            })
    
    # Generate available slots (9h-18h, excluding busy times)
    slots = []
    current = target_date.replace(hour=9, minute=0, second=0)
    end_of_day = target_date.replace(hour=18, minute=0, second=0)
    
    while current + timedelta(minutes=duration_minutes) <= end_of_day:
        slot_end = current + timedelta(minutes=duration_minutes)
        
        # Check if slot overlaps with any busy time
        is_available = True
        for busy in busy_times:
            if not (slot_end <= busy["start"] or current >= busy["end"]):
                is_available = False
                break
        
        if is_available:
            slots.append({
                "start": current.isoformat(),
                "end": slot_end.isoformat(),
            })
        
        current += timedelta(minutes=30)  # 30 min increments
    
    return {"date": date, "duration_minutes": duration_minutes, "slots": slots}
