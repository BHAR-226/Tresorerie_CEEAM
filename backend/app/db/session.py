import sqlite3
import uuid
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Enregistrement de l'adaptateur UUID pour SQLite
sqlite3.register_adapter(uuid.UUID, str)

# Configuration des paramètres de connexion
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite nécessite check_same_thread=False pour autoriser les requêtes concurrentes de FastAPI
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,
)

# Activation des clés étrangères sur SQLite (désactivées par défaut dans SQLite)
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=engine
)


def get_db() -> Generator[Session, None, None]:
    """
    Dépendance FastAPI injectée dans chaque endpoint (@router).
    Ouvre une session SQLAlchemy par requête et la referme proprement à la fin.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
