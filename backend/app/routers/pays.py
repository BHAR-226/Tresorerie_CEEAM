from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pays import Pays
from app.schemas.pays import PaysCreate, PaysRead, PaysUpdate

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models.mixins import utcnow


router = APIRouter(prefix="/pays", tags=["Pays"])


@router.get("", response_model=list[PaysRead])
def lister_pays(db: Session = Depends(get_db)):
    return db.scalars(select(Pays).where(Pays.deleted_at.is_(None))).all()


@router.post("", response_model=PaysRead, status_code=201)
def creer_pays(data: PaysCreate, db: Session = Depends(get_db)):
    pays = Pays(**data.model_dump())
    db.add(pays)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ce pays existe déjà")
    db.refresh(pays)
    return pays

@router.get("/{pays_id}", response_model=PaysRead)
def obtenir_pays(pays_id: str, db: Session = Depends(get_db)):
    pays = db.get(Pays, pays_id)
    if not pays or pays.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Pays non trouvé")
    return pays

@router.put("/{pays_id}", response_model=PaysRead)
def mettre_a_jour_pays(pays_id: str, data: PaysUpdate, db: Session = Depends(get_db)):
    pays = db.get(Pays, pays_id)
    if not pays or pays.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Pays non trouvé")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(pays, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ce pays existe déjà")
    db.refresh(pays)
    return pays

@router.delete("/{pays_id}", status_code=204)
def supprimer_pays(pays_id: str, db: Session = Depends(get_db)):
    pays = db.get(Pays, pays_id)
    if not pays or pays.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Pays non trouvé")
    pays.deleted_at = utcnow()
    db.commit()