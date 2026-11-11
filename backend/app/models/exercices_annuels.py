from datetime import date
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, Enum as SAEnum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin, SyncMixin


class ExerciceStatut(str, Enum):
    EN_COURS = "EN_COURS"
    CLOTURE = "CLOTURE"


class ExerciceAnnuel(UUIDMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "exercices_annuels"

    libelle: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    date_debut: Mapped[date] = mapped_column(Date, nullable=False)
    date_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    statut: Mapped[ExerciceStatut] = mapped_column(
        SAEnum(ExerciceStatut, name="exercice_statut_enum"),
        default=ExerciceStatut.EN_COURS,
        nullable=False,
    )
    solde_initial: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )

    # Relations
    cotisations = relationship("Cotisation", back_populates="exercice")
    activites = relationship("Activite", back_populates="exercice")