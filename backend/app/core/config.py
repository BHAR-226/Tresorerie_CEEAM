from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Trésorerie CEEAM"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Base de données
    DATABASE_URL: str = "sqlite:///./tresorerie_ceeam.db"

    # Sécurité JWT
    SECRET_KEY: str = "ceeam-super-secret-key-change-in-production-tresorerie-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 heures

    # CORS autorisés
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite React dev
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # Identifiants initiaux du Trésorier (Admin)
    FIRST_SUPERUSER_EMAIL: str = "tresorier@ceeam.org"
    FIRST_SUPERUSER_PASSWORD: str = "admin_ceeam_2026"
    FIRST_SUPERUSER_NOM: str = "CEEAM"
    FIRST_SUPERUSER_PRENOM: str = "Trésorier"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
