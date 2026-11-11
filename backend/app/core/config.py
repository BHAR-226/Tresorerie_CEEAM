from functools import lru_cache
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration centralisée, chargée depuis .env (pydantic-settings)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # --- Application ---
    PROJECT_NAME: str = "Trésorerie CEEAM"
    APP_NAME: str = "Trésorerie CEEAM"
    VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    API_V1_PREFIX: str = "/api/v1"

    # --- Base de données ---
    DATABASE_URL: str = "sqlite:///./tresorerie_ceeam.db"

    # --- Sécurité JWT ---
    SECRET_KEY: str = "ceeam-super-secret-key-change-in-production-tresorerie-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 heures

    # --- CORS (frontend React / Vite) ---
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # --- Administrateur initial (Trésorier) ---
    FIRST_SUPERUSER_EMAIL: str = "tresorier@ceeam.org"
    FIRST_SUPERUSER_PASSWORD: str = "admin_ceeam_2026"
    FIRST_SUPERUSER_NOM: str = "CEEAM"
    FIRST_SUPERUSER_PRENOM: str = "Trésorier"

    DEFAULT_ADMIN_EMAIL: str = "tresorier@ceeam.org"
    DEFAULT_ADMIN_PASSWORD: str = "admin_ceeam_2026"
    DEFAULT_ADMIN_NOM: str = "CEEAM"
    DEFAULT_ADMIN_PRENOM: str = "Trésorier"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
