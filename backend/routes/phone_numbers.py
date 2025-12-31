from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import PhoneNumber, Agent
from schemas import PhoneNumberResponse, PhoneNumberCreate, PhoneNumberUpdate
from callrounded_service import callrounded_service
import uuid

router = APIRouter(prefix="/phone-numbers", tags=["phone-numbers"])


@router.get("", response_model=List[PhoneNumberResponse])
async def list_phone_numbers(
    db: Session = Depends(get_db),
    user_id: int = None,
    agent_id: Optional[str] = None,
):
    """Lister les numéros de téléphone de l'utilisateur."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    query = db.query(PhoneNumber).filter(PhoneNumber.user_id == user_id)
    
    if agent_id:
        query = query.filter(PhoneNumber.agent_id == agent_id)
    
    phone_numbers = query.all()
    return phone_numbers


@router.get("/{phone_number_id}", response_model=PhoneNumberResponse)
async def get_phone_number(
    phone_number_id: str,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Récupérer les détails d'un numéro de téléphone."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    phone_number = db.query(PhoneNumber).filter(
        PhoneNumber.id == phone_number_id,
        PhoneNumber.user_id == user_id
    ).first()
    
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )
    
    return phone_number


@router.post("", response_model=PhoneNumberResponse)
async def create_phone_number(
    phone_data: PhoneNumberCreate,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Créer un nouveau numéro de téléphone."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    # Vérifier que l'agent existe si spécifié
    if phone_data.agent_id:
        agent = db.query(Agent).filter(
            Agent.id == phone_data.agent_id,
            Agent.user_id == user_id
        ).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
    
    # Créer le numéro de téléphone
    new_phone_number = PhoneNumber(
        id=str(uuid.uuid4()),
        user_id=user_id,
        agent_id=phone_data.agent_id,
        external_phone_number_id=phone_data.external_phone_number_id,
        number=phone_data.number,
        status=phone_data.status,
    )
    
    db.add(new_phone_number)
    db.commit()
    db.refresh(new_phone_number)
    
    return new_phone_number


@router.patch("/{phone_number_id}", response_model=PhoneNumberResponse)
async def update_phone_number(
    phone_number_id: str,
    phone_data: PhoneNumberUpdate,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Mettre à jour un numéro de téléphone."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    phone_number = db.query(PhoneNumber).filter(
        PhoneNumber.id == phone_number_id,
        PhoneNumber.user_id == user_id
    ).first()
    
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )
    
    # Vérifier que le nouvel agent existe si spécifié
    if phone_data.agent_id is not None:
        agent = db.query(Agent).filter(
            Agent.id == phone_data.agent_id,
            Agent.user_id == user_id
        ).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
        
        phone_number.agent_id = phone_data.agent_id
    
    # Mettre à jour les champs fournis
    if phone_data.status is not None:
        phone_number.status = phone_data.status
    
    db.commit()
    db.refresh(phone_number)
    
    # Mettre à jour aussi dans CallRounded API
    try:
        payload = {}
        if phone_data.status is not None:
            payload["status"] = phone_data.status
        if phone_data.agent_id is not None:
            payload["agent_id"] = phone_data.agent_id
        
        if payload:
            await callrounded_service.update_phone_number(
                phone_number.external_phone_number_id,
                payload
            )
    except Exception as e:
        # Log l'erreur mais ne pas échouer la requête
        print(f"Erreur lors de la mise à jour dans CallRounded: {e}")
    
    return phone_number
