
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.pays import Pays
from app.database import get_db
from app.models.etudiants import Etudiant
from app.schemas.etudiant import EtudiantCreate, EtudiantRead, EtudiantUpdate

from fastapi import HTTPException
from app.models.mixins import utcnow


router = APIRouter(prefix="/etudiants", tags=["Étudiants"])
    
@router.get("", response_model=list[EtudiantRead])
def lister_etudiants(pays_id: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Etudiant).where(Etudiant.deleted_at.is_(None))
    if pays_id is not None:
        stmt = stmt.where(Etudiant.pays_id == pays_id)
    return db.scalars(stmt).all()

@router.post("", response_model=EtudiantRead, status_code=201)
def creer_etudiant(data: EtudiantCreate, db: Session = Depends(get_db)):
    pays = db.get(Pays, data.pays_id)
    if not pays or pays.deleted_at is not None:
        raise HTTPException(status_code=422, detail="Pays inexistant")
    etudiant = Etudiant(**data.model_dump())
    db.add(etudiant)
    db.commit()
    db.refresh(etudiant)
    return etudiant

@router.get("/{etudiant_id}", response_model=EtudiantRead)
def obtenir_etudiant(etudiant_id: str, db: Session = Depends(get_db)):
    etudiant = db.get(Etudiant, etudiant_id)
    if not etudiant or etudiant.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    return etudiant

@router.put("/{etudiant_id}", response_model=EtudiantRead)
def mettre_a_jour_etudiant(etudiant_id: str, data: EtudiantUpdate, db: Session = Depends(get_db)):
    etudiant = db.get(Etudiant, etudiant_id)
    if not etudiant or etudiant.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    if data.pays_id is not None:
        pays = db.get(Pays, data.pays_id)
        if not pays or pays.deleted_at is not None:
            raise HTTPException(status_code=422, detail="Pays inexistant")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(etudiant, key, value)
    db.commit()
    db.refresh(etudiant)
    return etudiant

@router.delete("/{etudiant_id}", status_code=204)
def supprimer_etudiant(etudiant_id: str, db: Session = Depends(get_db)):    
    etudiant = db.get(Etudiant, etudiant_id)
    if not etudiant or etudiant.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    etudiant.deleted_at = utcnow()
    db.commit()
