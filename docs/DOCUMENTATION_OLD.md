# CallRounded Manager — Documentation Complète

> **Portail client SaaS pour gérer un réceptionniste téléphonique IA (CallRounded)**  
> Développé par Shiro 🦊 & Kuro 🐺 pour W&I (Willyam BEGOT & Ilane)  
> Branche : `Shiro/white_cart` | Repo : [Asuura666/callrounded-manager](https://github.com/Asuura666/callrounded-manager)

---

## Table des matières

1. [Contexte & Vision](#1-contexte--vision)
2. [Architecture technique](#2-architecture-technique)
3. [Stack technologique](#3-stack-technologique)
4. [Modèles de données](#4-modèles-de-données)
5. [API Backend — Routes détaillées](#5-api-backend--routes-détaillées)
6. [Frontend — Pages & Composants](#6-frontend--pages--composants)
7. [Authentification & RBAC](#7-authentification--rbac)
8. [Intégration API CallRounded](#8-intégration-api-callrounded)
9. [Déploiement](#9-déploiement)
10. [Historique des sprints](#10-historique-des-sprints)
11. [Bugs connus & fixes appliqués](#11-bugs-connus--fixes-appliqués)
12. [Limitations actuelles](#12-limitations-actuelles)
13. [Prochaines étapes](#13-prochaines-étapes)

---

## 1. Contexte & Vision

### Le produit
**CallRounded Manager** est un portail client SaaS permettant aux salons de coiffure (et autres commerces) de gérer leur **réceptionniste téléphonique IA** fourni par l'API [CallRounded](https://callrounded.com).

### Le problème
Les salons de coiffure perdent des clients à cause d'appels manqués. Un réceptionniste IA répond 24/7, prend les RDV, renseigne sur les tarifs et horaires. Mais il manquait un **portail client** pour :
- Voir l'historique des appels et les transcriptions
- Configurer l'agent IA (personnalité, voix, prompts)
- Gérer les alertes et rapports
- Intégrer l'agenda Google Calendar

### L'approche
D�veloppement en **6 sprints** sur ~3 jours (12-19 février 2026), avec collaboration Shiro (frontend) + Kuro (backend). Carte blanche donnée par Ilane pour innover sur la rétention client.

---

## 2. Architecture technique

```
┌─────────────────────────────────────────────────┐
│                   INTERNET                       │
│                                                  │
│  callrounded-preprod.apps.ilanewep.cloud         │
│         │                                        │
│         ▼                                        │
│  ┌──────────────┐                                │
│  │    nginx     │ (reverse proxy, SSL)           │
│  │  :443/:80    │                                │
│  └──────┬───────┘                                │
│         │                                        │
│    ┌────┴────┐                                   │
│    │         │                                   │
│    ▼         ▼                                   │
│ front:3101  api:8201                             │
│ (React SPA) (FastAPI)                            │
│              │                                   │
│         ┌────┴────┐                              │
│         │         │                              │
│         ▼         ▼                              │
│     PostgreSQL  CallRounded API                  │
│     (db:5432)   (api.callrounded.com)            │
└─────────────────────────────────────────────────┘
```

### Services Docker (docker-compose.preprod.yml)
| Service | Image | Port interne | Port exposé |
|---------|-------|-------------|-------------|
| `db-preprod` | postgres:16-alpine | 5432 | — |
| `api-preprod` | ./api (Dockerfile) | 8200 | 127.0.0.1:8201 |
| `front-preprod` | ./front (Dockerfile) | 80 | 127.0.0.1:3101 |

---

## 3. Stack technologique

### Backend
| Technologie | Usage |
|-------------|-------|
| **Python 3.11** | Langage |
| **FastAPI** | Framework API REST |
| **SQLAlchemy 2.0** | ORM async (mapped_column) |
| **PostgreSQL 16** | Base de données |
| **Pydantic v2** | Validation / Schemas |
| **pydantic-settings** | Configuration (.env) |
| **passlib[bcrypt]** | Hash des mots de passe |
| **python-jose** | JWT (access + refresh tokens) |
| **httpx** | Client HTTP async (vers CallRounded API) |
| **anthropic** | SDK Claude (Agent Builder LLM) |

### Frontend
| Technologie | Usage |
|-------------|-------|
| **React 18** | Framework UI |
| **TypeScript** | Typage |
| **Vite** | Build tool |
| **Tailwind CSS** | Styles utilitaires |
| **shadcn/ui** | Composants UI (Button, Card, Dialog, Table, etc.) |
| **Lucide React** | Icônes |
| **Recharts** | Graphiques (analytics) |

### Charte graphique W&I
| Élément | Valeur |
|---------|--------|
| Bleu nuit | `#0E2A47` |
| Or | `#C9A24D` |
| Blanc | `#FFFFFF` |
| Noir | `#1A1A1A` |
| Titres | Playfair Display |
| Textes | Montserrat |

---

## 4. Modèles de données

### Schéma relationnel

```
tenants
  ├── users (1:N)
  │     └── user_agent_assignments (1:N)
  ├── agents_cache (1:N)
  ├── calls_cache (1:N)
  ├── phone_numbers_cache (1:N)
  ├── knowledge_bases_cache (1:N)
  ├── agent_templates (1:N)
  ├── weekly_reports (1:N)
  ├── alert_rules (1:N)
  │     └── alert_events (1:N)
  └── calendar_integrations (1:1)
```

### Tables détaillées

#### `tenants` — Multi-tenant
- `id` (UUID), `name` (unique), `plan` (free/pro/enterprise), `created_at`

#### `users` — Utilisateurs avec rôles
- `id`, `tenant_id` (FK), `email` (unique par tenant), `password_hash` (bcrypt), `role`, `is_active`
- **Rôles** : `SUPER_ADMIN`, `TENANT_ADMIN`, `USER`
- Méthodes : `is_admin()`, `can_access_agent(agent_id)`

#### `user_agent_assignments` — Accès agent par utilisateur
- Permet de restreindre la visibilité des agents pour les `USER` (les admins voient tout)

#### `agents_cache` — Cache local des agents CallRounded
- Synchro depuis l'API CallRounded, `external_id` = ID CallRounded

#### `calls_cache` — Cache des appels
- `external_call_id`, `caller_number`, `duration`, `status`, `transcription`, `recording_url`, `started_at`, `ended_at`

#### `agent_templates` — Templates de configuration
- 6 presets intégrés (coiffure, restaurant, médecin, immobilier, garage, e-commerce)
- Champs : `greeting`, `system_prompt`, `voice`, `language`, `category`, `icon`

#### `alert_rules` + `alert_events` — Système d'alertes
- Rules : `rule_type`, `conditions` (JSON), canaux (email, webhook)
- Events : `severity`, `title`, `message`, acknowledged tracking

#### `weekly_reports` — Rapports hebdo
- Stats : `total_calls`, `completed_calls`, `missed_calls`, `avg_duration`, `total_cost`
- Variation semaine précédente (`calls_change_pct`, etc.)

#### `calendar_integrations` — Google Calendar
- OAuth tokens (access/refresh), `calendar_id`, `last_sync`, `events_synced`

---

## 5. API Backend — Routes détaillées

### Métriques
- **46 routes API** au total
- **4,071 lignes** de code backend (routes + services + auth + models)
- **12 fichiers de routes**

### Auth (`/api/auth/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/login` | Login → access_token + refresh_token (JWT) |
| POST | `/auth/refresh` | Rafraîchir le token |
| GET | `/auth/me` | Profil utilisateur courant |

### Dashboard (`/api/dashboard/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/dashboard/stats` | Stats résumées (agents, appels, durée) |

### Agents (`/api/agents/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/agents/` | Liste des agents (depuis API CallRounded) |
| GET | `/agents/{id}` | Détail d'un agent |

### Appels (`/api/calls/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/calls/` | Liste des appels (paginée, filtres) |
| GET | `/calls/rich` | Appels enrichis (transcriptions transformées) |
| GET | `/calls/{id}` | Détail d'un appel avec transcription |

> **Note** : Le endpoint `/calls/rich` a été créé le 19 fév pour résoudre le problème de format des transcriptions. L'API CallRounded retourne `{role, content}` mais le frontend attendait `{speaker, text, timestamp}`. La fonction `transform_transcript()` fait la conversion.

### Admin (`/api/admin/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/admin/users` | Liste users du tenant |
| POST | `/admin/users` | Créer un user |
| PATCH | `/admin/users/{id}` | Modifier un user (rôle, actif) |
| DELETE | `/admin/users/{id}` | Supprimer un user |
| GET | `/admin/users/{id}/agents` | Agents assignés à un user |
| POST | `/admin/users/{id}/agents` | Assigner un agent à un user |
| DELETE | `/admin/users/{id}/agents/{agent_id}` | Retirer un agent |

### LLM Agent Builder (`/api/llm/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/llm/chat` | Chat avec Claude pour configurer l'agent |
| POST | `/llm/generate-prompt` | Générer un system prompt optimisé |
| POST | `/llm/improve-greeting` | Améliorer le message d'accueil |

> **Pourquoi** : Permettre aux gérants de salon (non-techniques) de configurer leur agent IA via une conversation naturelle plutôt que d'écrire des prompts.

### Templates (`/api/templates/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/templates/` | Liste templates (presets + custom) |
| GET | `/templates/presets` | 6 templates préinstallés |
| POST | `/templates/` | Créer un template custom |
| GET | `/templates/{id}` | Détail template |
| PUT | `/templates/{id}` | Modifier template |
| DELETE | `/templates/{id}` | Supprimer template |
| POST | `/templates/{id}/apply` | Appliquer un template à un agent |

### Analytics (`/api/analytics/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/analytics/overview` | Vue d'ensemble (appels, durée, taux) |
| GET | `/analytics/calls/daily` | Appels par jour (graphique) |
| GET | `/analytics/calls/hourly` | Heatmap horaire |
| GET | `/analytics/performance` | Performance agents |
| GET | `/analytics/trends` | Tendances semaine/mois |

### Alertes (`/api/alerts/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/alerts/rules` | Liste des règles |
| POST | `/alerts/rules` | Créer une règle |
| GET | `/alerts/rules/{id}` | Détail règle |
| PUT | `/alerts/rules/{id}` | Modifier règle |
| DELETE | `/alerts/rules/{id}` | Supprimer règle |
| POST | `/alerts/rules/{id}/toggle` | Activer/désactiver |
| GET | `/alerts/events` | Historique des alertes |
| POST | `/alerts/events/{id}/acknowledge` | Acquitter une alerte |
| GET | `/alerts/presets` | 4 presets (missed calls, duration, volume, errors) |

### Rapports (`/api/reports/` via alerts)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/alerts/reports/weekly` | Dernier rapport hebdo |
| POST | `/alerts/reports/generate` | Générer un rapport |

### Google Calendar (`/api/calendar/`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/calendar/status` | État de la connexion |
| POST | `/calendar/connect` | Lancer OAuth Google |
| POST | `/calendar/callback` | Callback OAuth |
| DELETE | `/calendar/disconnect` | Déconnecter |
| GET | `/calendar/events` | Liste des événements |
| POST | `/calendar/events` | Créer un événement |
| DELETE | `/calendar/events/{id}` | Supprimer événement |
| GET | `/calendar/available-slots` | Créneaux disponibles |
| POST | `/calendar/sync` | Forcer la synchro |

---

## 6. Frontend — Pages & Composants

### Métriques
- **14 pages** + **3 composants** + **1 layout**
- **5,401 lignes** de code frontend (pages + composants + layout + App)
- **9 composants shadcn/ui** (button, card, dialog, table, input, label, badge, skeleton, switch, etc.)

### Pages

| Page | Fichier | Lignes | Description |
|------|---------|--------|-------------|
| Login | `LoginPage.tsx` | 123 | Auth avec animations, background W&I |
| Dashboard | `DashboardPage.tsx` | 349 | Stats, graphiques, activité récente |
| Agents | `AgentsPage.tsx` | 138 | Liste des agents IA |
| Agent Builder | `AgentBuilderPage.tsx` | 337 | Chat LLM pour configurer l'agent |
| Appels (simple) | `CallsPage.tsx` | 210 | Historique basique |
| Appels (enrichi) | `CallHistoryRich.tsx` | 518 | Historique avec filtres, export, transcriptions |
| Détail appel | `CallDetailPage.tsx` | 259 | Transcription complète, infos appel |
| Analytics | `AnalyticsDashboard.tsx` | 410 | Graphiques, heatmap, tendances |
| Alertes | `AlertsConfig.tsx` | 439 | CRUD règles, historique événements |
| Rapports | `ReportSettings.tsx` | 455 | Config rapports hebdo, preview |
| Calendrier | `CalendarIntegration.tsx` | 393 | OAuth Google, événements, slots |
| Admin Users | `AdminUsersPage.tsx` | 384 | CRUD utilisateurs, rôles, assignments |
| Numéros | `PhoneNumbersPage.tsx` | 61 | Liste numéros (limité par API) |
| Knowledge Bases | `KnowledgeBasesPage.tsx` | 66 | Bases de connaissances (limité par API) |

### Composants réutilisables

| Composant | Lignes | Description |
|-----------|--------|-------------|
| `AgentTemplates.tsx` | 363 | Sélecteur de templates avec preview |
| `CalendarWidget.tsx` | 299 | Widget calendrier pour le dashboard |
| `NotificationCenter.tsx` | 313 | Centre de notifications (WebSocket ready) |

### UX & Animations
- **Animations CSS** : fade-in, slide-up, scale-in, float, shimmer, pulse-gold
- **Composants loading** : Skeleton, LoadingSpinner, CircularProgress
- **Login** : background animé avec éléments flottants aux couleurs W&I
- **Responsive** : adapté mobile/tablette
- **Charte W&I** : bleu nuit, or, typographies Playfair Display + Montserrat

---

## 7. Authentification & RBAC

### Flow d'authentification
```
1. POST /auth/login (email + password)
2. Backend vérifie bcrypt hash
3. Retourne access_token (15min) + refresh_token (7j)
4. Frontend stocke les tokens
5. Chaque requête envoie Authorization: Bearer <access_token>
6. Si expiré → POST /auth/refresh avec le refresh_token
```

### Rôles
| Rôle | Permissions |
|------|------------|
| `SUPER_ADMIN` | Tout (multi-tenant, futur) |
| `TENANT_ADMIN` | Admin d'un tenant : CRUD users, voir tous les agents, config alertes/rapports |
| `USER` | Voir uniquement les agents assignés, pas d'accès admin |

### ⚠️ Point critique : bcrypt only
Le backend utilise `passlib` avec `CryptContext(schemes=["bcrypt"])`. Les hashes argon2id causent une `UnknownHashError`. C'est un bug historique corrigé le 16 février (ghost user avec mauvais hash).

---

## 8. Intégration API CallRounded

### Service (`api/app/services/callrounded.py`)
Client HTTP async (`httpx`) qui proxy les appels vers `https://api.callrounded.com/v1`.

### Endpoints fonctionnels ✅
| Endpoint API | Usage | Status |
|-------------|-------|--------|
| `GET /calls` | Historique des appels | ✅ Fonctionne (21 appels visibles) |
| `GET /agents/{id}` | Détail agent | ✅ Fonctionne |

### Endpoints non-fonctionnels ⚠️
| Endpoint API | Problème | Status |
|-------------|----------|--------|
| `GET /phone-numbers` | Retourne "Welcome" (vide) | ❌ Permissions API ? |
| `GET /knowledge-bases` | 404 Not Found | ❌ Endpoint inexistant ? |

> **À investiguer** : Contacter le support CallRounded pour vérifier les permissions de la clé API.

### Transformation des transcriptions
L'API CallRounded retourne les transcriptions au format :
```json
[{"role": "assistant", "content": "Bonjour..."}, {"role": "user", "content": "Je voudrais..."}]
```

Le frontend attend :
```json
[{"speaker": "AI", "text": "Bonjour...", "timestamp": "00:00"}, {"speaker": "Client", "text": "Je voudrais...", "timestamp": "00:15"}]
```

La fonction `transform_transcript()` (dans `calls.py`) fait cette conversion côté backend.

---

## 9. Déploiement

### Preprod
- **URL** : https://callrounded-preprod.apps.ilanewep.cloud
- **Admin** : `admin@wi-agency.fr` / `Admin2026!` (rôle: `TENANT_ADMIN`)
- **SSL** : Let's Encrypt (expire 2026-05-14)
- **VPS** : `/home/debian/callrounded-manager/`

### Commandes utiles
```bash
# Démarrer
cd /home/debian/callrounded-manager
docker compose -f docker-compose.preprod.yml up -d

# Voir les logs
docker compose -f docker-compose.preprod.yml logs -f api-preprod

# Redémarrer l'API
docker compose -f docker-compose.preprod.yml restart api-preprod

# Seed admin
docker compose -f docker-compose.preprod.yml exec api-preprod python -m app.seed
```

### Variables d'environnement (`.env`)
```env
POSTGRES_PASSWORD=...
JWT_SECRET=...
CALLROUNDED_API_URL=https://api.callrounded.com/v1
CALLROUNDED_API_KEY=...
CALLROUNDED_AGENT_ID=a77a1d9c-05ed-4c2f-b00f-3194df10793f
ANTHROPIC_API_KEY=...
FRONTEND_URL=https://callrounded-preprod.apps.ilanewep.cloud
```

### Config nginx
```
/etc/nginx/sites-available/callrounded-preprod.conf
```
Reverse proxy : `/api` → `localhost:8201`, `/` → `localhost:3101`

---

## 10. Historique des sprints

### Sprint 0 — POC & Foundation (5-6 fév)
- Bootstrap projet (FastAPI + React + PostgreSQL)
- Adaptation au contexte salon de coiffure
- Intégration API CallRounded (agents, calls)
- Restyling charte graphique W&I
- **Commit** : `d0b7635` → `e05fbb3`

### Sprint 1 — UX & Animations (6 fév)
- Animations CSS (fade-in, slide-up, shimmer, pulse-gold)
- Skeleton loaders, LoadingSpinner, CircularProgress
- Login page avec background animé
- **Commit** : `e05fbb3`

### Sprint 2 — Admin & Agent Builder (12 fév)
- Système admin multi-utilisateurs avec RBAC
- LLM Agent Builder (chat avec Claude)
- Tests unitaires admin
- **Commits** : `ae78fc4` → `ea82ea6`

### Sprint 3 — Templates & Analytics (12-13 fév)
- 6 templates d'agents par secteur
- Dashboard analytics (graphiques Recharts, heatmap)
- **Commit** : `98e6ba3`

### Sprint 4 — Alertes & Rapports (13 fév)
- Système d'alertes (rules, events, 4 presets)
- Rapports hebdomadaires (config, preview, génération)
- **Commits** : `c18a318` → `535b100`

### Sprint 5 — Notifications & Calendar (13 fév)
- Centre de notifications (WebSocket ready)
- Google Calendar OAuth + événements + créneaux
- **Commits** : `a47e326` → `e8e8a4e`

### Sprint 6 — Calendar UI & Polish (13 fév)
- Interface calendrier complète
- CalendarWidget pour le dashboard
- **Commits** : `90b405e` → `6866286`

### Sprint 7 — Bugfix + Reports + Cleanup (23-26 fév)
- **7 bugs corrigés** : analytics endpoint, agent_name cache, dashboard total_agents, date filters, dead MOCK_CALLS, console.log, phone numbers page
- **KB page dynamique** : parsing du base_prompt de l agent pour extraire adresse, équipe, personnalité
- **Reports API** : modèle WeeklyReportConfig + 3 endpoints (GET/PATCH/POST /reports/weekly/config)
- **Nettoyage** : suppression 16 console.log, dead code CallsPage.tsx, mock fallbacks Calendar/Alerts
- **Seed mis à jour** : admin@wi-agency.fr / Admin2026!, tenant "W&I Agency"
- **Merge** : Shiro/white_cart → main (fast-forward)
- **Ajout** : api/.env.example
- **Commits** : d0470d2 → edcffce

### Hotfixes post-livraison

#### 16 fév — Login fix
- **Problème** : `UnknownHashError` à la connexion
- **Cause** : Ghost user `admin@callrounded.local` avec hash argon2id, incompatible avec le backend bcrypt
- **Fix** : Suppression du ghost user via SQL

#### 19 fév — Session intensive
- Nouvelle clé API CallRounded configurée
- Fix `CALLROUNDED_AGENT_ID` manquant dans docker-compose.preprod
- Endpoint `/calls/rich` pour transcriptions transformées
- Fix RBAC : `is_admin()` vérifie `SUPER_ADMIN` ou `TENANT_ADMIN` (pas `ADMIN`)
- Fix routes admin frontend (check élargi dans `AppLayout.tsx` et `App.tsx`)
- **Résultat** : 21 appels réels visibles, agent visible dans l'interface ✅

---

## 11. Bugs connus & fixes appliqués

| Bug | Cause | Fix | Date |
|-----|-------|-----|------|
| Login `UnknownHashError` | Ghost user avec hash argon2id | Supprimé ghost user, confirmé bcrypt only | 16 fév |
| Page agents vide | `CALLROUNDED_AGENT_ID` manquant | Ajouté dans docker-compose.preprod.yml | 19 fév |
| Historique appels vide | Pas d'endpoint enrichi | Créé `/calls/rich` + `transform_transcript()` | 19 fév |
| Routes admin 403 | `is_admin()` ne reconnaissait pas `TENANT_ADMIN` | Fix check : `SUPER_ADMIN` ou `TENANT_ADMIN` | 19 fév |
| Frontend admin non visible | AppLayout check trop strict | Élargi check dans AppLayout.tsx et App.tsx | 19 fév |
| TypeScript errors AdminUsersPage | Types manquants | Fix types + imports | 12 fév |
| Analytics page 500 | Frontend appelait /analytics/calls au lieu de /analytics/overview | Aligné endpoint + field names | 23 fév |
| agent_name hardcodé | Nom agent statique dans les calls | Ajouté get_agent_name() avec cache 5min | 23 fév |
| Dashboard total_agents=0 | Utilisait AgentCache vide | Appel cr.list_agents() direct | 23 fév |
| Dashboard sans filtres date | fetchCalls() ignorait les dates | Ajouté from_date/to_date params | 23 fév |
| Dead code MOCK_CALLS | 120 lignes mock dans CallHistoryRich | Supprimé | 23 fév |
| console.log restants | 19 console.log dans 9 fichiers | Supprimé (gardé console.error) | 23-26 fév |
| Phone numbers vide | API /phone-numbers ne marche pas | Extraction depuis to_number des calls | 23 fév |
| Reports endpoints manquants | Frontend appelait 3 routes inexistantes | Créé reports.py + modèle DB | 26 fév |
| Mock fallbacks Calendar | Fausses données affichées si API fail | Fallback vers états vides | 26 fév |
| Mock fallbacks Alerts | MOCK_RULES inutilisé | Supprimé la constante | 26 fév |
| CallsPage.tsx dead code | Importé mais jamais routé | Supprimé fichier + import | 26 fév |

---

## 12. Limitations actuelles

### API CallRounded
- `/phone-numbers` retourne "Welcome" (pas de données)
- `/knowledge-bases` retourne 404
- Seuls `/calls` et `/agents/{id}` fonctionnent avec la clé actuelle
- → Contacter support CallRounded pour permissions

### Features partielles
- **Google Calendar** : OAuth flow implémenté mais pas testé en production (nécessite Google Cloud Console credentials)
- **Notifications WebSocket** : Frontend prêt, backend WebSocket non implémenté (notifications via polling)
- **SMS/WhatsApp** : Exclu volontairement (nécessiterait Twilio)
- **Agent Builder LLM** : Fonctionnel si `ANTHROPIC_API_KEY` configurée

### Sécurité
- JWT secret en `.env` (pas de vault)
- Pas de rate limiting API
- CORS restreint au `FRONTEND_URL` uniquement

---

## 13. Prochaines étapes

### Court terme (Sprint 8 — prévu mercredi)
0. **Tenant display_name** — champ configurable pour le nom du salon
0. **Pagination /calls/rich** — backend page param + frontend boutons prev/next
0. **Vérification sécurité preprod** — JWT_SECRET, API keys
0. **Pipeline CI/CD** — GitHub Actions pour déploiement auto
1. **Vérifier permissions API CallRounded** — phone-numbers et knowledge-bases
2. **Tester Google Calendar OAuth** en preprod avec vrais credentials Google
3. **WebSocket backend** — pour notifications temps réel

### Moyen terme
4. **Multi-tenant complet** — plusieurs salons par instance
5. **Facturation** — Stripe integration pour les plans (free/pro/enterprise)
6. **Dashboard public** — page status pour les clients des salons

### Long terme
7. **App mobile** — React Native pour les gérants
8. **Analytics IA** — résumés automatiques des tendances d'appels
9. **Intégrations** — Booking platforms (Planity, Treatwell)

---

## Annexe — Structure du projet

```
callrounded-manager/
├── api/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + CORS + routing
│   │   ├── config.py            # Settings (pydantic-settings, .env)
│   │   ├── database.py          # AsyncSession SQLAlchemy
│   │   ├── models.py            # 12 tables (~320 lignes)
│   │   ├── schemas.py           # Pydantic schemas (88 lignes)
│   │   ├── auth.py              # JWT decode + get_current_user
│   │   ├── deps.py              # Dépendances FastAPI
│   │   ├── seed.py              # Seed admin user
│   │   ├── routes/
│   │   │   ├── __init__.py      # Router aggregation (13 routers)
│   │   │   ├── auth.py          # Login, refresh, me
│   │   │   ├── dashboard.py     # Stats
│   │   │   ├── agents.py        # CRUD agents
│   │   │   ├── calls.py         # Calls + rich + transcripts
│   │   │   ├── admin.py         # User management (466 lignes)
│   │   │   ├── llm.py           # Agent Builder chat (369 lignes)
│   │   │   ├── templates.py     # Template CRUD (432 lignes)
│   │   │   ├── analytics.py     # Graphiques et stats (413 lignes)
│   │   │   ├── alerts.py        # Rules + events (512 lignes)
│   │   │   ├── calendar.py      # Google Calendar (561 lignes)
│   │   │   ├── phone_numbers.py # Extraction depuis calls
│   │   │   ├── reports.py       # Weekly report config (Sprint 7)
│   │   │   └── knowledge_bases.py # (limité)
│   │   └── services/
│   │       ├── callrounded.py   # Client API CallRounded
│   │       └── llm_service.py   # Service Claude/Anthropic
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_admin.py
│   │   ├── test_agents.py
│   │   └── test_calls.py
│   ├── Dockerfile
│   ├── .env.example             # Variables d environnement
│   └── requirements.txt
├── front/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx              # Routes React (102 lignes)
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx    # Sidebar + nav (182 lignes)
│   │   ├── pages/               # 13 pages (~4,000 lignes)
│   │   └── components/
│   │       ├── AgentTemplates.tsx
│   │       ├── CalendarWidget.tsx
│   │       ├── NotificationCenter.tsx
│   │       └── ui/              # shadcn/ui components
│   ├── Dockerfile
│   ├── .env.example             # Variables d environnement
│   └── package.json
├── docs/
│   ├── DOCUMENTATION.md         # ← Ce fichier
│   ├── API_REFERENCE.md
│   ├── PLAN.md
│   ├── PROGRESS.md
│   └── architecture-saas.md
├── docker-compose.preprod.yml
└── README.md
```

---

*Documentation rédigée par Shiro 🦊 — Mise à jour 26 février 2026*  
*Basée sur 35+ commits, 7 sprints, et 3 sessions de hotfix*
