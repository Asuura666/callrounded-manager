from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://callrounded:callrounded@db:5432/callrounded"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CallRounded API
    CALLROUNDED_API_URL: str = "https://api.callrounded.com/v1"
    CALLROUNDED_API_KEY: str = "demo"
    CALLROUNDED_AGENT_ID: str = ""

    # CORS
    FRONTEND_URL: str = "http://localhost:3100"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
