from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Agent, User
from schemas import AgentResponse, AgentCreate, AgentUpdate
from callrounded_service import callrounded_service
import uuid

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=List[AgentResponse])
async def list_agents(
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Lister tous les agents de l'utilisateur."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    agents = db.query(Agent).filter(Agent.user_id == user_id).all()
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Récupérer les détails d'un agent."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == user_id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return agent


@router.post("", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Créer un nouvel agent."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    # Vérifier que l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Créer l'agent
    new_agent = Agent(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name=agent_data.name,
        status=agent_data.status,
        external_id=agent_data.external_id,
        description=agent_data.description,
    )
    
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    
    return new_agent


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Mettre à jour un agent."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == user_id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Mettre à jour les champs fournis
    if agent_data.name is not None:
        agent.name = agent_data.name
    if agent_data.status is not None:
        agent.status = agent_data.status
    if agent_data.description is not None:
        agent.description = agent_data.description
    
    db.commit()
    db.refresh(agent)
    
    # Mettre à jour aussi dans CallRounded API si le statut a changé
    if agent_data.status is not None:
        try:
            await callrounded_service.update_agent(
                agent.external_id,
                {"status": agent_data.status}
            )
        except Exception as e:
            # Log l'erreur mais ne pas échouer la requête
            print(f"Erreur lors de la mise à jour dans CallRounded: {e}")
    
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Supprimer un agent."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == user_id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    db.delete(agent)
    db.commit()
    
    return None
