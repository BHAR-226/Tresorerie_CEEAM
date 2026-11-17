from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User
from app.models.exercices_annuels import ExerciceAnnuel, ExerciceStatut
from app.models.activite import Activite
from app.models.categories_depenses import CategorieDepense
from app.models.depenses import Depense
from app.models.mixins import utcnow
from app.core.security import get_current_admin
from app.schemas.depense import (
    ActiviteCreate,
    ActiviteResponse,
    ActiviteUpdate,
    CategorieDepenseCreate,
    CategorieDepenseResponse,
    DepenseCreate,
    DepenseResponse,
    DepenseUpdate,
)

router = APIRouter(tags=["Dépenses & Activités"])


# =====================================================================
# 1. ACTIVITÉS
# =====================================================================
@router.get("/activites", response_model=List[ActiviteResponse])
def lister_activites(
    exercice_id: Optional[str] = Query(None, description="Filtrer par exercice"),
    db: Session = Depends(get_db)
):
    """Liste toutes les activités avec leurs sous-totaux et catégories."""
    stmt = select(Activite).where(Activite.deleted_at.is_(None))
    if exercice_id:
        stmt = stmt.where(Activite.exercice_id == exercice_id)
    stmt = stmt.order_by(Activite.date_activite.desc())
    activites = db.scalars(stmt).all()

    resultats = []
    for act in activites:
        # Calcul du total des dépenses de l'activité
        total_act = db.scalar(
            select(func.coalesce(func.sum(Depense.prix), Decimal("0.00")))
            .join(CategorieDepense, Depense.categorie_id == CategorieDepense.id)
            .where(
                CategorieDepense.activite_id == act.id,
                CategorieDepense.deleted_at.is_(None),
                Depense.deleted_at.is_(None)
            )
        ) or Decimal("0.00")

        depassement = bool(act.budget_prevu is not None and total_act > act.budget_prevu)

        # Construction des catégories et dépenses non supprimées
        categories_resp = []
        for cat in act.categories:
            if cat.deleted_at is not None:
                continue
            cat_depenses = [d for d in cat.depenses if d.deleted_at is None]
            cat_total = sum((d.prix for d in cat_depenses), Decimal("0.00"))
            categories_resp.append(
                CategorieDepenseResponse(
                    id=cat.id,
                    activite_id=cat.activite_id,
                    nom=cat.nom,
                    created_at=cat.created_at,
                    updated_at=cat.updated_at,
                    total_categorie=cat_total,
                    depenses=cat_depenses
                )
            )

        resultats.append(
            ActiviteResponse(
                id=act.id,
                exercice_id=act.exercice_id,
                nom=act.nom,
                description=act.description,
                date_activite=act.date_activite,
                budget_prevu=act.budget_prevu,
                created_at=act.created_at,
                updated_at=act.updated_at,
                total_depense=total_act,
                depassement_budget=depassement,
                categories=categories_resp
            )
        )

    return resultats


@router.post("/activites", response_model=ActiviteResponse, status_code=status.HTTP_201_CREATED)
def creer_activite(
    data: ActiviteCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle activité pour un exercice en cours (Trésorier)."""
    exercice = db.get(ExerciceAnnuel, str(data.exercice_id))
    if not exercice or exercice.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Exercice introuvable")
    if exercice.statut == ExerciceStatut.CLOTURE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercice déjà clôturé")

    data_dict = {k: str(v) if hasattr(v, "hex") else v for k, v in data.model_dump().items()}
    act = Activite(**data_dict)
    db.add(act)
    db.commit()
    db.refresh(act)
    return ActiviteResponse(
        id=act.id,
        exercice_id=act.exercice_id,
        nom=act.nom,
        description=act.description,
        date_activite=act.date_activite,
        budget_prevu=act.budget_prevu,
        created_at=act.created_at,
        updated_at=act.updated_at,
        total_depense=Decimal("0.00"),
        depassement_budget=False,
        categories=[]
    )


@router.delete("/activites/{activite_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_activite(activite_id: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Soft delete d'une activité (Trésorier)."""
    act = db.get(Activite, activite_id)
    if not act or act.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activité non trouvée")
    act.deleted_at = utcnow()
    db.commit()


# =====================================================================
# 2. CATÉGORIES DE DÉPENSES
# =====================================================================
@router.post("/categories", response_model=CategorieDepenseResponse, status_code=status.HTTP_201_CREATED)
def creer_categorie(
    data: CategorieDepenseCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Ajoute une catégorie de dépense à une activité (ex: Bus, Nourriture)."""
    act = db.get(Activite, str(data.activite_id))
    if not act or act.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Activité introuvable")

    data_dict = {k: str(v) if hasattr(v, "hex") else v for k, v in data.model_dump().items()}
    cat = CategorieDepense(**data_dict)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return CategorieDepenseResponse(
        id=cat.id,
        activite_id=cat.activite_id,
        nom=cat.nom,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
        total_categorie=Decimal("0.00"),
        depenses=[]
    )


@router.delete("/categories/{categorie_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_categorie(categorie_id: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Soft delete d'une catégorie (Trésorier)."""
    cat = db.get(CategorieDepense, categorie_id)
    if not cat or cat.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catégorie non trouvée")
    cat.deleted_at = utcnow()
    db.commit()


# =====================================================================
# 3. DÉPENSES UNITAIRES
# =====================================================================
@router.post("/depenses", response_model=DepenseResponse, status_code=status.HTTP_201_CREATED)
def enregistrer_depense(
    data: DepenseCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Enregistre une dépense unitaire dans une catégorie (Trésorier)."""
    cat = db.get(CategorieDepense, str(data.categorie_id))
    if not cat or cat.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Catégorie introuvable")

    data_dict = {k: str(v) if hasattr(v, "hex") else v for k, v in data.model_dump().items()}
    depense = Depense(**data_dict)
    db.add(depense)
    db.commit()
    db.refresh(depense)
    return depense


@router.put("/depenses/{depense_id}", response_model=DepenseResponse)
def modifier_depense(
    depense_id: str,
    data: DepenseUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Modifie une dépense unitaire (Trésorier)."""
    depense = db.get(Depense, depense_id)
    if not depense or depense.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dépense non trouvée")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(depense, key, value)

    depense.updated_at = utcnow()
    db.commit()
    db.refresh(depense)
    return depense


@router.delete("/depenses/{depense_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_depense(depense_id: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Soft delete d'une dépense (Trésorier)."""
    depense = db.get(Depense, depense_id)
    if not depense or depense.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dépense non trouvée")
    depense.deleted_at = utcnow()
    db.commit()
