from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# --- Détection du type de base ---
IS_SQLITE = settings.DATABASE_URL.startswith("sqlite")

# --- Arguments de connexion ---
connect_args = {"check_same_thread": False} if IS_SQLITE else {}

engine: Engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,
    future=True,
)

# --- Session factory ---
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    future=True,
)


# --- Base déclarative SQLAlchemy 2.0 ---
class Base(DeclarativeBase):
    """Base commune à tous les modèles."""
    pass


# --- Activation des foreign keys sur SQLite (désactivées par défaut) ---
if IS_SQLITE:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


# --- Dépendance FastAPI ---
def get_db():
    """Yield une session, fermée automatiquement en fin de requête."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()