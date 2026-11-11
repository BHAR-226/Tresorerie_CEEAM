from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional, Any
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from app.models import (
    ExerciceAnnuel,
    ExerciceStatut,
    Pays,
    Etudiant,
    Cotisation,
    Activite,
    CategorieDepense,
    Depense,
)


def get_kpis_exercice(db: Session, exercice_id: str) -> Dict[str, Any]:
    """
    Calcule les indicateurs clés (KPIs) pour un exercice donné :
    - Solde initial (report à nouveau)
    - Total cotisé (Recettes)
    - Total dépensé (Charges)
    - Solde disponible actuel
    """
    exercice = db.get(ExerciceAnnuel, exercice_id)
    if not exercice or exercice.deleted_at is not None:
        return {
            "solde_initial": Decimal("0.00"),
            "total_cotise": Decimal("0.00"),
            "total_depense": Decimal("0.00"),
            "solde_disponible": Decimal("0.00"),
        }

    solde_initial = exercice.solde_initial or Decimal("0.00")

    # 1. Total cotisé
    stmt_cotisations = select(func.coalesce(func.sum(Cotisation.montant), Decimal("0.00"))).where(
        Cotisation.exercice_id == exercice_id,
        Cotisation.deleted_at.is_(None)
    )
    total_cotise = db.scalar(stmt_cotisations) or Decimal("0.00")

    # 2. Total dépensé (jointure activite -> categorie -> depense)
    stmt_depenses = (
        select(func.coalesce(func.sum(Depense.prix), Decimal("0.00")))
        .join(CategorieDepense, Depense.categorie_id == CategorieDepense.id)
        .join(Activite, CategorieDepense.activite_id == Activite.id)
        .where(
            Activite.exercice_id == exercice_id,
            Activite.deleted_at.is_(None),
            CategorieDepense.deleted_at.is_(None),
            Depense.deleted_at.is_(None)
        )
    )
    total_depense = db.scalar(stmt_depenses) or Decimal("0.00")

    solde_disponible = solde_initial + total_cotise - total_depense

    return {
        "exercice_id": exercice.id,
        "exercice_libelle": exercice.libelle,
        "exercice_statut": exercice.statut.value,
        "solde_initial": solde_initial,
        "total_cotise": total_cotise,
        "total_depense": total_depense,
        "solde_disponible": solde_disponible,
    }


def get_activite_budgetivore(db: Session, exercice_id: str, total_depense: Decimal) -> Optional[Dict[str, Any]]:
    """
    Identifie l'activité la plus coûteuse de l'exercice et sa part en pourcentage.
    """
    if total_depense <= Decimal("0.00"):
        return None

    stmt = (
        select(
            Activite.id,
            Activite.nom,
            func.coalesce(func.sum(Depense.prix), Decimal("0.00")).label("total_act")
        )
        .join(CategorieDepense, Activite.id == CategorieDepense.activite_id)
        .join(Depense, CategorieDepense.id == Depense.categorie_id)
        .where(
            Activite.exercice_id == exercice_id,
            Activite.deleted_at.is_(None),
            CategorieDepense.deleted_at.is_(None),
            Depense.deleted_at.is_(None)
        )
        .group_by(Activite.id, Activite.nom)
        .order_by(func.sum(Depense.prix).desc())
        .limit(1)
    )
    result = db.execute(stmt).first()
    if not result:
        return None

    act_id, act_nom, act_total = result
    pourcentage = float((act_total / total_depense) * 100) if total_depense > 0 else 0.0

    return {
        "activite_id": act_id,
        "activite_nom": act_nom,
        "total_depense": act_total,
        "pourcentage_des_depenses": round(pourcentage, 1)
    }


def get_stats_cotisations_par_pays(db: Session, exercice_id: str) -> List[Dict[str, Any]]:
    """
    Calcule pour chaque pays :
    - Nombre total d'étudiants actifs
    - Nombre de cotisants
    - Total cotisé en MAD
    - Taux de participation (%)
    Trié par total cotisé décroissant (idéal pour le BarChart).
    """
    pays_liste = db.scalars(
        select(Pays).where(Pays.deleted_at.is_(None)).order_by(Pays.nom)
    ).all()

    resultats = []
    for pays in pays_liste:
        # 1. Total étudiants actifs
        nb_etudiants = db.scalar(
            select(func.count(Etudiant.id)).where(
                Etudiant.pays_id == pays.id,
                Etudiant.actif.is_(True),
                Etudiant.deleted_at.is_(None)
            )
        ) or 0

        # 2. Nombre d'étudiants ayant au moins une cotisation dans cet exercice
        nb_cotisants = db.scalar(
            select(func.count(func.distinct(Cotisation.etudiant_id)))
            .join(Etudiant, Cotisation.etudiant_id == Etudiant.id)
            .where(
                Etudiant.pays_id == pays.id,
                Cotisation.exercice_id == exercice_id,
                Cotisation.deleted_at.is_(None),
                Etudiant.deleted_at.is_(None)
            )
        ) or 0

        # 3. Total MAD collecté
        total_cotise = db.scalar(
            select(func.coalesce(func.sum(Cotisation.montant), Decimal("0.00")))
            .join(Etudiant, Cotisation.etudiant_id == Etudiant.id)
            .where(
                Etudiant.pays_id == pays.id,
                Cotisation.exercice_id == exercice_id,
                Cotisation.deleted_at.is_(None),
                Etudiant.deleted_at.is_(None)
            )
        ) or Decimal("0.00")

        # 4. Taux de participation
        taux = round((nb_cotisants / nb_etudiants * 100), 1) if nb_etudiants > 0 else 0.0

        resultats.append({
            "pays_id": pays.id,
            "pays_nom": pays.nom,
            "code_iso": pays.code_iso,
            "nombre_etudiants": nb_etudiants,
            "nombre_cotisants": nb_cotisants,
            "total_cotise": total_cotise,
            "taux_participation": taux
        })

    # Tri par total cotisé décroissant
    resultats.sort(key=lambda x: x["total_cotise"], reverse=True)
    return resultats


def get_repartition_categories(db: Session, exercice_id: str, total_depense: Decimal) -> List[Dict[str, Any]]:
    """
    Agrège les dépenses par nom de catégorie pour l'exercice.
    """
    stmt = (
        select(
            CategorieDepense.nom,
            func.coalesce(func.sum(Depense.prix), Decimal("0.00")).label("cat_total")
        )
        .join(Depense, CategorieDepense.id == Depense.categorie_id)
        .join(Activite, CategorieDepense.activite_id == Activite.id)
        .where(
            Activite.exercice_id == exercice_id,
            Activite.deleted_at.is_(None),
            CategorieDepense.deleted_at.is_(None),
            Depense.deleted_at.is_(None)
        )
        .group_by(CategorieDepense.nom)
        .order_by(func.sum(Depense.prix).desc())
    )
    rows = db.execute(stmt).all()

    resultats = []
    for cat_nom, cat_total in rows:
        pct = float((cat_total / total_depense) * 100) if total_depense > 0 else 0.0
        resultats.append({
            "categorie_nom": cat_nom,
            "total": cat_total,
            "pourcentage": round(pct, 1)
        })
    return resultats


def get_comparaison_activites(db: Session, exercice_id: str) -> List[Dict[str, Any]]:
    """
    Récupère la comparaison 'Budget Prévu vs Dépenses Réelles' pour chaque activité.
    """
    activites = db.scalars(
        select(Activite).where(
            Activite.exercice_id == exercice_id,
            Activite.deleted_at.is_(None)
        ).order_by(Activite.date_activite)
    ).all()

    resultats = []
    for act in activites:
        total_act = db.scalar(
            select(func.coalesce(func.sum(Depense.prix), Decimal("0.00")))
            .join(CategorieDepense, Depense.categorie_id == CategorieDepense.id)
            .where(
                CategorieDepense.activite_id == act.id,
                CategorieDepense.deleted_at.is_(None),
                Depense.deleted_at.is_(None)
            )
        ) or Decimal("0.00")

        budget = act.budget_prevu
        depassement = bool(budget is not None and total_act > budget)
        ecart = (total_act - budget) if budget is not None else Decimal("0.00")

        resultats.append({
            "activite_id": act.id,
            "nom": act.nom,
            "date_activite": act.date_activite.isoformat(),
            "budget_prevu": budget,
            "total_depense": total_act,
            "depassement": depassement,
            "ecart": ecart
        })
    return resultats


def get_evolution_mensuelle(db: Session, exercice_id: str, solde_initial: Decimal) -> List[Dict[str, Any]]:
    """
    Calcule l'évolution mensuelle des recettes, charges et du solde cumulé.
    """
    # 1. Cotisations par mois
    cotisations = db.execute(
        select(Cotisation.date_paiement, Cotisation.montant).where(
            Cotisation.exercice_id == exercice_id,
            Cotisation.deleted_at.is_(None)
        )
    ).all()

    # 2. Dépenses par mois
    depenses = db.execute(
        select(Depense.date_depense, Depense.prix)
        .join(CategorieDepense, Depense.categorie_id == CategorieDepense.id)
        .join(Activite, CategorieDepense.activite_id == Activite.id)
        .where(
            Activite.exercice_id == exercice_id,
            Activite.deleted_at.is_(None),
            CategorieDepense.deleted_at.is_(None),
            Depense.deleted_at.is_(None)
        )
    ).all()

    # Dictionnaire regroupé par "YYYY-MM"
    mois_map: Dict[str, Dict[str, Decimal]] = {}

    for d_paiement, montant in cotisations:
        cle = d_paiement.strftime("%Y-%m")
        if cle not in mois_map:
            mois_map[cle] = {"cotisations": Decimal("0.00"), "depenses": Decimal("0.00")}
        mois_map[cle]["cotisations"] += montant

    for d_depense, prix in depenses:
        cle = d_depense.strftime("%Y-%m")
        if cle not in mois_map:
            mois_map[cle] = {"cotisations": Decimal("0.00"), "depenses": Decimal("0.00")}
        mois_map[cle]["depenses"] += prix

    # Tri chronologique et calcul du solde cumulé
    mois_tries = sorted(mois_map.keys())
    resultats = []
    solde_courant = solde_initial

    for cle in mois_tries:
        recettes = mois_map[cle]["cotisations"]
        charges = mois_map[cle]["depenses"]
        solde_courant += (recettes - charges)
        # Format d'affichage : "MM/YYYY"
        annee, mois_num = cle.split("-")
        label = f"{mois_num}/{annee}"
        resultats.append({
            "mois": label,
            "cotisations": recettes,
            "depenses": charges,
            "solde": solde_courant
        })

    return resultats


def get_bilan_complet(db: Session, exercice_id: str) -> Dict[str, Any]:
    """
    Rassemble tous les indicateurs et séries de données pour le tableau de bord Bilan.
    """
    kpis = get_kpis_exercice(db, exercice_id)
    total_depense = kpis["total_depense"]
    solde_initial = kpis["solde_initial"]

    budgetivore = get_activite_budgetivore(db, exercice_id, total_depense)
    stats_pays = get_stats_cotisations_par_pays(db, exercice_id)
    repartition_cats = get_repartition_categories(db, exercice_id, total_depense)
    activites_comp = get_comparaison_activites(db, exercice_id)
    evolution = get_evolution_mensuelle(db, exercice_id, solde_initial)

    return {
        **kpis,
        "activite_plus_budgetivore": budgetivore,
        "top_contributeurs": stats_pays[:5],  # Les 5 premiers
        "repartition_pays": stats_pays,       # L'ensemble pour le BarChart complet
        "repartition_categories": repartition_cats,
        "comparaison_activites": activites_comp,
        "evolution_mensuelle": evolution,
    }


def get_historique_comparatif(db: Session) -> List[Dict[str, Any]]:
    """
    Construit le comparatif pluriannuel pour tous les exercices enregistrés.
    """
    exercices = db.scalars(
        select(ExerciceAnnuel).where(
            ExerciceAnnuel.deleted_at.is_(None)
        ).order_by(ExerciceAnnuel.date_debut.asc())
    ).all()

    comparatif = []
    for ex in exercices:
        kpis = get_kpis_exercice(db, ex.id)
        nb_cotisants = db.scalar(
            select(func.count(func.distinct(Cotisation.etudiant_id))).where(
                Cotisation.exercice_id == ex.id,
                Cotisation.deleted_at.is_(None)
            )
        ) or 0

        comparatif.append({
            "exercice_id": ex.id,
            "libelle": ex.libelle,
            "statut": ex.statut.value,
            "date_debut": ex.date_debut.isoformat(),
            "date_fin": ex.date_fin.isoformat() if ex.date_fin else None,
            "solde_initial": kpis["solde_initial"],
            "total_cotise": kpis["total_cotise"],
            "total_depense": kpis["total_depense"],
            "solde_final": kpis["solde_disponible"],
            "nombre_etudiants_cotisants": nb_cotisants
        })

    return comparatif
