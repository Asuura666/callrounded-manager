# CallRounded Manager

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Status](https://img.shields.io/badge/status-Preprod-orange)

## 🎯 Objectif

**CallRounded Manager** est un portail client SaaS permettant aux salons de coiffure de gérer leur réceptionniste téléphonique IA. L'agent vocal, propulsé par [CallRounded](https://callrounded.com), répond automatiquement aux appels, prend les rendez-vous et fournit les informations du salon aux clients.

## 🏢 Contexte Business

- **Société** : W&I (Willyam BEGOT & Ilane)
- **Produit** : Réceptionniste téléphonique IA pour salons de coiffure
- **Cible** : Salons de coiffure (B2B) en France
- **Value Proposition** : Ne ratez plus jamais un appel. L'IA répond 24/7, prend les RDV et connaît votre salon.

## ✨ Fonctionnalités

### Pour les Salons (Utilisateurs)
- 📞 **Historique des appels** — Consultez tous les appels reçus avec transcriptions enrichies
- 📊 **Analytics** — Statistiques, heures de pointe, tendances, rapports hebdo
- 📚 **Base de connaissances** — Infos du salon (services, tarifs, horaires) parsées depuis l'agent
- 🔔 **Alertes** — 4 presets (appels manqués, durée, volume, erreurs) + règles custom
- 📅 **Google Calendar** — OAuth, sync événements, créneaux disponibles
- 📧 **Rapports hebdomadaires** — Config personnalisable (jour, heure, destinataires, contenu)

### Pour les Admins (W&I)
- 👥 **Gestion utilisateurs** — CRUD complet avec RBAC (SUPER_ADMIN, TENANT_ADMIN, USER)
- 🤖 **Agent Builder** — Chat LLM (Claude) pour configurer l'agent IA en langage naturel
- 📋 **Templates** — 6 presets sectoriels (coiffure, restaurant, médecin, immobilier, garage, e-commerce)
- 📱 **Numéros** — Extraction automatique depuis l'historique des appels

## 🛠️ Stack Technique

### Backend (4,418 lignes)

| Composant | Technologie |
|-----------|-------------|
| Framework | FastAPI (Python 3.11+) |
| Base de données | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 (async) |
| Auth | JWT (httpOnly cookies, bcrypt) |
| Validation | Pydantic v2 |
| API externe | CallRounded API v1 (httpx async) |
| LLM | Anthropic Claude |

### Frontend (5,223 lignes)

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
| Reverse Proxy | nginx |
| SSL | Let's Encrypt |
| Hébergement | OVH VPS (Debian) |

## 📁 Structure du Projet

```
callrounded-manager/
├── api/                        # Backend FastAPI
│   ├── app/
│   │   ├── main.py             # App + CORS + routing
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   ├── database.py         # AsyncSession SQLAlchemy
│   │   ├── models.py           # 14 tables (320 lignes)
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── auth.py             # JWT + get_current_user
│   │   ├── deps.py             # Dépendances FastAPI
│   │   ├── seed.py             # Seed admin
│   │   ├── routes/             # 13 routers, 55 routes
│   │   │   ├── auth.py         # Login, logout, refresh, me
│   │   │   ├── dashboard.py    # Stats résumées
│   │   │   ├── agents.py       # CRUD agents
│   │   │   ├── calls.py        # Appels + /rich + transcriptions
│   │   │   ├── admin.py        # Users CRUD + agent assignments
│   │   │   ├── llm.py          # Chat LLM + voices
│   │   │   ├── templates.py    # Templates CRUD + presets
│   │   │   ├── analytics.py    # Overview, trends, peak-hours
│   │   │   ├── alerts.py       # Rules + events + presets
│   │   │   ├── calendar.py     # Google Calendar OAuth
│   │   │   ├── reports.py      # Weekly report config
│   │   │   ├── phone_numbers.py
│   │   │   └── knowledge_bases.py
│   │   └── services/
│   │       ├── callrounded.py  # Client API CallRounded
│   │       └── llm_service.py  # Service Anthropic Claude
│   ├── alembic/                # Migrations DB
│   ├── tests/                  # Tests unitaires
│   ├── Dockerfile
│   ├── .env.example
│   └── requirements.txt
├── front/                      # Frontend React
│   ├── src/
│   │   ├── App.tsx             # Router (12 routes)
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx   # Sidebar + nav responsive
│   │   ├── pages/              # 13 pages
│   │   └── components/
│   │       ├── AgentTemplates.tsx
│   │       ├── CalendarWidget.tsx
│   │       ├── NotificationCenter.tsx
│   │       └── ui/             # shadcn/ui
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── DOCUMENTATION.md        # Doc technique complète
│   ├── DOCUMENTATION_OLD.md    # Ancienne version (archive)
│   ├── API_REFERENCE.md
│   ├── PLAN.md
│   ├── PROGRESS.md
│   └── architecture-saas.md
├── docker-compose.preprod.yml
└── README.md
```

## 🚀 Installation

### Prérequis
- Docker & Docker Compose
- Clé API CallRounded

### Démarrage rapide

```bash
# Cloner
git clone https://github.com/Asuura666/callrounded-manager.git
cd callrounded-manager

# Configurer
cp api/.env.example api/.env
# Éditer api/.env avec vos credentials

# Lancer
docker compose -f docker-compose.preprod.yml up -d

# Seed admin
docker compose -f docker-compose.preprod.yml exec api-preprod python -m app.seed
```

### Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | ✅ |
| `JWT_SECRET` | Secret JWT pour les tokens | ✅ |
| `CALLROUNDED_API_KEY` | Clé API CallRounded | ✅ |
| `CALLROUNDED_AGENT_ID` | ID de l'agent vocal | ✅ |
| `FRONTEND_URL` | URL du frontend (CORS) | ✅ |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (Agent Builder) | ⚡ |
| `GOOGLE_CLIENT_ID` | OAuth Google (Calendar) | ⚡ |
| `GOOGLE_CLIENT_SECRET` | OAuth Google (Calendar) | ⚡ |

✅ = requis | ⚡ = optionnel (feature-dependent)

## 📊 API

**55 endpoints** organisés en 13 domaines :

| Domaine | Prefix | Routes | Description |
|---------|--------|--------|-------------|
| Auth | `/api/auth` | 4 | Login, logout, refresh, profil |
| Dashboard | `/api/dashboard` | 1 | Stats résumées |
| Agents | `/api/agents` | 3 | Liste, détail, modification |
| Appels | `/api/calls` | 3 | Historique, enrichi, détail |
| Admin | `/api/admin` | 10 | Users CRUD + agent assignments |
| LLM | `/api/llm` | 2 | Chat agent builder + voices |
| Templates | `/api/templates` | 9 | CRUD + presets + catégories |
| Analytics | `/api/analytics` | 4 | Overview, trends, peak-hours, weekly |
| Alertes | `/api/alerts` | 10 | Rules CRUD + events + presets |
| Calendar | `/api/calendar` | 8 | OAuth, events, sync, slots |
| Reports | `/api/reports` | 3 | Config hebdo + envoi |
| Numéros | `/api/phone-numbers` | 1 | Extraction depuis appels |
| KB | `/api/knowledge-bases` | 1 | Parsing base_prompt agent |

Swagger : `/docs` | ReDoc : `/redoc`

## 🎨 Charte Graphique W&I

| Élément | Valeur |
|---------|--------|
| Bleu nuit | `#0E2A47` |
| Or | `#C9A24D` |
| Blanc | `#FFFFFF` |
| Noir | `#1A1A1A` |
| Typo titres | Playfair Display |
| Typo textes | Montserrat |

## 📝 Roadmap

- [x] Sprint 0-1 — Foundation + UX (5-6 fév)
- [x] Sprint 2 — Admin RBAC + Agent Builder LLM (12 fév)
- [x] Sprint 3 — Templates + Analytics (12-13 fév)
- [x] Sprint 4 — Alertes + Rapports (13 fév)
- [x] Sprint 5-6 — Notifications + Google Calendar (13 fév)
- [x] Sprint 7 — Bugfix (16 bugs), Reports API, Cleanup, Merge (23-26 fév)
- [ ] Sprint 8 — Tenant display_name, pagination, sécurité, CI/CD
- [ ] Phase prod — Tests données réelles, déploiement production
- [ ] Multi-tenant complet + facturation Stripe

## 🔗 URLs

| Environnement | URL |
|---------------|-----|
| Preprod | https://callrounded-preprod.apps.ilanewep.cloud |

## 👥 Équipe

- **Ilane** — Architecture, Direction technique
- **Willyam BEGOT** — Business, Commercial
- **Shiro 🦊** — IA Assistant, Dev full-stack
- **Kuro 🐺** — IA Assistant, Backend & Tests

## 📄 Licence

Propriétaire — © 2026 W&I. Tous droits réservés.

---

*Développé avec ❤️ par W&I*
