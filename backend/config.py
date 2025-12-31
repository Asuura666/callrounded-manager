from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuration de l'application FastAPI."""
    
    # Base de données
    database_url: str = "postgresql://user:password@localhost/callrounded"
    
    # API CallRounded
    callrounded_api_key: str = ""
    callrounded_api_url: str = "https://api.callrounded.com/v1"
    
    # JWT
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173"]
    
    # Email (pour les notifications)
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    
    # Application
    app_name: str = "CallRounded Manager API"
    debug: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
