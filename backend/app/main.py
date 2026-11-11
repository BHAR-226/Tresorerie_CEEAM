from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.routers import pays, etudiants


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestionnaire de cycle de vie de l'application FastAPI.
    Exécuté au démarrage : initialise la base de données et les données de référence (Seed).
    """
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configuration CORS pour autoriser le frontend (React / Vite / PWA)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des routeurs
app.include_router(pays.router, prefix=settings.API_V1_STR)
app.include_router(etudiants.router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Racine"])
def root():
    return {
        "projet": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs",
        "statut": "Opérationnel"
    }


@app.get("/health", tags=["Santé"])
def health_check():
    return {"status": "ok"}
