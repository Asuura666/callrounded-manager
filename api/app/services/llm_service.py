"""
LLM Service for Agent Builder
🦊 Created by Shiro

Uses Anthropic Claude to help admins create CallRounded agents through conversation.
"""
import json
import logging
from pathlib import Path
from typing import Any

import httpx
from pydantic import BaseModel

from ..config import settings
from ..services import callrounded as cr

logger = logging.getLogger(__name__)

# Load API reference for context
API_REFERENCE_PATH = Path(__file__).parent.parent.parent.parent / "docs" / "API_REFERENCE.md"


class AgentPreview(BaseModel):
    """Preview of agent being created."""
    name: str | None = None
    description: str | None = None
    greeting: str | None = None
    voice: str | None = None
    language: str | None = None


class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    message: str
    agent_preview: AgentPreview | None = None
    action: dict | None = None


# System prompt for the LLM
SYSTEM_PROMPT = """Tu es un assistant expert pour créer des agents vocaux CallRounded.

## Ton rôle
Aide les administrateurs à configurer leurs agents de réception téléphonique en posant les bonnes questions et en extrayant les informations nécessaires.

## Informations à collecter
1. **Nom de l'agent** - Ex: "Réceptionniste Élégance"
2. **Type d'entreprise** - Salon de coiffure, restaurant, cabinet médical...
3. **Description** - Ce que fait l'agent
4. **Message d'accueil** - Comment l'agent répond au téléphone
5. **Langue** - fr-FR par défaut
6. **Voix** - Féminine ou masculine

## Instructions
- Pose des questions naturelles pour collecter les infos
- Propose des suggestions basées sur le type d'entreprise
- Quand tu as assez d'infos, résume ce que tu vas créer et demande confirmation
- Sois professionnel mais sympathique (style W&I)

## Format de réponse
Quand tu as collecté suffisamment d'informations et que l'utilisateur confirme, inclus dans ta réponse:
[AGENT_READY]
{
  "name": "Nom de l'agent",
  "description": "Description",
  "greeting": "Message d'accueil",
  "language": "fr-FR",
  "voice": "female"
}
[/AGENT_READY]

## API CallRounded disponible
{api_reference}
"""


def _get_system_prompt() -> str:
    """Load system prompt with API reference."""
    api_ref = ""
    if API_REFERENCE_PATH.exists():
        api_ref = API_REFERENCE_PATH.read_text()[:5000]  # Limit size
    return SYSTEM_PROMPT.format(api_reference=api_ref)


def _parse_agent_from_response(content: str) -> tuple[str, AgentPreview | None]:
    """Extract agent config from LLM response if present."""
    if "[AGENT_READY]" not in content:
        return content, None
    
    try:
        # Extract JSON between markers
        start = content.index("[AGENT_READY]") + len("[AGENT_READY]")
        end = content.index("[/AGENT_READY]")
        json_str = content[start:end].strip()
        
        # Parse JSON
        agent_data = json.loads(json_str)
        preview = AgentPreview(**agent_data)
        
        # Clean response (remove markers)
        clean_content = content[:content.index("[AGENT_READY]")].strip()
        
        return clean_content, preview
    except Exception as e:
        logger.warning(f"[llm_service] Failed to parse agent from response: {e}")
        return content, None


async def chat(request: ChatRequest) -> ChatResponse:
    """
    Process a chat message and return LLM response.
    
    Uses Anthropic Claude API.
    """
    logger.info(f"[llm_service] Processing chat with {len(request.messages)} messages")
    
    # Prepare messages for Claude
    system_prompt = _get_system_prompt()
    
    messages = [
        {"role": m.role, "content": m.content}
        for m in request.messages
        if m.role in ("user", "assistant")
    ]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1024,
                    "system": system_prompt,
                    "messages": messages,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            
        # Extract content
        content = data["content"][0]["text"]
        logger.info(f"[llm_service] Got response: {content[:100]}...")
        
        # Parse for agent config
        clean_content, agent_preview = _parse_agent_from_response(content)
        
        # Build response
        result = ChatResponse(
            message=clean_content,
            agent_preview=agent_preview,
        )
        
        # If agent is ready, indicate action
        if agent_preview:
            result.action = {
                "type": "create_agent",
                "status": "pending",
                "data": agent_preview.model_dump(),
            }
            logger.info(f"[llm_service] Agent ready for creation: {agent_preview.name}")
        
        return result
        
    except httpx.HTTPError as e:
        logger.error(f"[llm_service] API error: {e}")
        raise
    except Exception as e:
        logger.error(f"[llm_service] Unexpected error: {e}")
        raise


async def create_agent(preview: AgentPreview) -> dict[str, Any]:
    """
    Create an agent via CallRounded API.
    
    Returns the created agent data or error.
    """
    logger.info(f"[llm_service] Creating agent: {preview.name}")
    
    # Build agent payload for CallRounded
    payload = {
        "name": preview.name,
        "description": preview.description,
        "greeting_message": preview.greeting,
        "language": preview.language or "fr-FR",
        "voice": preview.voice or "female",
    }
    
    try:
        # Call CallRounded API
        # Note: This assumes we have a create_agent function in the callrounded service
        # If not, we need to add it
        result = await cr.create_agent(payload)
        
        if result:
            logger.info(f"[llm_service] Agent created successfully: {result.get('id')}")
            return {
                "status": "success",
                "agent": result,
            }
        else:
            logger.error("[llm_service] Agent creation returned None")
            return {
                "status": "error",
                "message": "Failed to create agent",
            }
            
    except Exception as e:
        logger.error(f"[llm_service] Agent creation failed: {e}")
        return {
            "status": "error",
            "message": str(e),
        }
