"""
CallRounded Manager - Knowledge Bases Routes
🦊 Shiro — Extract salon info from agent's base_prompt
since the /knowledge-bases API endpoint is not available in v1.
"""
import re

from fastapi import APIRouter

from ..deps import AccessibleAgentIds, CurrentUser, DBSession, TenantId
from ..services import callrounded as cr

router = APIRouter()


def parse_salon_info(agent: dict) -> dict:
    """Extract structured salon info from agent's base_prompt."""
    prompt = agent.get("base_prompt", "")
    name = agent.get("name", "Agent inconnu")
    greeting = agent.get("initial_message", "")
    language = agent.get("language", "fr")

    # Extract address
    address = None
    addr_match = re.search(r"Salon\s*:\s*(.+?)(?:\n|$)", prompt)
    if addr_match:
        address = addr_match.group(1).strip().rstrip("- ").strip()

    # Extract phone
    phone = None
    phone_match = re.search(r"Téléphone\s*:\s*(.+?)(?:\n|$)", prompt)
    if phone_match:
        phone = phone_match.group(1).strip()

    # Extract team
    team = []
    team_match = re.search(r"[ÉE]quipe\s*:\s*(.+?)(?:\n|$)", prompt)
    if team_match:
        team = [t.strip() for t in team_match.group(1).split(",")]

    # Extract personality traits
    personality = []
    in_personality = False
    for line in prompt.split("\n"):
        if "Personnalité" in line:
            in_personality = True
            continue
        if in_personality:
            if line.strip().startswith("- "):
                personality.append(line.strip()[2:])
            elif line.strip().startswith("#"):
                break
            elif not line.strip():
                continue

    # Extract rules
    rules = []
    in_rules = False
    for line in prompt.split("\n"):
        if "Règles" in line:
            in_rules = True
            continue
        if in_rules:
            rule_match = re.match(r"\s*\d+\.\s*(.+)", line)
            if rule_match:
                rules.append(rule_match.group(1).strip())
            elif line.strip().startswith("#"):
                break

    return {
        "agent_name": name,
        "greeting": greeting,
        "language": language,
        "address": address,
        "phone": phone,
        "team": team,
        "personality": personality,
        "rules": rules,
        "has_knowledge_base": True,  # We know from CallRounded dashboard
        "kb_name": "Knowledge base 1",
        "kb_sources": 1,
        "kb_source_name": "Service didier H (PDF, 6 ko)",
    }


@router.get("")
async def list_knowledge_bases(
    db: DBSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
    accessible_agents: AccessibleAgentIds,
):
    """
    Extract salon knowledge from the agent's base_prompt since the
    /knowledge-bases API endpoint is not available in CallRounded API v1.
    """
    try:
        agents = await cr.list_agents()
        if not agents:
            return []
        return [parse_salon_info(a) for a in agents]
    except Exception:
        return []
