from app.database import Base, settings, engine
from fastapi import FastAPI
from app.routers import pays
from app.routers import etudiants

app = FastAPI(title="CEEAM Trésorerie")

@app.get("/")
def accueil():
    return {"message": "API CEEAM opérationnelle"}

Base.metadata.create_all(bind=engine)


app.include_router(pays.router, prefix=settings.API_V1_PREFIX)
app.include_router(etudiants.router, prefix=settings.API_V1_PREFIX)