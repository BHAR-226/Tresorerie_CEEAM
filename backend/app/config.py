from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration centralisée, chargée depuis .env (pydantic-settings)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "CEEAM Trésorerie"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # --- Base de données ---
    DATABASE_URL: str = "sqlite:///./ceeam.db"

    # --- JWT ---
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # --- CORS ---
    CORS_ORIGINS: List[str] = Field(default_factory=list)

    # --- Seed admin ---
    DEFAULT_ADMIN_EMAIL: str = "tresorier@ceeam.ma"
    DEFAULT_ADMIN_PASSWORD: str = "ChangeMe123!"
    DEFAULT_ADMIN_NOM: str = "Trésorier"
    DEFAULT_ADMIN_PRENOM: str = "CEEAM"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_cors_origins(cls, v):
        """Accepte une chaîne 'a,b,c' depuis le .env et la transforme en liste."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    """Cache les settings pour éviter de re-parser le .env à chaque appel."""
    return Settings()


settings = get_settings()