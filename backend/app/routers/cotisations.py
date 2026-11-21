from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.users import User
from app.models.exercices_annuels import ExerciceAnnuel, ExerciceStatut
from app.models.pays import Pays
from app.models.etudiants import Etudiant
from app.models.cotisations import Cotisation
from app.models.mixins import utcnow
from app.core.security import get_current_admin
from app.schemas.cotisation import CotisationCreate, CotisationDirectCreate, CotisationResponse, CotisationUpdate

router = APIRouter(prefix="/cotisations", tags=["Cotisations (Quotas)"])


@router.get("", response_model=List[CotisationResponse])
def lister_cotisations(
    exercice_id: Optional[str] = Query(None, description="Filtrer par année académique"),
    etudiant_id: Optional[str] = Query(None, description="Filtrer par étudiant"),
    pays_id: Optional[str] = Query(None, description="Filtrer par pays d'origine"),
    db: Session = Depends(get_db)
):
    """
    Liste les cotisations enregistrées avec filtres optionnels.
    Accessible en lecture seule aux visiteurs et aux membres.
    """
    stmt = select(Cotisation).options(
        joinedload(Cotisation.etudiant).joinedload(Etudiant.pays)
    ).where(Cotisation.deleted_at.is_(None))

    if exercice_id and isinstance(exercice_id, str):
        stmt = stmt.where(Cotisation.exercice_id == exercice_id)
    if etudiant_id and isinstance(etudiant_id, str):
        stmt = stmt.where(Cotisation.etudiant_id == etudiant_id)
    if pays_id and isinstance(pays_id, str):
        stmt = stmt.join(Etudiant, Cotisation.etudiant_id == Etudiant.id).where(Etudiant.pays_id == pays_id)

    stmt = stmt.order_by(Cotisation.date_paiement.desc())
    return db.scalars(stmt).all()


@router.get("/{cotisation_id}", response_model=CotisationResponse)
def obtenir_cotisation(cotisation_id: str, db: Session = Depends(get_db)):
    """Récupère les détails d'un versement spécifique."""
    cotisation = db.get(Cotisation, cotisation_id)
    if not cotisation or cotisation.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cotisation non trouvée")
    return cotisation


@router.post("", response_model=CotisationResponse, status_code=status.HTTP_201_CREATED)
def enregistrer_cotisation(
    data: CotisationCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Enregistre un versement de cotisation pour un étudiant (Réservé au Trésorier).
    """
    # 1. Vérifier l'exercice
    exercice = db.get(ExerciceAnnuel, str(data.exercice_id))
    if not exercice or exercice.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Exercice introuvable")
    if exercice.statut == ExerciceStatut.CLOTURE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'enregistrer une cotisation sur un exercice clôturé"
        )

    # 2. Vérifier l'étudiant
    etudiant = db.get(Etudiant, str(data.etudiant_id))
    if not etudiant or etudiant.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Étudiant introuvable")

    data_dict = {k: str(v) if hasattr(v, "hex") else v for k, v in data.model_dump().items()}
    nouvelle_cotisation = Cotisation(**data_dict)
    db.add(nouvelle_cotisation)
    db.commit()
    db.refresh(nouvelle_cotisation)
    return nouvelle_cotisation


@router.post("/direct", response_model=CotisationResponse, status_code=status.HTTP_201_CREATED)
def enregistrer_cotisation_direct(
    data: CotisationDirectCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Enregistre une cotisation en saisissant directement Nom, Prénoms, Pays et Année (création automatique de l'étudiant).
    """
    exercice = db.get(ExerciceAnnuel, str(data.exercice_id))
    if not exercice or exercice.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Exercice introuvable")
    if exercice.statut == ExerciceStatut.CLOTURE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'enregistrer une cotisation sur un exercice clôturé"
        )

    pays = db.get(Pays, str(data.pays_id))
    if not pays or pays.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Pays introuvable")

    nom_propre = data.nom.strip()
    prenom_propre = data.prenom.strip()

    etudiant = db.scalars(
        select(Etudiant).where(
            Etudiant.pays_id == str(data.pays_id),
            func.lower(Etudiant.nom) == nom_propre.lower(),
            func.lower(Etudiant.prenom) == prenom_propre.lower(),
            Etudiant.deleted_at.is_(None)
        )
    ).first()

    if not etudiant:
        etudiant = Etudiant(
            pays_id=str(data.pays_id),
            nom=nom_propre,
            prenom=prenom_propre,
            niveau=data.niveau.strip(),
            actif=True
        )
        db.add(etudiant)
        db.flush()
    else:
        if data.niveau:
            etudiant.niveau = data.niveau.strip()

    nouvelle_cotisation = Cotisation(
        etudiant_id=etudiant.id,
        exercice_id=str(data.exercice_id),
        montant=data.montant,
        date_paiement=data.date_paiement,
    )
    db.add(nouvelle_cotisation)
    db.commit()

    cotisation_complete = db.scalars(
        select(Cotisation).options(
            joinedload(Cotisation.etudiant).joinedload(Etudiant.pays)
        ).where(Cotisation.id == nouvelle_cotisation.id)
    ).first()

    return cotisation_complete


@router.put("/{cotisation_id}", response_model=CotisationResponse)
def modifier_cotisation(
    cotisation_id: str,
    data: CotisationUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Modifie une cotisation existante (Réservé au Trésorier)."""
    cotisation = db.get(Cotisation, cotisation_id)
    if not cotisation or cotisation.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cotisation non trouvée")

    exercice = db.get(ExerciceAnnuel, cotisation.exercice_id)
    if exercice and exercice.statut == ExerciceStatut.CLOTURE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de modifier une cotisation sur un exercice clôturé"
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(cotisation, key, value)

    cotisation.updated_at = utcnow()
    db.commit()
    db.refresh(cotisation)
    return cotisation


@router.delete("/{cotisation_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_cotisation(
    cotisation_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Suppression logique (soft delete) d'une cotisation (Réservé au Trésorier)."""
    cotisation = db.get(Cotisation, cotisation_id)
    if not cotisation or cotisation.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cotisation non trouvée")

    exercice = db.get(ExerciceAnnuel, cotisation.exercice_id)
    if exercice and exercice.statut == ExerciceStatut.CLOTURE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer une cotisation sur un exercice clôturé"
        )

    cotisation.deleted_at = utcnow()
    db.commit()
