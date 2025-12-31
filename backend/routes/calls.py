from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import Call, Agent
from schemas import CallResponse, CallCreate, CallUpdate
import uuid

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("", response_model=List[CallResponse])
async def list_calls(
    db: Session = Depends(get_db),
    user_id: int = None,
    agent_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Lister les appels de l'utilisateur avec filtres optionnels."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    query = db.query(Call).filter(Call.user_id == user_id)
    
    # Filtrer par agent si spécifié
    if agent_id:
        query = query.filter(Call.agent_id == agent_id)
    
    # Filtrer par statut si spécifié
    if status_filter:
        query = query.filter(Call.status == status_filter)
    
    # Trier par date décroissante et paginer
    calls = query.order_by(Call.created_at.desc()).limit(limit).offset(offset).all()
    
    return calls


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: str,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Récupérer les détails d'un appel."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    call = db.query(Call).filter(
        Call.id == call_id,
        Call.user_id == user_id
    ).first()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    return call


@router.post("", response_model=CallResponse)
async def create_call(
    call_data: CallCreate,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Créer un nouvel enregistrement d'appel."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    # Vérifier que l'agent existe et appartient à l'utilisateur
    agent = db.query(Agent).filter(
        Agent.id == call_data.agent_id,
        Agent.user_id == user_id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Créer l'appel
    new_call = Call(
        id=str(uuid.uuid4()),
        user_id=user_id,
        agent_id=call_data.agent_id,
        external_call_id=call_data.external_call_id,
        caller_number=call_data.caller_number,
        status=call_data.status,
        duration=call_data.duration,
        transcription=call_data.transcription,
        recording_url=call_data.recording_url,
        started_at=call_data.started_at or datetime.utcnow(),
    )
    
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    return new_call


@router.patch("/{call_id}", response_model=CallResponse)
async def update_call(
    call_id: str,
    call_data: CallUpdate,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Mettre à jour un appel."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    call = db.query(Call).filter(
        Call.id == call_id,
        Call.user_id == user_id
    ).first()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    # Mettre à jour les champs fournis
    if call_data.status is not None:
        call.status = call_data.status
    if call_data.duration is not None:
        call.duration = call_data.duration
    if call_data.transcription is not None:
        call.transcription = call_data.transcription
    if call_data.recording_url is not None:
        call.recording_url = call_data.recording_url
    if call_data.ended_at is not None:
        call.ended_at = call_data.ended_at
    
    db.commit()
    db.refresh(call)
    
    return call
