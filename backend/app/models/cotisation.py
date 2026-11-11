import uuid
from datetime import date
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Date, Numeric, Boolean, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, BaseModelMixin

if TYPE_CHECKING:
    from app.models.exercice import ExerciceAnnuel


class Pays(Base, BaseModelMixin):
    __tablename__ = "pays"

    nom: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    code_iso: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)  # Ex: "SN", "CI", "ML", "GA"

    # Relations
    etudiants: Mapped[List["Etudiant"]] = relationship(
        "Etudiant",
        back_populates="pays",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Pays {self.nom}>"


class Etudiant(Base, BaseModelMixin):
    __tablename__ = "etudiants"

    pays_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("pays.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    prenom: Mapped[str] = mapped_column(String(100), nullable=False)
    niveau: Mapped[str] = mapped_column(String(50), nullable=False)  # Ex: "1ère année", "Master 2"
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relations
    pays: Mapped["Pays"] = relationship("Pays", back_populates="etudiants")
    cotisations: Mapped[List["Cotisation"]] = relationship(
        "Cotisation",
        back_populates="etudiant",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Etudiant {self.prenom} {self.nom}>"


class Cotisation(Base, BaseModelMixin):
    __tablename__ = "cotisations"

    etudiant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("etudiants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    exercice_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("exercices_annuels.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    montant: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    date_paiement: Mapped[date] = mapped_column(Date, nullable=False)
    commentaire: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relations
    etudiant: Mapped["Etudiant"] = relationship("Etudiant", back_populates="cotisations")
    exercice: Mapped["ExerciceAnnuel"] = relationship("ExerciceAnnuel", back_populates="cotisations")

    def __repr__(self) -> str:
        return f"<Cotisation {self.montant} MAD par {self.etudiant_id}>"
