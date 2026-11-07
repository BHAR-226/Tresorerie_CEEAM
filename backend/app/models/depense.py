import uuid
from datetime import date
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Date, Numeric, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, BaseModelMixin

if TYPE_CHECKING:
    from app.models.exercice import ExerciceAnnuel


class Activite(Base, BaseModelMixin):
    __tablename__ = "activites"

    exercice_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("exercices_annuels.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    nom: Mapped[str] = mapped_column(String(150), nullable=False)  # Ex: "Sortie Ifrane"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date_activite: Mapped[date] = mapped_column(Date, nullable=False)
    budget_prevu: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)

    # Relations
    exercice: Mapped["ExerciceAnnuel"] = relationship("ExerciceAnnuel", back_populates="activites")
    categories: Mapped[List["CategorieDepense"]] = relationship(
        "CategorieDepense",
        back_populates="activite",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Activite {self.nom}>"


class CategorieDepense(Base, BaseModelMixin):
    __tablename__ = "categories_depenses"

    activite_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("activites.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    nom: Mapped[str] = mapped_column(String(100), nullable=False)  # Ex: "Bus", "Nourriture"

    # Relations
    activite: Mapped["Activite"] = relationship("Activite", back_populates="categories")
    depenses: Mapped[List["Depense"]] = relationship(
        "Depense",
        back_populates="categorie",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<CategorieDepense {self.nom} (Activite: {self.activite_id})>"


class Depense(Base, BaseModelMixin):
    __tablename__ = "depenses"

    categorie_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories_depenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    nom: Mapped[str] = mapped_column(String(150), nullable=False)  # Ex: "Location de bus", "Pain"
    prix: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    date_depense: Mapped[date] = mapped_column(Date, nullable=False)
    justificatif_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relations
    categorie: Mapped["CategorieDepense"] = relationship("CategorieDepense", back_populates="depenses")

    def __repr__(self) -> str:
        return f"<Depense {self.nom}: {self.prix} MAD>"
