from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import KnowledgeBase, KnowledgeBaseSource, Agent
from schemas import KnowledgeBaseResponse, KnowledgeBaseCreate, KnowledgeBaseUpdate
from callrounded_service import callrounded_service
import uuid

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"])


@router.get("", response_model=List[KnowledgeBaseResponse])
async def list_knowledge_bases(
    db: Session = Depends(get_db),
    user_id: int = None,
    agent_id: Optional[str] = None,
):
    """Lister les bases de connaissances de l'utilisateur."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    query = db.query(KnowledgeBase).filter(KnowledgeBase.user_id == user_id)
    
    if agent_id:
        query = query.filter(KnowledgeBase.agent_id == agent_id)
    
    knowledge_bases = query.all()
    return knowledge_bases


@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(
    kb_id: str,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Récupérer les détails d'une base de connaissances."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    knowledge_base = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id,
        KnowledgeBase.user_id == user_id
    ).first()
    
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )
    
    return knowledge_base


@router.post("", response_model=KnowledgeBaseResponse)
async def create_knowledge_base(
    kb_data: KnowledgeBaseCreate,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Créer une nouvelle base de connaissances."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    # Vérifier que l'agent existe si spécifié
    if kb_data.agent_id:
        agent = db.query(Agent).filter(
            Agent.id == kb_data.agent_id,
            Agent.user_id == user_id
        ).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
    
    # Créer la base de connaissances
    new_kb = KnowledgeBase(
        id=str(uuid.uuid4()),
        user_id=user_id,
        agent_id=kb_data.agent_id,
        external_knowledge_base_id=kb_data.external_knowledge_base_id,
        name=kb_data.name,
        description=kb_data.description,
    )
    
    db.add(new_kb)
    db.commit()
    db.refresh(new_kb)
    
    return new_kb


@router.patch("/{kb_id}", response_model=KnowledgeBaseResponse)
async def update_knowledge_base(
    kb_id: str,
    kb_data: KnowledgeBaseUpdate,
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Mettre à jour une base de connaissances."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    knowledge_base = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id,
        KnowledgeBase.user_id == user_id
    ).first()
    
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )
    
    # Mettre à jour les champs fournis
    if kb_data.name is not None:
        knowledge_base.name = kb_data.name
    if kb_data.description is not None:
        knowledge_base.description = kb_data.description
    
    db.commit()
    db.refresh(knowledge_base)
    
    return knowledge_base


@router.post("/{kb_id}/sources")
async def add_sources_to_knowledge_base(
    kb_id: str,
    source_ids: List[str],
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Ajouter des sources à une base de connaissances."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    knowledge_base = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id,
        KnowledgeBase.user_id == user_id
    ).first()
    
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )
    
    # Ajouter les sources dans CallRounded API
    try:
        result = await callrounded_service.add_knowledge_base_sources(
            knowledge_base.external_knowledge_base_id,
            source_ids
        )
        
        # Mettre à jour le nombre de sources
        knowledge_base.source_count = len(source_ids)
        db.commit()
        
        return {
            "success": True,
            "message": "Sources added successfully",
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding sources: {str(e)}"
        )


@router.delete("/{kb_id}/sources")
async def delete_sources_from_knowledge_base(
    kb_id: str,
    source_ids: List[str],
    db: Session = Depends(get_db),
    user_id: int = None,
):
    """Supprimer des sources d'une base de connaissances."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID is required"
        )
    
    knowledge_base = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id,
        KnowledgeBase.user_id == user_id
    ).first()
    
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge base not found"
        )
    
    # Supprimer les sources dans CallRounded API
    try:
        result = await callrounded_service.delete_knowledge_base_sources(
            knowledge_base.external_knowledge_base_id,
            source_ids
        )
        
        # Mettre à jour le nombre de sources
        sources_count = db.query(KnowledgeBaseSource).filter(
            KnowledgeBaseSource.knowledge_base_id == kb_id
        ).count()
        knowledge_base.source_count = sources_count
        db.commit()
        
        return {
            "success": True,
            "message": "Sources deleted successfully",
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting sources: {str(e)}"
        )
