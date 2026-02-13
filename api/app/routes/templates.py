"""
CallRounded Manager - Agent Templates Routes
🐺 Created by Kuro - Sprint 3
"""
import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import or_, select, func

from ..deps import AdminUser, CurrentUser, DBSession, TenantId
from ..models import AgentTemplate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/templates", tags=["Agent Templates"])


# ============================================================================
# SCHEMAS
# ============================================================================

class TemplateCreate(BaseModel):
    name: str
    description: str | None = None
    category: str = "custom"
    icon: str = "🤖"
    greeting: str
    system_prompt: str
    voice: str = "emma"
    language: str = "fr-FR"


class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    icon: str | None = None
    greeting: str | None = None
    system_prompt: str | None = None
    voice: str | None = None
    language: str | None = None


class TemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: str
    icon: str
    is_preset: bool
    greeting: str
    system_prompt: str
    voice: str
    language: str
    usage_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# PRESET TEMPLATES
# ============================================================================

PRESET_TEMPLATES = [
    {
        "name": "Salon de Coiffure",
        "description": "Template optimisé pour les salons de coiffure",
        "category": "beauty",
        "icon": "💇",
        "greeting": "Bonjour et bienvenue ! Je suis l'assistante virtuelle du salon. Comment puis-je vous aider aujourd'hui ? Souhaitez-vous prendre un rendez-vous ?",
        "system_prompt": """Tu es la réceptionniste virtuelle d'un salon de coiffure. 

Ton rôle :
- Accueillir chaleureusement les clients
- Gérer les prises de rendez-vous
- Répondre aux questions sur les services et tarifs
- Proposer des créneaux disponibles

Ton ton : professionnel, chaleureux et efficace.

Informations à collecter pour un RDV :
1. Nom du client
2. Service souhaité (coupe, coloration, brushing, etc.)
3. Coiffeur préféré (si applicable)
4. Date et heure souhaitées
5. Numéro de téléphone pour confirmation""",
        "voice": "emma",
        "language": "fr-FR",
    },
    {
        "name": "Institut de Beauté",
        "description": "Template pour instituts de beauté et spas",
        "category": "beauty",
        "icon": "💅",
        "greeting": "Bienvenue dans notre institut de beauté ! Je suis votre assistante. Comment puis-je vous accompagner ? Un soin, une épilation, ou une manucure peut-être ?",
        "system_prompt": """Tu es la réceptionniste virtuelle d'un institut de beauté.

Ton rôle :
- Accueillir les clients avec élégance
- Présenter les différents soins disponibles
- Gérer les rendez-vous
- Conseiller sur les forfaits et promotions

Services typiques : soins visage, soins corps, épilation, manucure, pédicure, massages.

Ton ton : raffiné, attentionné et professionnel.""",
        "voice": "claire",
        "language": "fr-FR",
    },
    {
        "name": "Barbershop",
        "description": "Template pour barbiers et salons masculins",
        "category": "beauty",
        "icon": "💈",
        "greeting": "Salut ! Bienvenue au barbershop. Tu veux réserver un créneau pour une coupe ou une taille de barbe ?",
        "system_prompt": """Tu es l'assistant virtuel d'un barbershop moderne.

Ton rôle :
- Accueillir les clients de manière décontractée
- Gérer les rendez-vous
- Présenter les services (coupe, barbe, rasage, soins)

Ton ton : cool, moderne, masculin mais professionnel.

Services : coupe homme, taille de barbe, rasage traditionnel, soins barbe.""",
        "voice": "lucas",
        "language": "fr-FR",
    },
    {
        "name": "Cabinet Médical",
        "description": "Template pour cabinets médicaux et paramédicaux",
        "category": "health",
        "icon": "🏥",
        "greeting": "Bonjour, cabinet médical du Docteur. Comment puis-je vous aider ? Souhaitez-vous prendre rendez-vous ?",
        "system_prompt": """Tu es la secrétaire médicale virtuelle d'un cabinet.

Ton rôle :
- Gérer les prises de rendez-vous
- Orienter les patients selon l'urgence
- Rappeler les documents nécessaires
- Gérer les demandes de renouvellement d'ordonnance

Ton ton : professionnel, rassurant, empathique.

Important : en cas d'urgence médicale, orienter vers le 15 (SAMU).""",
        "voice": "marie",
        "language": "fr-FR",
    },
    {
        "name": "Restaurant",
        "description": "Template pour restaurants et réservations",
        "category": "food",
        "icon": "🍽️",
        "greeting": "Bonjour et bienvenue ! Je suis l'assistant du restaurant. Souhaitez-vous réserver une table ?",
        "system_prompt": """Tu es l'assistant virtuel d'un restaurant.

Ton rôle :
- Prendre les réservations
- Informer sur les horaires et le menu
- Gérer les demandes spéciales (allergies, occasions spéciales)

Informations à collecter :
1. Nombre de convives
2. Date et heure
3. Nom pour la réservation
4. Demandes particulières

Ton ton : accueillant et gourmand.""",
        "voice": "emma",
        "language": "fr-FR",
    },
]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=list[TemplateOut])
async def list_templates(
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
    category: str | None = Query(None, description="Filter by category"),
    include_presets: bool = Query(True, description="Include global presets"),
):
    """List all templates (tenant + global presets)."""
    conditions = []
    
    # Tenant templates
    conditions.append(AgentTemplate.tenant_id == tenant_id)
    
    # Global presets
    if include_presets:
        conditions.append(AgentTemplate.is_preset == True)
    
    query = select(AgentTemplate).where(or_(*conditions))
    
    if category:
        query = query.where(AgentTemplate.category == category)
    
    query = query.order_by(AgentTemplate.is_preset.desc(), AgentTemplate.usage_count.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/presets", response_model=list[TemplateOut])
async def list_preset_templates(
    current_user: CurrentUser,
    db: DBSession,
):
    """List only global preset templates."""
    result = await db.execute(
        select(AgentTemplate)
        .where(AgentTemplate.is_preset == True)
        .order_by(AgentTemplate.category, AgentTemplate.name)
    )
    return result.scalars().all()


@router.get("/categories")
async def list_categories(current_user: CurrentUser):
    """List available template categories."""
    return {
        "categories": [
            {"id": "beauty", "name": "Beauté & Bien-être", "icon": "💅"},
            {"id": "health", "name": "Santé", "icon": "🏥"},
            {"id": "food", "name": "Restauration", "icon": "🍽️"},
            {"id": "services", "name": "Services", "icon": "🔧"},
            {"id": "retail", "name": "Commerce", "icon": "🛍️"},
            {"id": "custom", "name": "Personnalisé", "icon": "🤖"},
        ]
    }


@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Get a specific template."""
    result = await db.execute(
        select(AgentTemplate).where(
            AgentTemplate.id == template_id,
            or_(
                AgentTemplate.tenant_id == tenant_id,
                AgentTemplate.is_preset == True,
            )
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template non trouvé")
    
    return template


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    body: TemplateCreate,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Create a new template (admin only)."""
    logger.info(f"Creating template '{body.name}' for tenant {tenant_id}")
    
    # Check for duplicate name
    existing = await db.execute(
        select(AgentTemplate).where(
            AgentTemplate.tenant_id == tenant_id,
            AgentTemplate.name == body.name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un template avec ce nom existe déjà"
        )
    
    template = AgentTemplate(
        tenant_id=tenant_id,
        name=body.name,
        description=body.description,
        category=body.category,
        icon=body.icon,
        greeting=body.greeting,
        system_prompt=body.system_prompt,
        voice=body.voice,
        language=body.language,
        is_preset=False,
        created_by=admin.id,
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    logger.info(f"Template created: {template.id}")
    return template


@router.patch("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Update a template (admin only, tenant templates only)."""
    result = await db.execute(
        select(AgentTemplate).where(
            AgentTemplate.id == template_id,
            AgentTemplate.tenant_id == tenant_id,  # Can't edit presets
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Template non trouvé ou non modifiable"
        )
    
    # Apply updates
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    
    await db.commit()
    await db.refresh(template)
    
    logger.info(f"Template updated: {template.id}")
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Delete a template (admin only, tenant templates only)."""
    result = await db.execute(
        select(AgentTemplate).where(
            AgentTemplate.id == template_id,
            AgentTemplate.tenant_id == tenant_id,  # Can't delete presets
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Template non trouvé ou non supprimable"
        )
    
    await db.delete(template)
    await db.commit()
    
    logger.info(f"Template deleted: {template_id}")


@router.post("/{template_id}/use", response_model=TemplateOut)
async def use_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """Mark template as used (increments usage counter)."""
    result = await db.execute(
        select(AgentTemplate).where(
            AgentTemplate.id == template_id,
            or_(
                AgentTemplate.tenant_id == tenant_id,
                AgentTemplate.is_preset == True,
            )
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template non trouvé")
    
    template.usage_count += 1
    await db.commit()
    await db.refresh(template)
    
    return template


@router.post("/seed-presets", status_code=status.HTTP_201_CREATED)
async def seed_preset_templates(
    admin: AdminUser,
    db: DBSession,
):
    """Seed global preset templates (admin only)."""
    created = 0
    
    for preset_data in PRESET_TEMPLATES:
        # Check if exists
        existing = await db.execute(
            select(AgentTemplate).where(
                AgentTemplate.is_preset == True,
                AgentTemplate.name == preset_data["name"],
            )
        )
        if existing.scalar_one_or_none():
            continue
        
        template = AgentTemplate(
            tenant_id=None,  # Global
            is_preset=True,
            **preset_data,
        )
        db.add(template)
        created += 1
    
    await db.commit()
    
    logger.info(f"Seeded {created} preset templates")
    return {"created": created, "total_presets": len(PRESET_TEMPLATES)}
