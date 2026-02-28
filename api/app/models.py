"""
CallRounded Manager - Database Models
🐺 Updated by Kuro - Added Role system and UserAgentAssignment
"""
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# ============================================================================
# ENUMS
# ============================================================================

class Role(str, Enum):
    """User roles for access control."""
    SUPER_ADMIN = "SUPER_ADMIN"    # Can manage all tenants (future use)
    TENANT_ADMIN = "TENANT_ADMIN"  # Admin of a tenant, can manage users & see all agents
    USER = "USER"                   # Regular user, sees only assigned agents


# ============================================================================
# CORE MODELS
# ============================================================================

class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plan: Mapped[str] = mapped_column(String(50), nullable=False, default="free")
    agent_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users: Mapped[list["User"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=Role.USER.value)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tenant: Mapped["Tenant"] = relationship(back_populates="users")
    agent_assignments: Mapped[list["UserAgentAssignment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_user_email_per_tenant"),
    )

    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return self.role in (Role.SUPER_ADMIN.value, Role.TENANT_ADMIN.value)

    def can_access_agent(self, agent_external_id: str) -> bool:
        """Check if user can access a specific agent."""
        if self.is_admin():
            return True
        return any(a.agent_external_id == agent_external_id for a in self.agent_assignments)


class UserAgentAssignment(Base):
    """Many-to-many relationship between Users and Agents."""
    __tablename__ = "user_agent_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    agent_external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    assigned_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="agent_assignments")

    __table_args__ = (
        UniqueConstraint("user_id", "agent_external_id", name="uq_user_agent_assignment"),
    )


# ============================================================================
# CACHE MODELS (synced from CallRounded API)
# ============================================================================

class AgentCache(Base):
    __tablename__ = "agents_cache"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="inactive")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("tenant_id", "external_id", name="uq_agent_external_id_per_tenant"),
    )


class CallCache(Base):
    __tablename__ = "calls_cache"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    agent_external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    external_call_id: Mapped[str] = mapped_column(String(255), nullable=False)
    caller_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="unknown")
    transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PhoneNumberCache(Base):
    __tablename__ = "phone_numbers_cache"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    agent_external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    number: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="inactive")
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class KnowledgeBaseCache(Base):
    __tablename__ = "knowledge_bases_cache"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    agent_external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ============================================================================
# SPRINT 3 - TEMPLATES & ANALYTICS
# ============================================================================

class AgentTemplate(Base):
    """Reusable agent configuration templates."""
    __tablename__ = "agent_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("tenants.id", ondelete="CASCADE"), 
        nullable=True
    )
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="custom")
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="🤖")
    is_preset: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    greeting: Mapped[str] = mapped_column(Text, nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    voice: Mapped[str] = mapped_column(String(50), nullable=False, default="emma")
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="fr-FR")
    
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class WeeklyReport(Base):
    """Weekly analytics reports."""
    __tablename__ = "weekly_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("tenants.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    week_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    week_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    total_calls: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_calls: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    missed_calls: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_duration: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    calls_change_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    completed_change_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_to: Mapped[str | None] = mapped_column(Text, nullable=True)


# ============================================================================
# SPRINT 4 - ALERTS
# ============================================================================

class AlertRule(Base):
    """Alert rules configuration."""
    __tablename__ = "alert_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    conditions: Mapped[str] = mapped_column(Text, nullable=False)
    
    notify_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_webhook: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    webhook_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_triggered: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    trigger_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cooldown_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AlertEvent(Base):
    """Alert events history."""
    __tablename__ = "alert_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    rule_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False)
    
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="warning")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notification_channels: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ============================================================================
# SPRINT 5 - CALENDAR INTEGRATION
# ============================================================================

class CalendarIntegration(Base):
    """Google Calendar integration settings."""
    __tablename__ = "calendar_integrations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    google_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    calendar_id: Mapped[str] = mapped_column(String(255), nullable=False, default="primary")
    
    last_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    events_synced: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    connected_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ============================================================================
# SPRINT 7 - WEEKLY REPORTS
# ============================================================================

class WeeklyReportConfig(Base):
    """Weekly report configuration per tenant."""
    __tablename__ = "weekly_report_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    recipients: Mapped[str | None] = mapped_column(Text, nullable=True)  # Comma-separated emails
    
    schedule_day: Mapped[str] = mapped_column(String(20), nullable=False, default="monday")
    schedule_time: Mapped[str] = mapped_column(String(5), nullable=False, default="09:00")
    
    include_call_summary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_analytics: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_alerts: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_recommendations: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
