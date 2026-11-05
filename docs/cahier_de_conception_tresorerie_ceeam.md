# Cahier de Conception Technique et Fonctionnel — Application de Trésorerie CEEAM

## 1. Contexte et Objectif du Projet

La **Communauté des Étudiants et Stagiaires Étrangers / Africains au Maroc (CEEAM)** souhaite digitaliser la gestion de sa trésorerie afin de remplacer les suivis manuels sujets aux oublis et aux erreurs de calcul.

L'application doit permettre :
1. **La gestion des cotisations (quotas)** structurée par pays membre et par étudiant.
2. **Le suivi granulaire des dépenses** regroupées par activité et par catégorie de dépense.
3. **Un tableau de bord (Bilan)** affichant en temps réel les indicateurs financiers, les statistiques visuelles (graphiques) et la génération de rapports exportables.
4. **L'archivage et l'historique pluriannuel** permettant de consulter les exercices passés et de visualiser l'évolution financière d'une année sur l'autre.
5. **Un fonctionnement Hybride (Offline-First & Online)** avec synchronisation automatique entre une base de données locale embarquée et un serveur central.

## 2. Rôles et Acteurs du Système

| Acteur | Mode d'accès | Droits et Permissions |
| :--- | :--- | :--- |
| **Visiteur (Membre / Étudiant)** | Accès public ou lecture seule | Consultation du bilan global, des graphiques, des cotisations par pays, du détail des dépenses par activité et de l'historique annuel. Aucune modification possible. |
| **Trésorier (Administrateur)** | Authentification sécurisée (Email/Identifiant + Mot de passe JWT) | Tous les droits du Visiteur + CRUD complet (Création, Lecture, Modification, Suppression) sur les exercices annuels, pays, étudiants, cotisations, activités, catégories et dépenses + Génération de rapports officiels + Clôture d'exercice annuel + Synchronisation des données. |

## 3. Spécifications Fonctionnelles Détaillées

### 3.1. Module 1 : Gestion des Cotisations (Quotas)
- **Référentiel des Pays** : Liste prédéfinie et extensible des pays membres de la communauté avec le nombre d'étudiants inscrits (calculé dynamiquement à partir des étudiants actifs rattachés au pays).
- **Référentiel des Étudiants** : Chaque étudiant est rattaché à un pays membre et possède un nom, un prénom, un niveau d'études (1er annee, 2èm année, ... 5èm annee) et un statut (actif/inactif).
- **Enregistrement des Cotisations** :
  - Saisie du montant versé par un étudiant pour une année académique (exercice) donnée, avec la date de versement et un commentaire optionnel (ex. paiement en 2 tranches).
  - Calcul automatique du **total cotisé par étudiant**, du **total cotisé par pays** et du **taux de participation par pays** (nombre d'étudiants ayant cotisé / effectif total du pays).

### 3.2. Module 2 : Gestion des Dépenses par Activité
- **Activités** : Chaque événement ou projet de la communauté (ex. *Sortie Ifrane*, *Journée Culturelle*, *Tournoi Sportif*) constitue une activité caractérisée par un titre, une date, une description, un budget prévisionnel (optionnel) et un exercice annuel.
- **Catégories de Dépenses** : Au sein d'une activité, les dépenses sont classées par catégorie Bus (location de bus : 200dh,) Nourriture (pain : 50dh, cafe :200dh, …).
- **Lignes de Dépenses** : Chaque dépense individuelle comporte un libellé (ex. *Location de bus*, *Pain*, *Café*), un montant unitaire/total en Dirhams (MAD), une date, et éventuellement une pièce justificative (photo du reçu/facture).
- **Agrégations automatiques** :
  - Sous-total automatique par catégorie au sein d'une activité.
  - Total général automatique par activité.
  - Alerte visuelle si le total d'une activité dépasse son budget prévisionnel.

### 3.3. Module 3 : Bilan et Tableau de Bord (Page d'Accueil)
- **Indicateurs Clés (KPIs) de l'année en cours** :
  - **Total Cotisé (Recettes)** en MAD.
  - **Total Dépensé (Charges)** en MAD.
  - **Solde Restant (Trésorerie disponible)** = Total Cotisé − Total Dépensé (plus report éventuel de l'année précédente).
  - **Activité la plus budgétivore** (nom de l'activité et part en % des dépenses totales).
  - **Top Contributeurs** (pays ayant le plus cotisé en valeur absolue et en taux de participation).
- **Visualisations Graphiques** :
  - *Camembert / Donut Chart* : Répartition des cotisations par pays membre.
  - *Diagramme en barres (Histogramme)* : Comparaison des dépenses par activité.
  - *Diagramme empilé ou circulaire* : Répartition des dépenses par catégorie globale (Transport, Restauration, etc.).
  - *Courbe mensuelle* : Évolution de la trésorerie (entrées vs sorties) au fil des mois de l'année en cours.
- **Génération de Rapport** :
  - Bouton **« Générer le Rapport Financier »** exportant un document PDF (et/ou Excel) propre, incluant le résumé du bilan, les tableaux détaillés par pays et par activité, ainsi que l'espace de signature du Trésorier et du Président.

### 3.4. Module 4 : Historique Pluriannuel
- **Gestion des Exercices (Années académiques)** : Chaque année (ex. `2024-2025`, `2025-2026`, `2026-2027`) possède un statut (`EN_COURS` ou `CLOTURE`).
- **Consultation des Archives** : Sélection d'une année passée pour consulter son bilan figé, ses activités et ses cotisations en lecture seule.
- **Graphiques d'Évolution Pluriannuelle** :
  - Évolution du total des cotisations et des dépenses d'une année à l'autre (histogramme groupé ou courbe).
  - Évolution du nombre d'étudiants cotisants par année.

## 4. Architecture Technique Recommandée pour Antigravity

### 4.1. Choix de la Stack Unifiée
Pour éviter de maintenir trois codes frontends différents (React + Flutter + Tkinter), deux architectures modernes sont préconisées :

| Composant | Option A : Web & PWA + Desktop (Recommandée pour rapidité) | Option B : Multiplateforme Natif |
| :--- | :--- | :--- |
| **Backend API Central** | **Python + FastAPI** (REST API + Pydantic + SQLAlchemy) | **Python + FastAPI** |
| **Base de données Centrale** | **PostgreSQL** (hébergée sur serveur / Supabase / Render) | **PostgreSQL** |
| **Base de données Locale (Offline)** | **IndexedDB (Dexie.js)** sur Web/PWA et **SQLite** sur Desktop/API locale | **SQLite (`drift` ou `sqflite`)** embarquée sur Mobile, PC et Web |
| **Frontend Unique (Web, PC, Mobile)** | **React (TypeScript + Vite + Tailwind CSS + Recharts)** configuré en **PWA** (installable hors-ligne sur PC et Mobile) ou emballé avec **Tauri / Electron** sur PC | **Flutter (Dart)** compilant un seul code vers Android, iOS, Windows, macOS, Linux et Web |

### 4.2. Stratégie de Synchronisation Offline-First
1. **Identifiants UUIDv4** : Toutes les clés primaires (`id`) sont générées sous forme d'UUID sur le client local pour éviter tout conflit d'auto-incrémentation lors de la création hors-ligne.
2. **Champs d'audit et de synchronisation** sur chaque table :
   - `created_at` (horodatage UTC de création)
   - `updated_at` (horodatage UTC de dernière modification)
   - `deleted_at` (horodatage pour suppression logique *soft delete*, indispensable pour propager les suppressions hors-ligne)
   - `sync_status` (`SYNCED`, `PENDING_PUSH`)
3. **Flux de synchronisation (`/api/v1/sync`)** :
   - **Push** : Lorsque l'appareil retrouve la connexion, il envoie au serveur central tous les enregistrements locaux ayant `sync_status = PENDING_PUSH`.
   - **Pull** : Le client demande au serveur tous les enregistrements dont `updated_at > last_sync_timestamp`.
   - **Résolution de conflits** : Stratégie *Last-Write-Wins (LWW)* basée sur `updated_at` et réservée aux administrateurs authentifiés.

## 5. Modélisation UML Corrigée

### 5.1. Diagramme de Cas d'Utilisation (Structure Logique)
- **Acteur `Visiteur`** :
  - `Consulter le bilan et les graphiques`
  - `Consulter les cotisations par pays et étudiant`
  - `Consulter les dépenses par activité et catégorie`
  - `Consulter l'historique pluriannuel`
- **Acteur `Trésorier (Admin)`** *(hérite de `Visiteur`)* :
  - `S'authentifier (Login JWT)`
  - `Gérer les pays et les étudiants (CRUD)` *(inclut `S'authentifier`)*
  - `Enregistrer / Modifier une cotisation` *(inclut `S'authentifier`)*
  - `Gérer les activités, catégories et dépenses (CRUD)` *(inclut `S'authentifier`)*
  - `Exporter le rapport financier (PDF / Excel)` *(inclut `S'authentifier`)*
  - `Clôturer l'exercice annuel` *(inclut `S'authentifier`)*
  - `Synchroniser la base locale avec le serveur central` *(inclut `S'authentifier`)*

### 5.2. Modèle Conceptuel de Données (Schéma des Classes / Tables SQL)

#### Table `users` (Utilisateurs / Administrateurs)
| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifiant unique |
| `nom` | VARCHAR(100) | NOT NULL | Nom de famille |
| `prenom` | VARCHAR(100) | NOT NULL | Prénom |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | Identifiant de connexion |
| `password_hash` | VARCHAR(255) | NOT NULL | Mot de passe haché (bcrypt/argon2) |
| `role` | ENUM | `ADMIN`, `VISITOR` | Rôle dans l'application |

#### Table `exercices_annuels` (Historique & Années Académiques)
| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifiant unique |
| `libelle` | VARCHAR(20) | UNIQUE, NOT NULL | Ex: `2026-2027` |
| `date_debut` | DATE | NOT NULL | Date d'ouverture de l'exercice |
| `date_fin` | DATE | NULL | Date de clôture |
| `statut` | ENUM | `EN_COURS`, `CLOTURE` | Permet de figer l'historique une fois l'année terminée |
| `solde_initial` | DECIMAL(12,2) | DEFAULT 0.00 | Report de trésorerie de l'année précédente |

#### Table `pays` (Pays Membres)
| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifiant unique |
| `nom` | VARCHAR(100) | UNIQUE, NOT NULL | Nom du pays membre |
| `code_iso` | VARCHAR(5) | NULL | Code ISO pour affichage du drapeau (ex: `SN`, `CI`, `ML`, `GA`) |

#### Table `etudiants` (Membres de la Communauté)
| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifiant unique |
| `pays_id` | UUID | FK -> `pays.id` | Pays d'origine de l'étudiant |
| `nom` | VARCHAR(100) | NOT NULL | Nom de l'étudiant |
| `prenom` | VARCHAR(100) | NOT NULL | Prénom de l'étudiant |
| `niveau` | VARCHAR(50) | NOT NULL | Niveau d'études |


#### Table `cotisations` (Versements des Quotas)
| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifiant unique |
| `etudiant_id` | UUID | FK -> `etudiants.id` | Étudiant ayant versé la cotisation |
| `exercice_id` | UUID | FK -> `exercices_annuels.id` | Année académique concernée |
| `montant` | DECIMAL(10,2) | NOT NULL (> 0) | Somme versée en MAD |
| `date_paiement` | DATE | NOT NULL | Date du versement |
| `updated_at` | TIMESTAMP | NOT NULL | Pour synchronisation Offline/Online |
| `deleted_at` | TIMESTAMP | NULL | Suppression logique (soft delete) |

#### Table `activites` (Événements et Projets)
| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifiant unique |
| `exercice_id` | UUID | FK -> `exercices_annuels.id` | Année académique de l'activité |
| `nom` | VARCHAR(150) | NOT NULL | Ex: `Sortie Ifrane` |
| `date_activite` | DATE | NOT NULL | Date de déroulement |
| `budget_prevu` | DECIMAL(12,2) | NULL | Budget prévisionnel optionnel |
| `updated_at` | TIMESTAMP | NOT NULL | Pour synchronisation Offline/Online |
| `deleted_at` | TIMESTAMP | NULL | Suppression logique |

#### Table `categories_depenses` (Catégories par Activité)
| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifiant unique |
| `activite_id` | UUID | FK -> `activites.id` | Activité parente |
| `nom` | VARCHAR(100) | NOT NULL | Ex: `Bus`, `Nourriture`, `Logistique` |
| `updated_at` | TIMESTAMP | NOT NULL | Pour synchronisation Offline/Online |
| `deleted_at` | TIMESTAMP | NULL | Suppression logique |

#### Table `depenses` (Lignes de Dépenses Individuelles)
| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifiant unique |
| `categorie_id` | UUID | FK -> `categories_depenses.id` | Catégorie parente |
| `nom` | VARCHAR(150) | NOT NULL | Ex: `Location de bus`, `Pain`, `Café` |
| `prix` | DECIMAL(10,2) | NOT NULL (> 0) | Montant de la dépense en MAD |
| `date_depense` | DATE | NOT NULL | Date de l'achat |
| `justificatif_url`| VARCHAR(255) | NULL | Chemin local ou URL du reçu photographié |
| `updated_at` | TIMESTAMP | NOT NULL | Pour synchronisation Offline/Online |
| `deleted_at` | TIMESTAMP | NULL | Suppression logique |

> **Note d'implémentation** : Les totaux (`Total par catégorie`, `Total par activité`, `Total par pays`, `Total cotisé`, `Total dépensé`, `Reste`) ne sont pas stockés en dur dans les tables de base afin d'éviter toute désynchronisation lors d'une modification. Ils sont calculés à la volée via des vues SQL (`VIEW`) ou des requêtes d'agrégation (`SUM`, `COUNT`).

## 6. Architecture des Endpoints API (FastAPI)

| Méthode | Endpoint | Accès | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authentification du Trésorier et retour du token JWT |
| `GET` | `/api/v1/bilan/{exercice_id}` | Visiteur / Admin | Récupère les KPIs globaux, le top contributeurs, l'activité budgétivore et les séries de données pour les graphiques |
| `GET` | `/api/v1/pays` | Visiteur / Admin | Liste des pays avec nombre d'étudiants et total cotisé pour l'exercice actif |
| `POST` | `/api/v1/etudiants` | Admin | Ajoute un étudiant rattaché à un pays |
| `POST` | `/api/v1/cotisations` | Admin | Enregistre un versement de cotisation pour un étudiant |
| `GET` | `/api/v1/activites` | Visiteur / Admin | Liste les activités avec leurs catégories, leurs dépenses et leurs sous-totaux |
| `POST` | `/api/v1/activites` | Admin | Crée une nouvelle activité (ex: Sortie Ifrane) |
| `POST` | `/api/v1/categories` | Admin | Ajoute une catégorie de dépense à une activité |
| `POST` | `/api/v1/depenses` | Admin | Ajoute une dépense unitaire dans une catégorie |
| `GET` | `/api/v1/historique` | Visiteur / Admin | Récupère le comparatif pluriannuel de tous les exercices |
| `GET` | `/api/v1/rapports/{exercice_id}/pdf` | Visiteur / Admin | Génère et télécharge le rapport financier annuel en PDF |
| `POST` | `/api/v1/sync` | Admin | Synchronisation bidirectionnelle (Push/Pull) entre SQLite/IndexedDB local et PostgreSQL central |

## 7. Plan d'Implémentation par Étapes pour Antigravity

1. **Étape 1 — Initialisation du Backend FastAPI & Schéma de Données** :
   - Configurer SQLAlchemy + Pydantic avec support SQLite (développement/local) et PostgreSQL (serveur).
   - Créer les modèles, les migrations Alembic et le script de *seed* initial (liste des pays membres de la CEEAM, compte Admin par défaut, exercice en cours).
2. **Étape 2 — Logique Métier & Agrégations du Bilan** :
   - Implémenter les routes CRUD sécurisées par JWT pour l'Admin et ouvertes en `GET` pour le Visiteur.
   - Développer le moteur de calcul du Bilan (totaux, activité la plus coûteuse, classement des pays) et l'export PDF du rapport financier.
3. **Étape 3 — Interface Utilisateur & Tableaux de Bord** :
   - Construire les 4 vues principales : **Bilan (Accueil)** avec graphiques interactifs, **Cotisations (par Pays/Étudiant)**, **Dépenses (Accordéon Activité > Catégorie > Dépenses)** et **Historique**.
   - Adapter l'affichage selon le rôle connecté (masquer les boutons d'ajout/modification pour le Visiteur).
4. **Étape 4 — Mode Offline & Synchronisation** :
   - Mettre en place le stockage local (SQLite ou IndexedDB) avec file d'attente des modifications hors-ligne (`sync_status`) et synchronisation automatique dès le retour de la connexion réseau.
