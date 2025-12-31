from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class User(Base):
    """Modèle utilisateur."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    open_id = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(Text, nullable=True)
    email = Column(String(320), nullable=True)
    login_method = Column(String(64), nullable=True)
    role = Column(Enum("user", "admin", name="user_role"), default="user", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_signed_in = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relations
    agents = relationship("Agent", back_populates="user", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="user", cascade="all, delete-orphan")
    phone_numbers = relationship("PhoneNumber", back_populates="user", cascade="all, delete-orphan")
    knowledge_bases = relationship("KnowledgeBase", back_populates="user", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="user", cascade="all, delete-orphan")


class Agent(Base):
    """Modèle agent téléphonique."""
    __tablename__ = "agents"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(Text, nullable=False)
    status = Column(Enum("active", "inactive", "paused", name="agent_status"), default="inactive", nullable=False)
    external_id = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    user = relationship("User", back_populates="agents")
    calls = relationship("Call", back_populates="agent", cascade="all, delete-orphan")
    phone_numbers = relationship("PhoneNumber", back_populates="agent", cascade="all, delete-orphan")
    knowledge_bases = relationship("KnowledgeBase", back_populates="agent", cascade="all, delete-orphan")


class Call(Base):
    """Modèle appel téléphonique."""
    __tablename__ = "calls"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String(64), ForeignKey("agents.id"), nullable=False)
    external_call_id = Column(String(255), nullable=False, unique=True, index=True)
    caller_number = Column(String(20), nullable=True)
    duration = Column(Integer, nullable=True)  # en secondes
    status = Column(Enum("completed", "failed", "missed", "ongoing", name="call_status"), nullable=False)
    transcription = Column(Text, nullable=True)
    recording_url = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    user = relationship("User", back_populates="calls")
    agent = relationship("Agent", back_populates="calls")


class PhoneNumber(Base):
    """Modèle numéro de téléphone."""
    __tablename__ = "phone_numbers"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String(64), ForeignKey("agents.id"), nullable=True)
    external_phone_number_id = Column(String(255), nullable=False, unique=True, index=True)
    number = Column(String(20), nullable=False)
    status = Column(Enum("active", "inactive", name="phone_status"), default="active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    user = relationship("User", back_populates="phone_numbers")
    agent = relationship("Agent", back_populates="phone_numbers")


class KnowledgeBase(Base):
    """Modèle base de connaissances."""
    __tablename__ = "knowledge_bases"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String(64), ForeignKey("agents.id"), nullable=True)
    external_knowledge_base_id = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    source_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    user = relationship("User", back_populates="knowledge_bases")
    agent = relationship("Agent", back_populates="knowledge_bases")
    sources = relationship("KnowledgeBaseSource", back_populates="knowledge_base", cascade="all, delete-orphan")


class KnowledgeBaseSource(Base):
    """Modèle source de base de connaissances."""
    __tablename__ = "knowledge_base_sources"
    
    id = Column(String(64), primary_key=True, index=True)
    knowledge_base_id = Column(String(64), ForeignKey("knowledge_bases.id"), nullable=False)
    external_source_id = Column(String(255), nullable=False, unique=True, index=True)
    file_name = Column(Text, nullable=True)
    file_url = Column(Text, nullable=True)
    type = Column(Enum("file", "url", "text", name="source_type"), nullable=False)
    status = Column(Enum("ingesting", "ready", "failed", name="source_status"), default="ingesting", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    knowledge_base = relationship("KnowledgeBase", back_populates="sources")


class Event(Base):
    """Modèle événement pour les notifications."""
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum("call_missed", "agent_error", "agent_offline", "call_completed", "system_alert", name="event_type"), nullable=False)
    title = Column(Text, nullable=False)
    message = Column(Text, nullable=True)
    related_agent_id = Column(String(64), ForeignKey("agents.id"), nullable=True)
    related_call_id = Column(String(64), ForeignKey("calls.id"), nullable=True)
    is_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relations
    user = relationship("User", back_populates="events")
