import random
import uuid
from datetime import date, datetime
from decimal import Decimal
import sqlite3

# Permettre l'adaptation des UUIDs par sqlite3
sqlite3.register_adapter(uuid.UUID, str)

from app.db.session import SessionLocal
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
from app.db.init_db import init_db

# Données réalistes d'étudiants par pays
ETUDIANTS_PAR_PAYS = {
    "Sénégal": [
        ("Ndiaye", "Aminata", "Master 2 Droit des Affaires"),
        ("Diop", "Cheikh", "Licence 3 Informatique"),
        ("Sow", "Moussa", "Doctorat Économie"),
        ("Fall", "Fatou", "Master 1 Génie Civil"),
    ],
    "Côte d'Ivoire": [
        ("Kouamé", "Jean-Eudes", "Master 2 Finance & Audit"),
        ("Konan", "Aïcha", "Licence 2 Biologie"),
        ("Bamba", "Souleymane", "Master 1 Réseaux & Télécoms"),
        ("Yao", "Affoué", "Licence 3 Gestion"),
    ],
    "Cameroun": [
        ("Kamga", "Brice", "Master 2 Génie Logiciel"),
        ("Mbarga", "Sandrine", "Licence 3 Droit"),
        ("Fotsing", "Alain", "Master 1 Électromécanique"),
        ("Ngono", "Chantal", "Doctorat Biochimie"),
    ],
    "Guinée": [
        ("Diallo", "Mamadou Alpha", "Master 2 MIAGE"),
        ("Barry", "Kadiatou", "Licence 3 Économie"),
        ("Camara", "Ibrahima", "Master 1 Sciences Politiques"),
    ],
    "Mali": [
        ("Traoré", "Sekou", "Licence 3 Mathématiques"),
        ("Coulibaly", "Mariam", "Master 2 Gestion de Projet"),
        ("Keïta", "Modibo", "Master 1 Ingénierie des Systèmes"),
    ],
    "Madagascar": [
        ("Ravalomanana", "Andry", "Master 2 Agronomie"),
        ("Razafindrakoto", "Fanja", "Licence 2 Médecine"),
        ("Rakoto", "Jean-Luc", "Master 1 Géologie"),
    ],
    "Burkina Faso": [
        ("Ouédraogo", "Wendkuni", "Master 2 Énergies Renouvelables"),
        ("Savadogo", "Rasmata", "Licence 3 Sociologie"),
        ("Zongo", "Hamado", "Master 1 Télécoms"),
    ],
    "Bénin": [
        ("Hounkanrin", "Gildas", "Master 2 Audit & Contrôle"),
        ("Dossou", "Clarisse", "Licence 3 Droit International"),
        ("Agbodjan", "Rodrigue", "Master 1 Statistique"),
    ],
    "Togo": [
        ("Ajavon", "Messan", "Master 2 Commerce International"),
        ("Lawson", "Akossiwa", "Licence 2 Pharmacie"),
    ],
    "Gabon": [
        ("Mba", "Yannick", "Master 1 Pétrochimie"),
        ("Ondo", "Prisca", "Licence 3 Communication"),
    ],
    "Congo (Brazzaville)": [
        ("Ngoma", "Christian", "Master 2 Logistique"),
        ("Mouanda", "Christelle", "Licence 3 Sciences Éco"),
    ],
    "RD Congo": [
        ("Mukendi", "Patrick", "Master 2 Intelligence Artificielle"),
        ("Kalonji", "Dorcas", "Licence 3 Psychologie"),
    ],
    "Tchad": [
        ("Mahamat", "Hassan", "Master 1 Administration Publique"),
        ("Abakar", "Zenaba", "Licence 2 Économie"),
    ],
    "Centrafrique": [
        ("Bozizé", "Rodrigue", "Licence 3 Histoire"),
    ],
    "Niger": [
        ("Issoufou", "Abdoulkarim", "Master 2 Hydraulique"),
        ("Salifou", "Hadiza", "Licence 3 Droit"),
    ],
    "Mauritanie": [
        ("Ould Ahmed", "Mohamed", "Master 1 Finance Islamique"),
    ],
    "Comores": [
        ("Said", "Nourou", "Master 2 Tourisme"),
        ("Bacari", "Nadjma", "Licence 3 Lettres Modernes"),
    ],
}


def seed_demo_data():
    db = SessionLocal()
    try:
        print("🌱 Initialisation des tables et données de base...")
        init_db(db)

        # 1. Vérifier / Mettre à jour l'exercice actif 2026-2027
        exercice = (
            db.query(ExerciceAnnuel)
            .filter(ExerciceAnnuel.statut == ExerciceStatut.EN_COURS)
            .first()
        )
        if not exercice:
            exercice = ExerciceAnnuel(
                libelle="2026-2027",
                date_debut=date(2026, 9, 1),
                statut=ExerciceStatut.EN_COURS,
                solde_initial=Decimal("4500.00"),  # Report positif de l'an dernier
            )
            db.add(exercice)
            db.commit()
            db.refresh(exercice)
        else:
            exercice.solde_initial = Decimal("4500.00")
            db.commit()

        print(f"✅ Exercice actif : {exercice.libelle} (Solde initial: {exercice.solde_initial} DH)")

        # 2. Récupérer tous les pays
        tous_les_pays = {p.nom: p for p in db.query(Pays).all()}

        # 3. Créer les étudiants
        etudiants_crees = []
        for pays_nom, liste_etudiants in ETUDIANTS_PAR_PAYS.items():
            pays = tous_les_pays.get(pays_nom)
            if not pays:
                continue

            for nom, prenom, niveau in liste_etudiants:
                # Vérifier si l'étudiant existe déjà
                existant = (
                    db.query(Etudiant)
                    .filter(
                        Etudiant.pays_id == pays.id,
                        Etudiant.nom == nom,
                        Etudiant.prenom == prenom,
                    )
                    .first()
                )
                if not existant:
                    etudiant = Etudiant(
                        pays_id=pays.id,
                        nom=nom,
                        prenom=prenom,
                        niveau=niveau,
                        actif=True,
                    )
                    db.add(etudiant)
                    db.flush()
                    etudiants_crees.append(etudiant)
                else:
                    etudiants_crees.append(existant)

        db.commit()
        print(f"✅ {len(etudiants_crees)} étudiants référencés dans la base de données.")

        # 4. Générer des cotisations (certains cotisent 100 DH, d'autres 200 DH, certains rien)
        cotisations_existantes = db.query(Cotisation).filter(Cotisation.exercice_id == exercice.id).count()
        if cotisations_existantes < 10:
            print("💰 Génération des cotisations étudiantes...")
            dates_paiement = [
                date(2026, 9, 12),
                date(2026, 9, 20),
                date(2026, 10, 5),
                date(2026, 10, 18),
                date(2026, 11, 2),
                date(2026, 11, 10),
            ]
            montants_possibles = [Decimal("100.00"), Decimal("100.00"), Decimal("100.00"), Decimal("150.00"), Decimal("200.00")]

            total_cotisations_creees = 0
            for idx, etudiant in enumerate(etudiants_crees):
                # 80% des étudiants cotisent
                if idx % 5 != 0:
                    d_paiement = dates_paiement[idx % len(dates_paiement)]
                    montant = montants_possibles[idx % len(montants_possibles)]
                    cotisation = Cotisation(
                        etudiant_id=etudiant.id,
                        exercice_id=exercice.id,
                        montant=montant,
                        date_paiement=d_paiement,
                        commentaire=f"Quota annuel 2026-2027 (Reçu #{1000 + idx})",
                    )
                    db.add(cotisation)
                    total_cotisations_creees += 1

            db.commit()
            print(f"✅ {total_cotisations_creees} cotisations enregistrées.")

        # 5. Créer les Activités, Catégories et Lignes de Dépenses
        activites_existantes = db.query(Activite).filter(Activite.exercice_id == exercice.id).count()
        if activites_existantes < 3:
            print("📋 Création des activités et lignes de dépenses de démonstration...")

            # --- Activité 1 : Journée d'Intégration CEEAM ---
            act1 = Activite(
                exercice_id=exercice.id,
                nom="Journée d'Intégration CEEAM",
                date_activite=date(2026, 10, 15),
                budget_prevu=Decimal("7500.00"),
                description="Accueil chaleureux et intégration culturelle des nouveaux arrivants.",
            )
            db.add(act1)
            db.flush()

            cat1_1 = CategorieDepense(activite_id=act1.id, nom="Restauration & Boissons")
            cat1_2 = CategorieDepense(activite_id=act1.id, nom="Logistique & Salle")
            cat1_3 = CategorieDepense(activite_id=act1.id, nom="Sonorisation & Animation")
            db.add_all([cat1_1, cat1_2, cat1_3])
            db.flush()

            dep1_1 = Depense(
                categorie_id=cat1_1.id,
                nom="Buffet et plats traditionnels africains",
                prix=Decimal("3400.00"),
                date_depense=date(2026, 10, 14),
                justificatif_url="FAC-TRAITEUR-2026-10",
            )
            dep1_2 = Depense(
                categorie_id=cat1_1.id,
                nom="Boissons fraîches et eau minérale",
                prix=Decimal("650.00"),
                date_depense=date(2026, 10, 15),
                justificatif_url="FAC-MARJANE-4412",
            )
            dep1_3 = Depense(
                categorie_id=cat1_2.id,
                nom="Location salle municipale & tables",
                prix=Decimal("1500.00"),
                date_depense=date(2026, 10, 10),
                justificatif_url="QUITTANCE-SALLE-09",
            )
            dep1_4 = Depense(
                categorie_id=cat1_2.id,
                nom="Banderole officielle et kakemonos CEEAM",
                prix=Decimal("450.00"),
                date_depense=date(2026, 10, 8),
                justificatif_url="FAC-IMPRIMERIE-33",
            )
            dep1_5 = Depense(
                categorie_id=cat1_3.id,
                nom="Location sono complète, micros et DJ",
                prix=Decimal("1100.00"),
                date_depense=date(2026, 10, 15),
                justificatif_url="CONTRAT-DJ-2026",
            )
            db.add_all([dep1_1, dep1_2, dep1_3, dep1_4, dep1_5])

            # --- Activité 2 : Tournoi Inter-Pays de Football (Avec DÉPASSEMENT volontaire pour tester l'alerte) ---
            act2 = Activite(
                exercice_id=exercice.id,
                nom="Tournoi Sportif Inter-Communautés",
                date_activite=date(2026, 11, 8),
                budget_prevu=Decimal("4000.00"),  # Budget prévu 4000 DH
                description="Tournoi fraternel de football réunissant les délégations nationales.",
            )
            db.add(act2)
            db.flush()

            cat2_1 = CategorieDepense(activite_id=act2.id, nom="Location Terrains")
            cat2_2 = CategorieDepense(activite_id=act2.id, nom="Trophées & Médailles")
            cat2_3 = CategorieDepense(activite_id=act2.id, nom="Arbitrage & Secourisme")
            cat2_4 = CategorieDepense(activite_id=act2.id, nom="Ravitaillement Sportif")
            db.add_all([cat2_1, cat2_2, cat2_3, cat2_4])
            db.flush()

            dep2_1 = Depense(
                categorie_id=cat2_1.id,
                nom="Location terrain synthétique 8h-18h",
                prix=Decimal("2000.00"),
                date_depense=date(2026, 11, 7),
                justificatif_url="REC-TERRAIN-SPORT",
            )
            dep2_2 = Depense(
                categorie_id=cat2_2.id,
                nom="Jeu de 3 coupes et 45 médailles gravées",
                prix=Decimal("1200.00"),
                date_depense=date(2026, 11, 5),
                justificatif_url="FAC-TROPHEES-MAROC",
            )
            dep2_3 = Depense(
                categorie_id=cat2_3.id,
                nom="Indemnités 2 arbitres officiels",
                prix=Decimal("600.00"),
                date_depense=date(2026, 11, 8),
                justificatif_url="REC-ARBITRAGE-01",
            )
            dep2_4 = Depense(
                categorie_id=cat2_4.id,
                nom="Cartons d'eau minérale, oranges, bananes",
                prix=Decimal("550.00"),
                date_depense=date(2026, 11, 8),
                justificatif_url="FAC-EPICERIE-88",
            )
            # Total dépensé = 2000 + 1200 + 600 + 550 = 4350 DH (> 4000 DH -> Dépassement de 350 DH !)
            db.add_all([dep2_1, dep2_2, dep2_3, dep2_4])

            # --- Activité 3 : Conférence & Forum Entrepreneuriat ---
            act3 = Activite(
                exercice_id=exercice.id,
                nom="Conférence & Forum Leadership",
                date_activite=date(2026, 11, 22),
                budget_prevu=Decimal("3500.00"),
                description="Panels et ateliers d'insertion pro avec des cadres et entrepreneurs de la diaspora.",
            )
            db.add(act3)
            db.flush()

            cat3_1 = CategorieDepense(activite_id=act3.id, nom="Supports & Badges")
            cat3_2 = CategorieDepense(activite_id=act3.id, nom="Pause-Café & Accueil")
            db.add_all([cat3_1, cat3_2])
            db.flush()

            dep3_1 = Depense(
                categorie_id=cat3_1.id,
                nom="Badges personnalisés et pochettes de conférence",
                prix=Decimal("580.00"),
                date_depense=date(2026, 11, 20),
                justificatif_url="FAC-BADGES-PRINT",
            )
            dep3_2 = Depense(
                categorie_id=cat3_2.id,
                nom="Service pause-café viennoiseries et jus",
                prix=Decimal("920.00"),
                date_depense=date(2026, 11, 22),
                justificatif_url="FAC-CAFE-PAUSE",
            )
            db.add_all([dep3_1, dep3_2])

            db.commit()
            print("✅ 3 Activités, 9 Catégories et 11 Lignes de dépenses insérées avec succès.")

        # 6. Ajouter un exercice passé clôturé (2025-2026) pour avoir un historique multi-exercices riche
        ex_passe = (
            db.query(ExerciceAnnuel)
            .filter(ExerciceAnnuel.libelle == "2025-2026")
            .first()
        )
        if not ex_passe:
            print("📜 Ajout de l'exercice passé 2025-2026 pour l'historique...")
            ex_passe = ExerciceAnnuel(
                libelle="2025-2026",
                date_debut=date(2025, 9, 1),
                date_fin=date(2026, 8, 31),
                statut=ExerciceStatut.CLOTURE,
                solde_initial=Decimal("1500.00"),
            )
            db.add(ex_passe)
            db.flush()

            # Ajouter une activité passée
            act_passee = Activite(
                exercice_id=ex_passe.id,
                nom="Gala Culturel Annuel 2025",
                date_activite=date(2026, 5, 20),
                budget_prevu=Decimal("8000.00"),
                description="Événement culturel annuel CEEAM 2025.",
            )
            db.add(act_passee)
            db.flush()

            cat_passee = CategorieDepense(activite_id=act_passee.id, nom="Organisation Générale")
            db.add(cat_passee)
            db.flush()

            dep_passee = Depense(
                categorie_id=cat_passee.id,
                nom="Frais logistiques et salle",
                prix=Decimal("5200.00"),
                date_depense=date(2026, 5, 20),
                justificatif_url="ARCHIVE-2025-01",
            )
            db.add(dep_passee)

            # Cotisations de l'exercice passé pour 15 étudiants
            for etudiant in etudiants_crees[:15]:
                cotis_passee = Cotisation(
                    etudiant_id=etudiant.id,
                    exercice_id=ex_passe.id,
                    montant=Decimal("100.00"),
                    date_paiement=date(2025, 10, 15),
                    commentaire="Cotisation 2025-2026",
                )
                db.add(cotis_passee)

            db.commit()
            print("✅ Exercice 2025-2026 clôturé inséré avec succès pour l'historique.")

        print("🎉 Génération des données de test terminée avec succès !")

    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
