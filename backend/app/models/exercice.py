import enum
from datetime import date
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Enum, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, BaseModelMixin

if TYPE_CHECKING:
    from app.models.cotisation import Cotisation
    from app.models.depense import Activite


class ExerciceStatut(str, enum.Enum):
    EN_COURS = "EN_COURS"
    CLOTURE = "CLOTURE"


class ExerciceAnnuel(Base, BaseModelMixin):
    __tablename__ = "exercices_annuels"

    libelle: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)  # Ex: "2026-2027"
    date_debut: Mapped[date] = mapped_column(Date, nullable=False)
    date_fin: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    statut: Mapped[ExerciceStatut] = mapped_column(
        Enum(ExerciceStatut),
        default=ExerciceStatut.EN_COURS,
        nullable=False
    )
    solde_initial: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False
    )

    # Relations
    cotisations: Mapped[List["Cotisation"]] = relationship(
        "Cotisation",
        back_populates="exercice",
        cascade="all, delete-orphan"
    )
    activites: Mapped[List["Activite"]] = relationship(
        "Activite",
        back_populates="exercice",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ExerciceAnnuel {self.libelle} [{self.statut}]>"
