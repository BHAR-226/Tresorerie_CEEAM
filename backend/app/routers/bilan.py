from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exercices_annuels import ExerciceAnnuel
from app.schemas.bilan import BilanResponse, HistoriqueComparatifResponse
from app.services.bilan_service import get_bilan_complet, get_historique_comparatif
from app.services.pdf_service import generer_rapport_financier_pdf

router = APIRouter(prefix="/bilan", tags=["Bilan & Tableaux de Bord"])


@router.get("/historique", response_model=HistoriqueComparatifResponse)
def obtenir_historique_pluriannuel(db: Session = Depends(get_db)):
    """
    Récupère le comparatif financier de tous les exercices académiques.
    Alimente le graphique d'évolution pluriannuelle.
    """
    data = get_historique_comparatif(db)
    return {"exercices": data}


@router.get("/{exercice_id}", response_model=BilanResponse)
def obtenir_bilan_exercice(exercice_id: str, db: Session = Depends(get_db)):
    """
    Récupère le tableau de bord complet de l'exercice :
    - KPIs : Solde initial, total cotisé, total dépensé, solde disponible.
    - Activité la plus budgétivore.
    - Données pour les graphiques :
      • BarChart de recouvrement des cotisations par pays
      • Répartition par catégorie de dépense
      • Comparatif Budget vs Dépenses Réelles
      • Courbe de trésorerie mensuelle
    """
    exercice = db.get(ExerciceAnnuel, exercice_id)
    if not exercice or exercice.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercice introuvable")

    return get_bilan_complet(db, exercice_id)


@router.get("/{exercice_id}/pdf")
def telecharger_rapport_pdf(exercice_id: str, db: Session = Depends(get_db)):
    """
    Génère et télécharge le rapport financier annuel officiel au format PDF.
    """
    exercice = db.get(ExerciceAnnuel, exercice_id)
    if not exercice or exercice.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercice introuvable")

    pdf_stream = generer_rapport_financier_pdf(db, exercice_id)
    filename = f"rapport_financier_CEEAM_{exercice.libelle.replace('/', '_')}.pdf"

    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
