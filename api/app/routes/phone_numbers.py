from fastapi import APIRouter

from ..deps import CurrentUser, DBSession, TenantId
from ..services import callrounded as cr

router = APIRouter()


@router.get("")
async def list_phone_numbers(db: DBSession, current_user: CurrentUser, tenant_id: TenantId):
    """List phone numbers from CallRounded API."""
    try:
        numbers = await cr.list_phone_numbers()
        return numbers
    except Exception:
        return []
