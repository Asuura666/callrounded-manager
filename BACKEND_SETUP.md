# Configuration du Backend FastAPI

## Prérequis

- Python 3.11+
- PostgreSQL 12+
- pip ou poetry

## Installation

### 1. Créer un environnement virtuel Python

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` dans le dossier `backend/` :

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :

```
DATABASE_URL=postgresql://user:password@localhost:5432/callrounded
CALLROUNDED_API_KEY=votre-clé-api-callrounded
CALLROUNDED_API_URL=https://api.callrounded.com/v1
JWT_SECRET=votre-secret-jwt
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
APP_NAME=CallRounded Manager API
DEBUG=False
```

### 4. Initialiser la base de données

```bash
python -c "from database import init_db; init_db()"
```

### 5. Démarrer le serveur

```bash
python main.py
```

Le serveur sera disponible à `http://localhost:8000`

## Documentation de l'API

Une fois le serveur lancé, la documentation interactive est disponible à :
- Swagger UI : `http://localhost:8000/docs`
- ReDoc : `http://localhost:8000/redoc`

## Structure des Routes

### Agents (`/agents`)
- `GET /agents` - Lister tous les agents
- `GET /agents/{agent_id}` - Obtenir un agent spécifique
- `POST /agents` - Créer un nouvel agent
- `PATCH /agents/{agent_id}` - Mettre à jour un agent
- `DELETE /agents/{agent_id}` - Supprimer un agent

### Appels (`/calls`)
- `GET /calls` - Lister tous les appels (avec filtres optionnels)
- `GET /calls/{call_id}` - Obtenir un appel spécifique
- `POST /calls` - Créer un nouvel enregistrement d'appel
- `PATCH /calls/{call_id}` - Mettre à jour un appel

### Numéros de Téléphone (`/phone-numbers`)
- `GET /phone-numbers` - Lister tous les numéros
- `GET /phone-numbers/{phone_number_id}` - Obtenir un numéro spécifique
- `POST /phone-numbers` - Créer un nouveau numéro
- `PATCH /phone-numbers/{phone_number_id}` - Mettre à jour un numéro

### Bases de Connaissances (`/knowledge-bases`)
- `GET /knowledge-bases` - Lister toutes les bases
- `GET /knowledge-bases/{kb_id}` - Obtenir une base spécifique
- `POST /knowledge-bases` - Créer une nouvelle base
- `PATCH /knowledge-bases/{kb_id}` - Mettre à jour une base
- `POST /knowledge-bases/{kb_id}/sources` - Ajouter des sources
- `DELETE /knowledge-bases/{kb_id}/sources` - Supprimer des sources

## Intégration avec CallRounded API

Le service `callrounded_service.py` gère toutes les communications avec l'API CallRounded.

### Authentification

Toutes les requêtes utilisent la clé API définie dans `CALLROUNDED_API_KEY` via le header `X-Api-Key`.

### Gestion des Erreurs

Les erreurs de l'API CallRounded sont loggées et propagées au client avec des messages d'erreur appropriés.

## Déploiement

Pour déployer en production :

1. Définir `DEBUG=False` dans `.env`
2. Utiliser un serveur ASGI comme Gunicorn :
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```
3. Configurer un reverse proxy (Nginx, Apache)
4. Utiliser HTTPS/SSL

## Troubleshooting

### Erreur de connexion à la base de données
- Vérifier que PostgreSQL est en cours d'exécution
- Vérifier la chaîne de connexion `DATABASE_URL`
- Vérifier les permissions de l'utilisateur PostgreSQL

### Erreur d'API CallRounded
- Vérifier que la clé API est correcte
- Vérifier que l'URL de l'API est correcte
- Vérifier la connectivité réseau

### Port déjà utilisé
- Changer le port dans `main.py` ou utiliser `--port 8001`

## Support

Pour toute question, consultez :
- Documentation FastAPI : https://fastapi.tiangolo.com/
- Documentation CallRounded : https://docs.callrounded.com/
- Documentation SQLAlchemy : https://docs.sqlalchemy.org/
