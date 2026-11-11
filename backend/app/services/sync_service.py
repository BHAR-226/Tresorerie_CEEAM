from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.mixins import SyncStatus
from app.models.pays import Pays
from app.models.etudiants import Etudiant
from app.models.cotisations import Cotisation
from app.models.activite import Activite
from app.models.categories_depenses import CategorieDepense
from app.models.depenses import Depense
from app.models.exercices_annuels import ExerciceAnnuel


MODELS_MAP = {
    "pays": Pays,
    "etudiants": Etudiant,
    "cotisations": Cotisation,
    "activites": Activite,
    "categories_depenses": CategorieDepense,
    "depenses": Depense,
    "exercices_annuels": ExerciceAnnuel,
}


def pull_changes(db: Session, last_sync: Optional[datetime] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Récupère tous les enregistrements créés, modifiés ou supprimés (soft-delete)
    depuis 'last_sync' pour les propager aux clients hors-ligne.
    """
    changes: Dict[str, List[Dict[str, Any]]] = {}

    for table_name, model_cls in MODELS_MAP.items():
        stmt = select(model_cls)
        if last_sync:
            stmt = stmt.where(model_cls.updated_at > last_sync)

        records = db.scalars(stmt).all()
        changes[table_name] = [
            {col.name: getattr(r, col.name) for col in model_cls.__table__.columns}
            for r in records
        ]

    return changes


def push_changes(db: Session, client_changes: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Applique les modifications envoyées par un client déconnecté.
    Stratégie de résolution des conflits : Last-Write-Wins (LWW) basée sur updated_at.
    """
    applied_count = 0

    for table_name, records in client_changes.items():
        model_cls = MODELS_MAP.get(table_name)
        if not model_cls:
            continue

        for record_data in records:
            rec_id = record_data.get("id")
            if not rec_id:
                continue

            existing = db.get(model_cls, rec_id)
            if existing:
                # Last Write Wins : on n'écrase que si la donnée client est plus récente ou égale
                client_updated = record_data.get("updated_at")
                if isinstance(client_updated, str):
                    client_updated = datetime.fromisoformat(client_updated)

                if client_updated and existing.updated_at and client_updated < existing.updated_at:
                    continue  # Conflit : la version serveur est plus récente

                for k, v in record_data.items():
                    if hasattr(existing, k) and k != "id":
                        setattr(existing, k, v)
                existing.sync_status = SyncStatus.SYNCED
            else:
                new_record = model_cls(**record_data)
                if hasattr(new_record, "sync_status"):
                    new_record.sync_status = SyncStatus.SYNCED
                db.add(new_record)

            applied_count += 1

    db.commit()
    return {
        "status": "success",
        "applied_count": applied_count,
        "sync_timestamp": datetime.now(timezone.utc).isoformat()
    }
