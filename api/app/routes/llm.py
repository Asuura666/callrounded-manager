"""
CallRounded Manager - LLM Agent Builder Routes
🐺 Created by Kuro - Phase 2: AI-powered agent creation
"""
import json
import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from ..config import settings
from ..deps import AdminUser, DBSession, TenantId
from ..services import callrounded as cr

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/llm", tags=["LLM Agent Builder"])


# ============================================================================
# SCHEMAS
# ============================================================================

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    confirm_create: bool = False  # Set to True to actually create the agent


class AgentPreview(BaseModel):
    name: str | None = None
    description: str | None = None
    greeting: str | None = None
    voice: str | None = None
    language: str | None = None
    system_prompt: str | None = None


class ActionResult(BaseModel):
    type: str  # "create_agent", "preview", "info"
    status: str  # "success", "pending", "error"
    data: dict | None = None
    error: str | None = None


class ChatResponse(BaseModel):
    message: str
    agent_preview: AgentPreview | None = None
    action: ActionResult | None = None


# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = """Tu es un assistant expert pour créer des agents vocaux CallRounded.

## Ton rôle
Aider les administrateurs à créer des agents téléphoniques IA pour leurs salons (coiffure, beauté, etc.)

## Ce que tu peux faire
1. Discuter pour comprendre les besoins du salon
2. Proposer une configuration d'agent
3. Créer l'agent via l'API CallRounded

## Paramètres d'un agent
- **name**: Nom de l'agent (ex: "Réceptionniste Salon Élégance")
- **description**: Description courte (ex: "Agent de prise de RDV")
- **greeting**: Message d'accueil téléphonique
- **voice**: Voix de l'agent (options: "marie", "jean", "claire", "pierre", "emma", "lucas")
- **language**: Langue principale ("fr-FR", "en-US", etc.)
- **system_prompt**: Instructions détaillées pour l'agent

## Exemple de configuration salon de coiffure
```json
{
  "name": "Réceptionniste Salon Élégance",
  "description": "Agent de prise de rendez-vous pour salon de coiffure",
  "greeting": "Bonjour et bienvenue chez Salon Élégance ! Je suis votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?",
  "voice": "emma",
  "language": "fr-FR",
  "system_prompt": "Tu es la réceptionniste virtuelle du Salon Élégance. Tu gères les prises de rendez-vous, réponds aux questions sur les services et les tarifs. Sois professionnelle, chaleureuse et efficace."
}
```

## Workflow
1. Pose des questions pour comprendre le salon (nom, services, horaires, ton souhaité)
2. Propose une configuration complète
3. L'admin peut demander des modifications
4. Quand l'admin confirme, utilise l'outil create_agent

## Règles
- Toujours proposer un agent complet avant de créer
- Demander confirmation avant la création
- Adapter le ton et le greeting au type de salon
- Les voix féminines pour les salons beauté sont souvent préférées
"""


# ============================================================================
# TOOLS FOR FUNCTION CALLING
# ============================================================================

TOOLS = [
    {
        "name": "create_agent",
        "description": "Créer un nouvel agent vocal CallRounded. Utilise cet outil quand l'admin a confirmé vouloir créer l'agent.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Nom de l'agent (ex: 'Réceptionniste Salon Élégance')"
                },
                "description": {
                    "type": "string",
                    "description": "Description courte de l'agent"
                },
                "greeting": {
                    "type": "string",
                    "description": "Message d'accueil téléphonique"
                },
                "voice": {
                    "type": "string",
                    "enum": ["marie", "jean", "claire", "pierre", "emma", "lucas"],
                    "description": "Voix de l'agent"
                },
                "language": {
                    "type": "string",
                    "description": "Code langue (ex: fr-FR)"
                },
                "system_prompt": {
                    "type": "string",
                    "description": "Instructions détaillées pour l'agent"
                }
            },
            "required": ["name", "greeting", "voice", "language", "system_prompt"]
        }
    },
    {
        "name": "preview_agent",
        "description": "Afficher un aperçu de la configuration de l'agent avant création. Utilise cet outil pour montrer la config à l'admin.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "greeting": {"type": "string"},
                "voice": {"type": "string"},
                "language": {"type": "string"},
                "system_prompt": {"type": "string"}
            },
            "required": ["name", "greeting"]
        }
    }
]


# ============================================================================
# LLM CLIENT
# ============================================================================

async def call_anthropic(messages: list[dict], tools: list[dict] | None = None) -> dict:
    """Call Anthropic Claude API."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ANTHROPIC_API_KEY non configurée"
        )
    
    async with httpx.AsyncClient() as client:
        payload = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 2048,
            "system": SYSTEM_PROMPT,
            "messages": messages,
        }
        
        if tools:
            payload["tools"] = tools
        
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
            timeout=60.0,
        )
        
        if response.status_code != 200:
            logger.error(f"Anthropic API error: {response.status_code} {response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erreur API Anthropic: {response.status_code}"
            )
        
        return response.json()


async def create_agent_via_api(agent_config: dict) -> dict:
    """Create agent via CallRounded API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.CALLROUNDED_API_URL}/agents",
            headers={
                "X-Api-Key": settings.CALLROUNDED_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "name": agent_config.get("name"),
                "first_sentence": agent_config.get("greeting"),
                "system_prompt": agent_config.get("system_prompt"),
                "voice_id": agent_config.get("voice", "emma"),
                "language": agent_config.get("language", "fr-FR"),
                "metadata": {
                    "description": agent_config.get("description", ""),
                    "created_by": "llm_builder",
                }
            },
            timeout=30.0,
        )
        
        if response.status_code not in (200, 201):
            logger.error(f"CallRounded API error: {response.status_code} {response.text}")
            return {
                "success": False,
                "error": f"Erreur API CallRounded: {response.status_code}",
                "details": response.text
            }
        
        return {
            "success": True,
            "agent": response.json()
        }


# ============================================================================
# ENDPOINT
# ============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat_with_llm(
    body: ChatRequest,
    admin: AdminUser,
    tenant_id: TenantId,
    db: DBSession,
):
    """
    Chat with LLM to create agents.
    
    The LLM can:
    - Answer questions about agent configuration
    - Preview agent settings
    - Create agents when confirmed
    """
    logger.info(f"LLM chat request from admin {admin.id}, {len(body.messages)} messages")
    
    # Convert messages to Anthropic format
    anthropic_messages = [
        {"role": m.role, "content": m.content}
        for m in body.messages
    ]
    
    # Call Anthropic with tools
    result = await call_anthropic(anthropic_messages, TOOLS)
    
    # Parse response
    response_text = ""
    agent_preview = None
    action = None
    
    for content_block in result.get("content", []):
        if content_block.get("type") == "text":
            response_text += content_block.get("text", "")
        
        elif content_block.get("type") == "tool_use":
            tool_name = content_block.get("name")
            tool_input = content_block.get("input", {})
            
            logger.info(f"LLM called tool: {tool_name}")
            
            if tool_name == "preview_agent":
                agent_preview = AgentPreview(
                    name=tool_input.get("name"),
                    description=tool_input.get("description"),
                    greeting=tool_input.get("greeting"),
                    voice=tool_input.get("voice"),
                    language=tool_input.get("language"),
                    system_prompt=tool_input.get("system_prompt"),
                )
                action = ActionResult(
                    type="preview",
                    status="success",
                    data=tool_input,
                )
            
            elif tool_name == "create_agent":
                if body.confirm_create:
                    # Actually create the agent
                    create_result = await create_agent_via_api(tool_input)
                    
                    if create_result.get("success"):
                        agent_preview = AgentPreview(
                            name=tool_input.get("name"),
                            description=tool_input.get("description"),
                            greeting=tool_input.get("greeting"),
                            voice=tool_input.get("voice"),
                            language=tool_input.get("language"),
                            system_prompt=tool_input.get("system_prompt"),
                        )
                        action = ActionResult(
                            type="create_agent",
                            status="success",
                            data=create_result.get("agent"),
                        )
                        response_text += "\n\n✅ Agent créé avec succès !"
                    else:
                        action = ActionResult(
                            type="create_agent",
                            status="error",
                            error=create_result.get("error"),
                        )
                        response_text += f"\n\n❌ Erreur lors de la création: {create_result.get('error')}"
                else:
                    # Just preview, ask for confirmation
                    agent_preview = AgentPreview(
                        name=tool_input.get("name"),
                        description=tool_input.get("description"),
                        greeting=tool_input.get("greeting"),
                        voice=tool_input.get("voice"),
                        language=tool_input.get("language"),
                        system_prompt=tool_input.get("system_prompt"),
                    )
                    action = ActionResult(
                        type="create_agent",
                        status="pending",
                        data=tool_input,
                    )
                    response_text += "\n\n⏳ Envoyez à nouveau avec `confirm_create: true` pour créer l'agent."
    
    return ChatResponse(
        message=response_text.strip(),
        agent_preview=agent_preview,
        action=action,
    )


@router.get("/voices")
async def list_available_voices(admin: AdminUser):
    """List available voices for agent creation."""
    return {
        "voices": [
            {"id": "marie", "name": "Marie", "gender": "female", "language": "fr-FR"},
            {"id": "jean", "name": "Jean", "gender": "male", "language": "fr-FR"},
            {"id": "claire", "name": "Claire", "gender": "female", "language": "fr-FR"},
            {"id": "pierre", "name": "Pierre", "gender": "male", "language": "fr-FR"},
            {"id": "emma", "name": "Emma", "gender": "female", "language": "fr-FR"},
            {"id": "lucas", "name": "Lucas", "gender": "male", "language": "fr-FR"},
        ]
    }
