from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin, SyncMixin


class Pays(UUIDMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "pays"

    nom: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code_iso: Mapped[str | None] = mapped_column(String(5), nullable=True)

    # Relations
    etudiants = relationship("Etudiant", back_populates="pays")