import httpx
from typing import Optional, List, Dict, Any
from config import settings
import logging

logger = logging.getLogger(__name__)


class CallRoundedService:
    """Service pour intégrer l'API CallRounded."""
    
    def __init__(self):
        self.api_key = settings.callrounded_api_key
        self.base_url = settings.callrounded_api_url
        self.headers = {
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json",
        }
    
    async def get_agents(self) -> List[Dict[str, Any]]:
        """Récupérer tous les agents."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/agents",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la récupération des agents: {e}")
            raise
    
    async def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """Récupérer les détails d'un agent."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/agents/{agent_id}",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", {})
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la récupération de l'agent {agent_id}: {e}")
            raise
    
    async def update_agent(self, agent_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Mettre à jour un agent (ex: changer le statut)."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/agents/{agent_id}",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", {})
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la mise à jour de l'agent {agent_id}: {e}")
            raise
    
    async def get_calls(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Récupérer les appels."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/calls",
                    headers=self.headers,
                    params={"limit": limit, "offset": offset},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la récupération des appels: {e}")
            raise
    
    async def get_call(self, call_id: str) -> Dict[str, Any]:
        """Récupérer les détails d'un appel."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/calls/{call_id}",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", {})
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la récupération de l'appel {call_id}: {e}")
            raise
    
    async def get_phone_numbers(self) -> List[Dict[str, Any]]:
        """Récupérer les numéros de téléphone."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/phone-numbers",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la récupération des numéros de téléphone: {e}")
            raise
    
    async def update_phone_number(self, phone_number_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Mettre à jour un numéro de téléphone."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/phone-numbers/{phone_number_id}",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", {})
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la mise à jour du numéro {phone_number_id}: {e}")
            raise
    
    async def get_knowledge_base(self, kb_id: str) -> Dict[str, Any]:
        """Récupérer les détails d'une base de connaissances."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/knowledge-bases/{kb_id}",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", {})
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la récupération de la base de connaissances {kb_id}: {e}")
            raise
    
    async def add_knowledge_base_sources(
        self, kb_id: str, source_ids: List[str]
    ) -> Dict[str, Any]:
        """Ajouter des sources à une base de connaissances."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/knowledge-bases/{kb_id}/sources",
                    headers=self.headers,
                    json={"source_ids": source_ids},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", {})
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de l'ajout de sources à la base {kb_id}: {e}")
            raise
    
    async def delete_knowledge_base_sources(
        self, kb_id: str, source_ids: List[str]
    ) -> Dict[str, Any]:
        """Supprimer des sources d'une base de connaissances."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/knowledge-bases/{kb_id}/sources",
                    headers=self.headers,
                    json={"source_ids": source_ids},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", {})
        except httpx.HTTPError as e:
            logger.error(f"Erreur lors de la suppression de sources de la base {kb_id}: {e}")
            raise


# Instance globale du service
callrounded_service = CallRoundedService()
