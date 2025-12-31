from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AgentStatus(str, Enum):
    """Statut d'un agent."""
    active = "active"
    inactive = "inactive"
    paused = "paused"


class CallStatus(str, Enum):
    """Statut d'un appel."""
    completed = "completed"
    failed = "failed"
    missed = "missed"
    ongoing = "ongoing"


class EventType(str, Enum):
    """Type d'événement."""
    call_missed = "call_missed"
    agent_error = "agent_error"
    agent_offline = "agent_offline"
    call_completed = "call_completed"
    system_alert = "system_alert"


# ============ Agent Schemas ============
class AgentBase(BaseModel):
    """Schéma de base pour un agent."""
    name: str
    status: AgentStatus = AgentStatus.inactive
    description: Optional[str] = None


class AgentCreate(AgentBase):
    """Schéma pour créer un agent."""
    external_id: str


class AgentUpdate(BaseModel):
    """Schéma pour mettre à jour un agent."""
    name: Optional[str] = None
    status: Optional[AgentStatus] = None
    description: Optional[str] = None


class AgentResponse(AgentBase):
    """Schéma de réponse pour un agent."""
    id: str
    external_id: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Call Schemas ============
class CallBase(BaseModel):
    """Schéma de base pour un appel."""
    caller_number: Optional[str] = None
    status: CallStatus
    duration: Optional[int] = None
    transcription: Optional[str] = None
    recording_url: Optional[str] = None


class CallCreate(CallBase):
    """Schéma pour créer un appel."""
    external_call_id: str
    agent_id: str
    started_at: Optional[datetime] = None


class CallUpdate(BaseModel):
    """Schéma pour mettre à jour un appel."""
    status: Optional[CallStatus] = None
    duration: Optional[int] = None
    transcription: Optional[str] = None
    recording_url: Optional[str] = None
    ended_at: Optional[datetime] = None


class CallResponse(CallBase):
    """Schéma de réponse pour un appel."""
    id: str
    external_call_id: str
    agent_id: str
    user_id: int
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Phone Number Schemas ============
class PhoneNumberBase(BaseModel):
    """Schéma de base pour un numéro de téléphone."""
    number: str
    status: str = "active"


class PhoneNumberCreate(PhoneNumberBase):
    """Schéma pour créer un numéro de téléphone."""
    external_phone_number_id: str
    agent_id: Optional[str] = None


class PhoneNumberUpdate(BaseModel):
    """Schéma pour mettre à jour un numéro de téléphone."""
    status: Optional[str] = None
    agent_id: Optional[str] = None


class PhoneNumberResponse(PhoneNumberBase):
    """Schéma de réponse pour un numéro de téléphone."""
    id: str
    external_phone_number_id: str
    agent_id: Optional[str]
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Knowledge Base Schemas ============
class KnowledgeBaseSourceBase(BaseModel):
    """Schéma de base pour une source de base de connaissances."""
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    type: str


class KnowledgeBaseSourceResponse(KnowledgeBaseSourceBase):
    """Schéma de réponse pour une source de base de connaissances."""
    id: str
    external_source_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class KnowledgeBaseBase(BaseModel):
    """Schéma de base pour une base de connaissances."""
    name: str
    description: Optional[str] = None


class KnowledgeBaseCreate(KnowledgeBaseBase):
    """Schéma pour créer une base de connaissances."""
    external_knowledge_base_id: str
    agent_id: Optional[str] = None


class KnowledgeBaseUpdate(BaseModel):
    """Schéma pour mettre à jour une base de connaissances."""
    name: Optional[str] = None
    description: Optional[str] = None


class KnowledgeBaseResponse(KnowledgeBaseBase):
    """Schéma de réponse pour une base de connaissances."""
    id: str
    external_knowledge_base_id: str
    agent_id: Optional[str]
    user_id: int
    source_count: int
    sources: List[KnowledgeBaseSourceResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Event Schemas ============
class EventBase(BaseModel):
    """Schéma de base pour un événement."""
    type: EventType
    title: str
    message: Optional[str] = None


class EventCreate(EventBase):
    """Schéma pour créer un événement."""
    related_agent_id: Optional[str] = None
    related_call_id: Optional[str] = None


class EventResponse(EventBase):
    """Schéma de réponse pour un événement."""
    id: int
    user_id: int
    is_notified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ User Schemas ============
class UserBase(BaseModel):
    """Schéma de base pour un utilisateur."""
    name: Optional[str] = None
    email: Optional[str] = None


class UserResponse(UserBase):
    """Schéma de réponse pour un utilisateur."""
    id: int
    open_id: str
    role: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ API Response Schemas ============
class APIResponse(BaseModel):
    """Schéma de réponse générique de l'API."""
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None
