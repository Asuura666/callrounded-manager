from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db
from routes import agents, calls, phone_numbers, knowledge_bases
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Créer l'application FastAPI
app = FastAPI(
    title=settings.app_name,
    description="API pour gérer les agents téléphoniques CallRounded",
    version="1.0.0",
)

# Ajouter le middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialiser la base de données
@app.on_event("startup")
async def startup_event():
    """Initialiser la base de données au démarrage."""
    try:
        init_db()
        logger.info("Base de données initialisée avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation de la base de données: {e}")


# Inclure les routes
app.include_router(agents.router)
app.include_router(calls.router)
app.include_router(phone_numbers.router)
app.include_router(knowledge_bases.router)


# Route de santé
@app.get("/health")
async def health_check():
    """Vérifier la santé de l'API."""
    return {
        "status": "healthy",
        "service": settings.app_name,
    }


# Route racine
@app.get("/")
async def root():
    """Route racine."""
    return {
        "message": "Bienvenue sur CallRounded Manager API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
