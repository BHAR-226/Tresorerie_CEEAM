from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User
from app.core.security import get_current_admin
from app.services.sync_service import pull_changes, push_changes

router = APIRouter(prefix="/sync", tags=["Synchronisation Offline-First"])


@router.get("/pull")
def pull_donnees(
    last_sync: Optional[str] = Query(None, description="Horodatage ISO de la dernière synchronisation"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Récupère toutes les modifications intervenues depuis la dernière synchronisation.
    Permet au client (PC/Mobile) de mettre à jour sa base de données locale.
    """
    dt_sync = datetime.fromisoformat(last_sync) if last_sync else None
    return pull_changes(db, dt_sync)


@router.post("/push")
def push_donnees(
    payload: Dict[str, List[Dict[str, Any]]] = Body(..., description="Données modifiées en mode hors-ligne"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Envoie au serveur central les créations et modifications effectuées hors-ligne.
    Résolution de conflit Last-Write-Wins (LWW).
    """
    return push_changes(db, payload)
