# Guide de Démarrage & Installation Mobile (PWA) — Trésorerie CEEAM

Ce guide pratique détaille pas-à-pas la procédure pour démarrer l'application (Backend + Frontend), générer les données de test aléatoires, et installer l'application sur un smartphone (Android ou iPhone) comme une application native sans passer par les stores.

---

## 1. Prérequis Système

Assurez-vous d'avoir installé sur votre machine :
- **Python 3.10+** (avec `pip` et `venv`)
- **Node.js 18+** et **npm** (v9 ou v10+)
- Les deux appareils (votre ordinateur et votre smartphone) doivent être connectés au **même réseau Wi-Fi** (ou partage de connexion mobile).

---

## 2. Étape 1 : Démarrage du Backend (FastAPI)

Le backend gère la base de données SQLite/PostgreSQL, le calcul des soldes et KPIs, l'authentification JWT et la génération du PDF officiel.

### 2.1 Ouvrir un terminal et se placer dans le dossier backend
```powershell
cd backend
```

### 2.2 Activer l'environnement virtuel Python
- **Sous Windows (PowerShell)** :
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
  *(Si vous n'avez pas encore créé le venv : `python -m venv venv` puis `pip install -r requirements.txt`)*

- **Sous Linux / macOS / Git Bash** :
  ```bash
  source venv/bin/activate
  ```

### 2.3 Remplir la base de données avec des données de test réalistes
Nous avons créé un script automatique de peuplement qui génère 40+ étudiants répartis sur les 17 pays membres, des cotisations réelles, et des activités avec catégories et factures :
```powershell
python -m app.db.seed_demo_data
```
> **Ce que ce script injecte :**
> - L'exercice actif **2026-2027** avec un report initial positif de **4 500 DH**.
> - **40+ étudiants** (Madagascar, Sénégal, Côte d'Ivoire, Cameroun, Guinée, Mali, etc.).
> - **30+ cotisations** payées réparties sur les mois de septembre à novembre.
> - **3 activités complètes** :
>   1. *Journée d'Intégration CEEAM* (budget respecté).
>   2. *Tournoi Sportif Inter-Communautés* (avec un **dépassement budgétaire volontaire de +350 DH** pour tester l'alerte visuelle rouge).
>   3. *Conférence & Forum Leadership* (sous le budget).
> - Un exercice passé **2025-2026 clôturé** pour tester l'onglet d'historique pluriannuel.

### 2.4 Lancer le serveur backend
Pour permettre à la fois à votre ordinateur **et** à votre smartphone d'accéder au backend, lancez-le en écoutant sur toutes les interfaces réseau (`0.0.0.0`) :
```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- L'API est accessible localement sur : `http://localhost:8000`
- La documentation interactive Swagger est sur : `http://localhost:8000/docs`

---

## 3. Étape 2 : Démarrage du Frontend (React + Vite)

Ouvrez un **deuxième terminal** pour le frontend.

### 3.1 Se placer dans le dossier frontend et installer les dépendances
```powershell
cd frontend
npm install
```

### 3.2 Lancer le serveur de développement Vite
```powershell
npm run dev
```

Grâce à la configuration `host: true` dans `vite.config.ts`, Vite affiche immédiatement :
```text
  VITE v8.3.8  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.45:5173/
```
- Sur votre ordinateur, ouvrez simplement : `http://localhost:5173`

---

## 4. Étape 3 : Accéder & Installer l'Application sur Téléphone (PWA)

L'application est conçue comme une **Progressive Web App (PWA)** responsive. Elle dispose d'un `manifest.json`, du logo officiel CEEAM, d'un thème adapté et d'une barre de navigation ergonomique en bas.

### 4.1 Trouver l'adresse IP locale de votre ordinateur
Si Vite n'affiche pas directement l'adresse réseau :
1. Dans un terminal PowerShell, tapez :
   ```powershell
   ipconfig
   ```
2. Repérez la ligne **Adresse IPv4** de votre carte Wi-Fi (ex: `192.168.1.45` ou `192.168.43.12`).

### 4.2 Ouvrir l'application sur votre smartphone
1. Connectez votre smartphone au **même réseau Wi-Fi** que votre PC (ou connectez votre PC au point d'accès 4G de votre téléphone).
2. Ouvrez le navigateur de votre smartphone (Chrome, Safari, Firefox).
3. Entrez l'URL réseau de votre PC suivie du port `5173` :
   ```text
   http://192.168.X.X:5173
   ```
   *(Remplacez 192.168.X.X par votre adresse IPv4)*.
4. L'application CEEAM s'affiche directement, adaptée au format mobile !

### 4.3 Installer l'icône sur l'écran d'accueil de votre téléphone

#### Sur Android (Google Chrome) :
1. Sur la page de l'application, touchez le menu des **trois petits points verticaux** (en haut à droite de Chrome).
2. Choisissez **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.
3. Cliquez sur **Installer**.
4. L'icône ronde officielle de la CEEAM apparaît instantanément sur votre bureau d'applications Android.
5. Lorsque vous la lancez, elle s'ouvre en **plein écran sans barre d'adresse navigateur**, exactement comme une application native téléchargée sur le Play Store !

#### Sur iPhone / iPad (Apple Safari) :
1. Ouvrez l'adresse dans **Safari**.
2. Touchez l'icône **Partager** (le carré avec une flèche pointant vers le haut en bas de l'écran).
3. Faites défiler les options et touchez **« Sur l'écran d'accueil »**.
4. Validez le nom ("CEEAM Trésorerie") et touchez **Ajouter**.
5. L'icône CEEAM est maintenant sur votre écran d'accueil iOS et s'ouvre en mode autonome dédié.

---

## 5. Identifiants du Trésorier Général (Mode Administrateur)

Par défaut, l'application est en **consultation publique** (lecture seule, transparence pour tous les étudiants et membres).

Pour tester les fonctionnalités d'encaissement, de création d'activité et de saisie de factures :
1. Cliquez sur le bouton **« Connexion Trésorier »** (en bas de la sidebar sur PC ou en haut à droite sur mobile).
2. Saisissez les identifiants :
   - **Email** : `tresorier@ceeam.org`
   - **Mot de passe** : `admin_ceeam_2026`
3. Une fois connecté, les boutons d'action d'encaissement et d'enregistrement de dépenses sont déverrouillés.

---

## 6. Tour d'Horizon des Fonctionnalités à Tester

1. **Sur la page Bilan** :
   - Observez les 4 cartes KPIs consolidées en temps réel.
   - Regardez le graphique horizontal des cotisations des **17 pays membres** classés par montant.
   - Cliquez sur le bouton **« Télécharger Rapport PDF »** pour générer et télécharger le rapport financier officiel officiel avec le logo et les tableaux de synthèse.
   - Cliquez sur les onglets d'analyse détaillée :
     - **Budget vs Réel** : Remarquez le dépassement budgétaire sur le Tournoi Sportif.
     - **Par Catégorie** : Visualisez le Donut Chart de répartition des charges.
     - **Évolution Cash-flow** : Suivez la courbe du solde mois par mois.
2. **Sur la page Cotisations** :
   - Faites défiler les badges des pays et filtrez les étudiants (ex: Côte d'Ivoire, Sénégal, Madagascar).
   - Utilisez la barre de recherche pour trouver un étudiant par son prénom ou nom.
   - En mode Trésorier, cliquez sur le bouton vert **`$`** pour ajouter une cotisation instantanée à un étudiant en attente.
3. **Sur la page Dépenses** :
   - Dépliez les activités pour visualiser les catégories et lignes de dépenses avec leurs références de facture.
   - En mode Trésorier, ajoutez une nouvelle activité ou une nouvelle ligne de dépense.
4. **Sur la page Historique** :
   - Comparez l'exercice actuel 2026-2027 avec l'exercice 2025-2026 sur le graphique à barres.
