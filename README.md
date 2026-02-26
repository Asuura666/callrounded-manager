# CallRounded Manager

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Status](https://img.shields.io/badge/status-Production%20Ready-green)

## 🎯 Objectif

**CallRounded Manager** est un portail client SaaS permettant aux salons de coiffure de gérer leur réceptionniste téléphonique IA. L'agent vocal, propulsé par [CallRounded](https://callrounded.com), répond automatiquement aux appels, prend les rendez-vous et fournit les informations du salon aux clients.

## 🏢 Contexte Business

- **Société** : W&I (Willyam BEGOT & Ilane)
- **Produit** : Réceptionniste téléphonique IA pour salons de coiffure
- **Cible** : Salons de coiffure (B2B) en France
- **Value Proposition** : Ne ratez plus jamais un appel. L'IA répond 24/7, prend les RDV et connaît votre salon.

## ✨ Fonctionnalités

### Pour les Salons (Utilisateurs)
- 📞 **Historique des appels** — Consultez tous les appels reçus avec transcriptions
- 📊 **Analytics** — Statistiques d'appels, heures de pointe, tendances
- 📚 **Base de connaissances** — Gérez les infos du salon (services, tarifs, horaires)
- 🔔 **Alertes** — Notifications en cas d'appels manqués ou problèmes
- 📅 **Intégration Google Calendar** — Sync des RDV avec l'agenda
- 📧 **Rapports hebdomadaires** — Résumé automatique par email

### Pour les Admins (W&I)
- 👥 **Gestion utilisateurs** — CRUD complet avec rôles
- 🤖 **Agent Builder** — Configurateur d'agent IA avec LLM
- 📱 **Gestion numéros** — Attribution des numéros de téléphone
- 📋 **Templates** — Modèles de configuration réutilisables

## 🛠️ Stack Technique

### Backend
| Composant | Technologie |
|-----------|-------------|
| Framework | FastAPI (Python 3.11+) |
| Base de données | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 (async) |
| Auth | JWT (python-jose) |
| Validation | Pydantic v2 |

### Frontend
| Composant | Technologie |
|-----------|-------------|
| Framework | React 18 + Vite |
| Routing | Wouter |
| UI | shadcn/ui + Tailwind CSS |
| State | TanStack Query |
| Charts | Recharts |

### Infrastructure
| Composant | Technologie |
|-----------|-------------|
| Conteneurisation | Docker + Docker Compose |
| Reverse Proxy | Traefik v3 |
| SSL | Let's Encrypt (auto) |
| Hébergement | OVH VPS |

## 📁 Structure du Projet

```
callrounded-manager/
├── api/                    # Backend FastAPI
│   ├── app/
│   │   ├── routes/         # Endpoints API
│   │   ├── services/       # Logique métier
│   │   ├── models.py       # Modèles SQLAlchemy
│   │   ├── schemas.py      # Schémas Pydantic
│   │   └── main.py         # Point d'entrée
│   └── tests/              # Tests unitaires
├── front/                  # Frontend React
│   ├── src/
│   │   ├── components/     # Composants UI
│   │   ├── pages/          # Pages de l'app
│   │   ├── hooks/          # Custom hooks
│   │   └── App.tsx         # Router principal
│   └── package.json
├── docs/                   # Documentation
├── docker-compose.yml      # Config Docker prod
└── .env                    # Variables d'environnement
```

## 🚀 Installation

### Prérequis
- Docker & Docker Compose
- Accès API CallRounded

### Configuration

1. **Cloner le repo**
```bash
git clone https://github.com/Asuura666/callrounded-manager.git
cd callrounded-manager
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos credentials
```

3. **Lancer les services**
```bash
docker compose up -d
```

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `CALLROUNDED_API_KEY` | Clé API CallRounded |
| `CALLROUNDED_AGENT_ID` | ID de l'agent vocal |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (Agent Builder) |
| `GOOGLE_CLIENT_ID` | OAuth Google (Calendar) |
| `GOOGLE_CLIENT_SECRET` | OAuth Google (Calendar) |

## 🔗 URLs

| Environnement | URL |
|---------------|-----|
| Preprod | https://callrounded-preprod.apps.ilanewep.cloud |
| Production | https://callrounded.apps.ilanewep.cloud |

## 📊 API Endpoints

Le backend expose **46+ endpoints** organisés par domaine :

- `/api/auth/*` — Authentification (login, logout, refresh)
- `/api/admin/*` — Gestion utilisateurs et agents
- `/api/calls/*` — Historique des appels
- `/api/agents/*` — Configuration des agents IA
- `/api/analytics/*` — Statistiques et tendances
- `/api/alerts/*` — Règles et événements d'alertes
- `/api/calendar/*` — Intégration Google Calendar
- `/api/templates/*` — Templates de configuration

Documentation Swagger disponible sur `/docs`.

## 🎨 Charte Graphique

| Élément | Valeur |
|---------|--------|
| Bleu nuit | `#0E2A47` |
| Or | `#C9A24D` |
| Blanc | `#FFFFFF` |
| Noir | `#1A1A1A` |
| Typo titres | Playfair Display |
| Typo textes | Montserrat |

## 📝 Roadmap

- [x] Phase 1 — Core (Auth, Users, Calls)
- [x] Phase 2 — Analytics & Templates
- [x] Phase 3 — Alerts & Reports
- [x] Phase 4 — Sprint 7: Bugfix (7 bugs), Reports API, Cleanup, Merge
- [x] Phase 4 — Google Calendar
- [ ] Phase 5 — Tests avec données réelles
- [ ] Phase 6 — Déploiement production

## 👥 Équipe

- **Ilane** — Développeur principal, Architecture
- **Willyam BEGOT** — Business, Commercial
- **Shiro 🦊** — IA Assistant, Frontend
- **Kuro 🐺** — IA Assistant, Backend & Tests

## 📄 Licence

Propriétaire — © 2026 W&I. Tous droits réservés.

---

*Développé avec ❤️ par W&I*
