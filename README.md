# CallRounded Manager

Une application web élégante et moderne pour gérer les agents téléphoniques CallRounded, incluant la consultation des appels, la gestion des numéros de téléphone et des bases de connaissances.

## Architecture

Le projet est composé de deux parties principales :

### Frontend (React + TypeScript)
- **Framework** : React 19 avec Vite
- **Styling** : Tailwind CSS 4 avec design minimaliste et moderne
- **Routing** : Wouter pour la navigation
- **UI Components** : shadcn/ui pour les composants réutilisables
- **Port** : 3000 (développement) / 5173 (Vite)

### Backend (Python + FastAPI)
- **Framework** : FastAPI pour les APIs REST
- **Base de données** : PostgreSQL avec SQLAlchemy ORM
- **Intégration** : Service CallRounded pour l'API externe
- **Port** : 8000

## Fonctionnalités

### 1. Tableau de Bord
- Vue d'ensemble des agents actifs
- Statistiques des appels du jour
- Durée moyenne des appels
- Taux de réponse

### 2. Gestion des Agents
- Liste de tous les agents téléphoniques
- Activation/désactivation des agents
- Affichage du statut (actif, inactif, suspendu)
- Gestion des descriptions

### 3. Historique des Appels
- Liste complète des appels
- Filtres par agent et statut
- Détails complets de chaque appel
- Transcription des conversations
- Téléchargement des enregistrements

### 4. Numéros de Téléphone
- Gestion des numéros de téléphone
- Association aux agents
- Activation/désactivation des numéros
- Historique des modifications

### 5. Bases de Connaissances
- Gestion des bases de connaissances
- Ajout/suppression de sources
- Suivi du statut d'ingestion
- Affichage du nombre de sources

## Installation

### Prérequis
- Node.js 22+
- Python 3.11+
- PostgreSQL 12+
- npm ou pnpm

### Configuration du Backend

1. **Installer les dépendances Python**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

3. **Initialiser la base de données**
```bash
python -c "from database import init_db; init_db()"
```

4. **Démarrer le serveur FastAPI**
```bash
python main.py
# ou
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Configuration du Frontend

1. **Installer les dépendances**
```bash
cd client
pnpm install
```

2. **Démarrer le serveur de développement**
```bash
pnpm dev
```

L'application sera accessible à `http://localhost:5173`

## Variables d'Environnement

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/callrounded
CALLROUNDED_API_KEY=votre-clé-api
CALLROUNDED_API_URL=https://api.callrounded.com/v1
JWT_SECRET=votre-secret
SMTP_SERVER=smtp.gmail.com
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe
```

### Frontend
Les variables d'environnement du frontend sont gérées par Manus et injectées automatiquement.

## Structure du Projet

```
callrounded-manager/
├── backend/                    # Backend Python FastAPI
│   ├── config.py              # Configuration
│   ├── models.py              # Modèles SQLAlchemy
│   ├── schemas.py             # Schémas Pydantic
│   ├── database.py            # Configuration DB
│   ├── callrounded_service.py # Service API CallRounded
│   ├── main.py                # Application FastAPI
│   └── routes/                # Routes API
│       ├── agents.py
│       ├── calls.py
│       ├── phone_numbers.py
│       └── knowledge_bases.py
├── client/                     # Frontend React
│   ├── src/
│   │   ├── pages/             # Pages principales
│   │   │   ├── Home.tsx
│   │   │   ├── Agents.tsx
│   │   │   ├── Calls.tsx
│   │   │   ├── CallDetail.tsx
│   │   │   ├── PhoneNumbers.tsx
│   │   │   └── KnowledgeBases.tsx
│   │   ├── components/        # Composants réutilisables
│   │   ├── App.tsx            # Routeur principal
│   │   └── index.css          # Styles globaux
│   └── index.html
├── drizzle/                    # Migrations (ancien)
└── README.md
```

## API Endpoints

### Agents
- `GET /api/agents` - Lister les agents
- `GET /api/agents/{agent_id}` - Détails d'un agent
- `POST /api/agents` - Créer un agent
- `PATCH /api/agents/{agent_id}` - Mettre à jour un agent
- `DELETE /api/agents/{agent_id}` - Supprimer un agent

### Appels
- `GET /api/calls` - Lister les appels (avec filtres)
- `GET /api/calls/{call_id}` - Détails d'un appel
- `POST /api/calls` - Créer un appel
- `PATCH /api/calls/{call_id}` - Mettre à jour un appel

### Numéros de Téléphone
- `GET /api/phone-numbers` - Lister les numéros
- `GET /api/phone-numbers/{phone_number_id}` - Détails d'un numéro
- `POST /api/phone-numbers` - Créer un numéro
- `PATCH /api/phone-numbers/{phone_number_id}` - Mettre à jour un numéro

### Bases de Connaissances
- `GET /api/knowledge-bases` - Lister les bases
- `GET /api/knowledge-bases/{kb_id}` - Détails d'une base
- `POST /api/knowledge-bases` - Créer une base
- `PATCH /api/knowledge-bases/{kb_id}` - Mettre à jour une base
- `POST /api/knowledge-bases/{kb_id}/sources` - Ajouter des sources
- `DELETE /api/knowledge-bases/{kb_id}/sources` - Supprimer des sources

## Design

L'application utilise un design moderne et minimaliste avec :
- **Couleurs** : Bleu primaire (OKLCH 0.55 0.2 260) avec accents subtils
- **Typographie** : Hiérarchie claire avec Tailwind CSS
- **Espacements** : Système de grille cohérent
- **Animations** : Transitions fluides et feedback utilisateur
- **Responsive** : Adapté aux appareils mobiles, tablettes et desktop

## Prochaines Étapes

1. **Notifications par Email** : Implémenter le système d'alertes
2. **Webhooks CallRounded** : Intégrer les événements en temps réel
3. **Tests Automatisés** : Ajouter des tests unitaires et d'intégration
4. **Authentification OAuth** : Intégrer Manus OAuth
5. **Analytics** : Ajouter des statistiques avancées
6. **Export de Données** : Permettre l'export en CSV/PDF

## Support

Pour toute question ou problème, veuillez consulter la documentation de l'API CallRounded : https://docs.callrounded.com/api-reference

## Licence

MIT
