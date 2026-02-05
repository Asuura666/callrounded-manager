import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    tenant_id: uuid.UUID
    tenant_name: str | None = None

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_agents: int = 0
    active_agents: int = 0
    total_calls_today: int = 0
    completed_calls: int = 0
    missed_calls: int = 0
    avg_duration: float = 0.0
    response_rate: float = 0.0


# ── Agents ────────────────────────────────────────────────────────────
class AgentOut(BaseModel):
    id: str
    name: str
    status: str
    description: str | None = None

    model_config = {"from_attributes": True}


class AgentPatch(BaseModel):
    status: str | None = None
    name: str | None = None
    description: str | None = None


# ── Calls ─────────────────────────────────────────────────────────────
class CallOut(BaseModel):
    id: str
    agent_external_id: str | None = None
    caller_number: str | None = None
    duration: float | None = None
    status: str = "unknown"
    transcription: str | None = None
    recording_url: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None

    model_config = {"from_attributes": True}


# ── Phone Numbers ─────────────────────────────────────────────────────
class PhoneNumberOut(BaseModel):
    id: str
    agent_external_id: str | None = None
    number: str
    status: str

    model_config = {"from_attributes": True}


class PhoneNumberPatch(BaseModel):
    status: str | None = None
    agent_external_id: str | None = None


# ── Knowledge Bases ───────────────────────────────────────────────────
class KnowledgeBaseOut(BaseModel):
    id: str
    agent_external_id: str | None = None
    name: str
    description: str | None = None
    source_count: int = 0

    model_config = {"from_attributes": True}
