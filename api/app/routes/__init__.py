from fastapi import APIRouter

from . import admin, agents, alerts, analytics, auth, calls, dashboard, knowledge_bases, llm, phone_numbers, templates

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(calls.router, prefix="/calls", tags=["calls"])
api_router.include_router(phone_numbers.router, prefix="/phone-numbers", tags=["phone-numbers"])
api_router.include_router(knowledge_bases.router, prefix="/knowledge-bases", tags=["knowledge-bases"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(llm.router, tags=["llm"])
api_router.include_router(templates.router, tags=["templates"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(alerts.router, tags=["alerts"])  # Sprint 4
