# CallRounded Manager — Documentation Technique

> **Portail client SaaS pour gérer un réceptionniste téléphonique IA (CallRounded)**  
> Développé par Shiro 🦊 & Kuro 🐺 pour W&I (Willyam BEGOT & Ilane)  
> *Mise à jour : 26 février 2026*

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture](#2-architecture)
3. [Stack technique](#3-stack-technique)
4. [Modèles de données](#4-modèles-de-données)
5. [API Backend — Routes](#5-api-backend--routes)
6. [Frontend — Pages & Composants](#6-frontend--pages--composants)
7. [Authentification & RBAC](#7-authentification--rbac)
8. [Intégration API CallRounded](#8-intégration-api-callrounded)
9. [Déploiement](#9-déploiement)
10. [Historique des sprints](#10-historique-des-sprints)
11. [Bugs connus & fixes appliqués](#11-bugs-connus--fixes-appliqués)
12. [Limitations actuelles](#12-limitations-actuelles)
13. [Prochaines étapes](#13-prochaines-étapes)

---

## 1. Vue d'ensemble

**CallRounded Manager** est un portail client SaaS permettant aux salons de coiffure de gérer leur **réceptionniste téléphonique IA** fourni par l'API [CallRounded](https://callrounded.com).

### Le problème

Les salons de coiffure perdent des clients à cause d'appels manqués. Un réceptionniste IA répond 24/7, prend les RDV, renseigne sur les tarifs et horaires. Mais il manquait un **portail client** pour :
- Voir l'historique des appels et transcriptions
- Configurer l'agent IA (personnalité, voix, prompts)
- Gérer les alertes et rapports
- Intégrer l'agenda Google Calendar

### Développement

7 sprints sur ~3 semaines (5–26 février 2026). Collaboration Shiro (frontend/backend) + Kuro (backend/models).

---

## 2. Architecture

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
│  /api/*    /*                                    │
│    │         │                                   │
│    ▼         ▼                                   │
│ ┌────────┐ ┌────────┐                            │
│ │FastAPI │ │ React  │                            │
│ │ :8201  │ │ :3101  │                            │
│ └───┬────┘ └────────┘                            │
│     │                                            │
│     ▼                                            │
│ ┌──────────┐   ┌────────────────────┐            │
│ │PostgreSQL│   │ CallRounded API    │            │
│ │  :5432   │   │ api.callrounded.com│            │
│ └──────────┘   └────────────────────┘            │
└─────────────────────────────────────────────────┘
```

---

## 3. Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | FastAPI + SQLAlchemy async + Alembic |
| Frontend | React 18 + Vite + shadcn/ui + Tailwind CSS |
| Base de données | PostgreSQL 16 (Alpine) |
| Auth | JWT (access 15min + refresh 7j) + bcrypt |
| API externe | CallRounded API v1 (httpx async) |
| LLM | Anthropic Claude (Agent Builder) |
| Déploiement | Docker Compose + nginx + Let's Encrypt |

### Métriques code

| Zone | Fichiers | Lignes |
|------|----------|--------|
| Backend (routes + services + auth + models) | 18 | 4,418 |
| Frontend (pages + composants + layout + App) | 18 | 5,223 |
| **Total** | **36** | **9,641** |

---

## 4. Modèles de données

### 14 tables

#### Core

| Table | Description | Champs clés |
|-------|------------|-------------|
| `tenants` | Multi-tenant | `id`, `name` (unique), `plan` (free/pro/enterprise), `created_at` |
| `users` | Utilisateurs avec rôles | `id`, `tenant_id` (FK), `email` (unique/tenant), `password_hash` (bcrypt), `role`, `is_active` |
| `user_agent_assignments` | Accès agent par utilisateur | `user_id` (FK), `agent_external_id`, `assigned_by` |

**Rôles** : `SUPER_ADMIN`, `TENANT_ADMIN`, `USER`  
**Méthodes User** : `is_admin()` → vérifie SUPER_ADMIN ou TENANT_ADMIN, `can_access_agent(id)`

#### Cache (sync depuis CallRounded API)

| Table | Description |
|-------|------------|
| `agents_cache` | Cache local des agents (`external_id`, `name`, `status`, `description`) |
| `calls_cache` | Cache des appels (`external_call_id`, `caller_number`, `duration`, `status`, `transcription`, `recording_url`, `started_at`, `ended_at`) |
| `phone_numbers_cache` | Cache numéros (`number`, `status`, `agent_external_id`) |
| `knowledge_bases_cache` | Cache KB (`name`, `description`, `source_count`) |

#### Features

| Table | Description |
|-------|------------|
| `agent_templates` | Templates de configuration (6 presets : coiffure, restaurant, médecin, immobilier, garage, e-commerce). Champs : `greeting`, `system_prompt`, `voice`, `language`, `category`, `icon`, `usage_count` |
| `weekly_reports` | Rapports hebdo générés (`total_calls`, `completed_calls`, `missed_calls`, `avg_duration`, `total_cost`, variations %) |
| `weekly_report_configs` | Config rapports par tenant (`enabled`, `recipients`, `schedule_day`, `schedule_time`, options include) |
| `alert_rules` | Règles d'alertes (`rule_type`, `conditions` JSON, `notify_email`, `notify_webhook`, `cooldown_minutes`, `is_active`) |
| `alert_events` | Historique alertes (`severity`, `title`, `message`, `acknowledged_at/by`) |
| `calendar_integrations` | Google Calendar OAuth (`access_token`, `refresh_token`, `calendar_id`, `last_sync`, `events_synced`) |

---

## 5. API Backend — Routes

**Total : 55 routes** réparties sur **13 fichiers de routes**.

### Auth (`/api/auth/`) — 4 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/login` | Login → cookies httpOnly (access_token + refresh_token) |
| POST | `/logout` | Supprime les cookies |
| GET | `/me` | Profil utilisateur courant |
| POST | `/refresh` | Rafraîchir le token |

### Dashboard (`/api/dashboard/`) — 1 route

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/stats` | Stats résumées (agents, appels, durée) via API CallRounded direct |

### Agents (`/api/agents/`) — 3 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des agents (depuis API CallRounded) |
| GET | `/{agent_id}` | Détail d'un agent |
| PATCH | `/{agent_id}` | Modifier un agent |

### Appels (`/api/calls/`) — 3 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des appels (paginée, filtres) |
| GET | `/rich` | Appels enrichis (transcriptions transformées via `transform_transcript()`) |
| GET | `/{call_id}` | Détail d'un appel avec transcription |

> **Note** : `transform_transcript()` convertit le format CallRounded `{role, content}` → frontend `{speaker, text, timestamp}`.

### Admin (`/api/admin/`) — 9 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users` | Liste users du tenant |
| POST | `/users` | Créer un user |
| GET | `/users/{id}` | Détail user |
| PATCH | `/users/{id}` | Modifier un user (rôle, actif) |
| DELETE | `/users/{id}` | Supprimer un user |
| GET | `/users/{id}/agents` | Agents assignés à un user |
| POST | `/users/{id}/agents` | Assigner un agent |
| POST | `/users/{id}/agents/bulk` | Assigner plusieurs agents |
| DELETE | `/users/{id}/agents/{agent_id}` | Retirer un agent |
| GET | `/agents` | Liste tous les agents (admin) |

### LLM Agent Builder (`/api/llm/`) — 2 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/chat` | Chat avec Claude pour configurer l'agent |
| GET | `/voices` | Liste des voix disponibles |

> Nécessite `ANTHROPIC_API_KEY` configurée.

### Templates (`/api/templates/`) — 9 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste templates (presets + custom) |
| GET | `/presets` | 6 templates préinstallés |
| GET | `/categories` | Catégories disponibles |
| GET | `/{id}` | Détail template |
| POST | `/` | Créer un template custom |
| PATCH | `/{id}` | Modifier template |
| DELETE | `/{id}` | Supprimer template |
| POST | `/{id}/use` | Appliquer un template à un agent |
| POST | `/seed-presets` | Seed les 6 presets en DB |

### Analytics (`/api/analytics/`) — 4 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/overview` | Vue d'ensemble (appels, durée, taux, top agents) |
| GET | `/trends` | Tendances semaine/mois |
| GET | `/weekly-reports` | Liste rapports hebdo générés |
| GET | `/peak-hours` | Heures de pointe |

### Alertes (`/api/alerts/`) — 10 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/rules` | Liste des règles |
| GET | `/rules/presets` | 4 presets (missed calls, duration, volume, errors) |
| POST | `/rules` | Créer une règle |
| POST | `/rules/from-preset/{preset_id}` | Créer depuis un preset |
| PATCH | `/rules/{rule_id}` | Modifier une règle |
| DELETE | `/rules/{rule_id}` | Supprimer une règle |
| GET | `/events` | Historique des alertes |
| POST | `/events/{event_id}/acknowledge` | Acquitter une alerte |
| POST | `/events/acknowledge-all` | Acquitter toutes les alertes |
| GET | `/stats` | Statistiques alertes |

### Rapports (`/api/reports/`) — 3 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/weekly/config` | Configuration rapport hebdo du tenant |
| PATCH | `/weekly/config` | Modifier la config (jour, heure, destinataires, options) |
| POST | `/weekly/send-now` | Envoyer le rapport immédiatement |

### Google Calendar (`/api/calendar/`) — 8 routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/connect` | Lancer OAuth Google |
| GET | `/callback` | Callback OAuth |
| GET | `/status` | État de la connexion |
| POST | `/disconnect` | Déconnecter |
| GET | `/events` | Liste des événements |
| POST | `/events` | Créer un événement |
| POST | `/sync` | Forcer la synchro |
| GET | `/available-slots` | Créneaux disponibles |

### Phone Numbers (`/api/phone-numbers/`) — 1 route

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Numéros extraits depuis `to_number` des appels (API `/phone-numbers` non fonctionnelle) |

### Knowledge Bases (`/api/knowledge-bases/`) — 1 route

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Infos salon parsées depuis le `base_prompt` de l'agent (API `/knowledge-bases` 404) |

---

## 6. Frontend — Pages & Composants

### 13 pages

| Page | Fichier | Lignes | Description |
|------|---------|--------|-------------|
| Login | `LoginPage.tsx` | 123 | Auth avec animations, background W&I |
| Dashboard | `DashboardPage.tsx` | 353 | Stats, graphiques, activité récente |
| Agents | `AgentsPage.tsx` | 138 | Liste des agents IA |
| Agent Builder | `AgentBuilderPage.tsx` | 334 | Chat LLM pour configurer l'agent |
| Appels (enrichi) | `CallHistoryRich.tsx` | 441 | Historique avec filtres, export, transcriptions |
| Détail appel | `CallDetailPage.tsx` | 259 | Transcription complète, infos appel |
| Analytics | `AnalyticsDashboard.tsx` | 417 | Graphiques, tendances |
| Alertes | `AlertsConfig.tsx` | 402 | CRUD règles, historique événements |
| Rapports | `ReportSettings.tsx` | 454 | Config rapports hebdo, preview |
| Calendrier | `CalendarIntegration.tsx` | 343 | OAuth Google, événements, slots |
| Admin Users | `AdminUsersPage.tsx` | 380 | CRUD utilisateurs, rôles, assignments |
| Numéros | `PhoneNumbersPage.tsx` | 115 | Liste numéros (extraits des appels) |
| Knowledge Bases | `KnowledgeBasesPage.tsx` | 214 | Infos salon (parsées depuis base_prompt) |

### 3 composants réutilisables

| Composant | Lignes | Description |
|-----------|--------|-------------|
| `AgentTemplates.tsx` | 363 | Sélecteur de templates avec preview |
| `CalendarWidget.tsx` | 299 | Widget calendrier pour le dashboard |
| `NotificationCenter.tsx` | 307 | Centre de notifications (WebSocket ready) |

### Layout

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `AppLayout.tsx` | 182 | Sidebar + nav + responsive |

### Routes frontend (`App.tsx`)

```
/                → DashboardPage
/analytics       → AnalyticsDashboard
/agents          → AgentsPage
/calls           → CallHistoryRich
/calls/:id       → CallDetailPage
/alerts          → AlertsConfig
/reports         → ReportSettings
/calendar        → CalendarIntegration
/phone-numbers   → PhoneNumbersPage
/knowledge-bases → KnowledgeBasesPage
/admin/users     → AdminUsersPage (admin only)
/admin/agent-builder → AgentBuilderPage (admin only)
```

### UX & Design

- **Charte W&I** : bleu nuit `#0E2A47`, or `#C9A24D`, blanc, noir
- **Typographies** : Playfair Display (titres) + Montserrat (textes)
- **Animations CSS** : fade-in, slide-up, scale-in, float, shimmer, pulse-gold
- **Composants loading** : Skeleton, LoadingSpinner, CircularProgress
- **Responsive** : adapté mobile/tablette
- **shadcn/ui** : button, card, dialog, table, input, label, badge, skeleton, switch

---

## 7. Authentification & RBAC

### Flow

```
1. POST /auth/login (email + password)
2. Backend vérifie bcrypt hash
3. Set cookies httpOnly : access_token (15min) + refresh_token (7j)
   → secure=True, samesite=lax
4. Chaque requête envoie les cookies automatiquement
5. Si expiré → POST /auth/refresh
```

### Rôles

| Rôle | Permissions |
|------|------------|
| `SUPER_ADMIN` | Tout (multi-tenant, futur) |
| `TENANT_ADMIN` | Admin d'un tenant : CRUD users, voir tous les agents, config alertes/rapports |
| `USER` | Voir uniquement les agents assignés, pas d'accès admin |

### ⚠️ Point critique : bcrypt only

Le backend utilise `passlib` avec `CryptContext(schemes=["bcrypt"])`. Les hashes argon2id causent une `UnknownHashError`. Bug historique corrigé le 16 février (ghost user avec mauvais hash).

### AdminRoute (frontend)

Le composant `AdminRoute` vérifie `user.role` parmi `ADMIN`, `TENANT_ADMIN`, `SUPER_ADMIN` avant d'afficher les pages admin.

---

## 8. Intégration API CallRounded

### Service (`api/app/services/callrounded.py` — 171 lignes)

Client HTTP async (`httpx`) qui proxy les appels vers `https://api.callrounded.com/v1`.

### Endpoints fonctionnels ✅

| Endpoint API | Usage |
|-------------|-------|
| `GET /calls` | Historique des appels (22 appels visibles) |
| `GET /agents/{id}` | Détail agent |

### Endpoints non-fonctionnels ⚠️

| Endpoint API | Problème |
|-------------|----------|
| `GET /phone-numbers` | Retourne "Welcome" (vide) |
| `GET /knowledge-bases` | 404 Not Found |

> **Contourné** : Phone numbers extraits depuis `to_number` des appels. KB parsée depuis `base_prompt` de l'agent.

### Agent configuré

- **Agent ID** : `a77a1d9c-05ed-4c2f-b00f-3194df10793f`
- **Nom** : Agent de coiffure v2

---

## 9. Déploiement

### Preprod

| Élément | Valeur |
|---------|--------|
| URL | https://callrounded-preprod.apps.ilanewep.cloud |
| Admin | `admin@wi-agency.fr` / `Admin2026!` (TENANT_ADMIN) |
| SSL | Let's Encrypt |
| VPS path | `/home/debian/callrounded-manager/` |

### Docker Compose (`docker-compose.preprod.yml`)

3 services :
- **db-preprod** : PostgreSQL 16 Alpine (volume `pgdata_preprod`)
- **api-preprod** : FastAPI (port `127.0.0.1:8201` → 8200)
- **front-preprod** : React/Vite (port `127.0.0.1:3101` → 80)

### nginx

```
/etc/nginx/sites-available/callrounded-preprod.conf
```
- `/api/` → `proxy_pass http://127.0.0.1:8201`
- `/` → `proxy_pass http://127.0.0.1:3101`

### Variables d'environnement

```env
DATABASE_URL=postgresql+asyncpg://callrounded:<password>@db-preprod:5432/callrounded_preprod
JWT_SECRET=<secret>
CALLROUNDED_API_URL=https://api.callrounded.com/v1
CALLROUNDED_API_KEY=<key>
CALLROUNDED_AGENT_ID=a77a1d9c-05ed-4c2f-b00f-3194df10793f
ANTHROPIC_API_KEY=<key>
FRONTEND_URL=https://callrounded-preprod.apps.ilanewep.cloud
```

### Commandes utiles

```bash
# Démarrer
cd /home/debian/callrounded-manager
docker compose -f docker-compose.preprod.yml up -d

# Logs
docker compose -f docker-compose.preprod.yml logs -f api-preprod

# Restart API
docker compose -f docker-compose.preprod.yml restart api-preprod

# Seed admin
docker compose -f docker-compose.preprod.yml exec api-preprod python -m app.seed
```

---

## 10. Historique des sprints

| Sprint | Dates | Contenu |
|--------|-------|---------|
| **0** — Foundation | 5-6 fév | Bootstrap FastAPI + React + PostgreSQL, intégration API CallRounded, charte W&I |
| **1** — UX | 6 fév | Animations CSS, skeleton loaders, login animé |
| **2** — Admin | 12 fév | RBAC multi-utilisateurs, LLM Agent Builder, tests unitaires |
| **3** — Templates & Analytics | 12-13 fév | 6 templates sectoriels, dashboard analytics |
| **4** — Alertes & Rapports | 13 fév | Règles d'alertes (4 presets), rapports hebdo |
| **5** — Notifications & Calendar | 13 fév | Centre de notifications, Google Calendar OAuth |
| **6** — Calendar UI | 13 fév | Interface calendrier complète, CalendarWidget |
| **7** — Bugfix & Cleanup | 23-26 fév | 7 bugs corrigés, Reports API, nettoyage console.log/dead code/mocks, merge → main |
| **8** — Stabilisation | 26-28 fév | Sécurité JWT, tenant display_name, pagination, rate limiting (slowapi), UX cleanup (Coming Soon, filtres), doc rewrite |

### Hotfixes

| Date | Fix |
|------|-----|
| 16 fév | Ghost user argon2id → supprimé, confirmé bcrypt only |
| 19 fév | Clé API, AGENT_ID, `/calls/rich`, fix RBAC `is_admin()`, fix routes admin frontend |
| 26 fév | JWT_SECRET régénéré (48 bytes crypto), 5 headers sécurité nginx, FRONTEND_URL corrigé |
| 28 fév | Agent name résolu via API (plus d ID technique), filtre sentiment supprimé, rate limiting 120/min |

---

## 11. Bugs connus & fixes appliqués

| Bug | Cause | Fix | Date |
|-----|-------|-----|------|
| Login `UnknownHashError` | Ghost user avec hash argon2id | Supprimé ghost user, confirmé bcrypt only | 16 fév |
| Page agents vide | `CALLROUNDED_AGENT_ID` manquant | Ajouté dans docker-compose.preprod.yml | 19 fév |
| Historique appels vide | Pas d'endpoint enrichi | Créé `/calls/rich` + `transform_transcript()` | 19 fév |
| Routes admin 403 | `is_admin()` ne reconnaissait pas `TENANT_ADMIN` | Fix check : SUPER_ADMIN ou TENANT_ADMIN | 19 fév |
| Frontend admin non visible | AppLayout check trop strict | Élargi check dans AppLayout.tsx et App.tsx | 19 fév |
| Analytics page 500 | Frontend appelait mauvais endpoint | Aligné sur `/analytics/overview` + field names | 23 fév |
| agent_name hardcodé | Nom agent statique dans les calls | Ajouté `get_agent_name()` avec cache 5min | 23 fév |
| Dashboard total_agents=0 | Utilisait AgentCache vide | Appel `cr.list_agents()` direct | 23 fév |
| Dashboard sans filtres date | `fetchCalls()` ignorait les dates | Ajouté `from_date`/`to_date` params | 23 fév |
| Dead code MOCK_CALLS | 120 lignes mock dans CallHistoryRich | Supprimé | 23 fév |
| console.log restants | 16 console.log dans 6 fichiers | Supprimé (gardé console.error) | 26 fév |
| Phone numbers vide | API `/phone-numbers` inutilisable | Extraction depuis `to_number` des calls | 23 fév |
| Reports endpoints manquants | Frontend appelait 3 routes inexistantes | Créé `reports.py` + modèle `WeeklyReportConfig` | 26 fév |
| Mock fallbacks Calendar | Fausses données si API fail | Fallback vers états vides | 26 fév |
| Mock fallbacks Alerts | `MOCK_RULES` inutilisé | Supprimé la constante | 26 fév |
| CallsPage.tsx dead code | Importé mais jamais routé | Supprimé fichier + import | 26 fév |
| Analytics agent ID technique | `agent_name` affichait `a77a1d9c...` | Résolution nom via `cr_service.get_agent()` | 28 fév |
| Analytics filtre week/month bloqué | Boutons absents en état vide | Ajouté sélecteur période dans EmptyState | 28 fév |
| Mon réceptionniste infos techniques | `base_prompt` et bouton Settings visibles | Masqué section instructions + bouton | 28 fév |
| Transcription messages système | Messages KB/system affichés au client | Filtrage roles system/tool/function + préfixes KB | 28 fév |
| Historique filtre sentiment inutile | Aucun appel n a de sentiment | Supprimé filtre sentiment + colonne CSV | 28 fév |
| Liens API externes visibles | Liens `app.callrounded.com` côté client | Supprimé liens externes PhoneNumbers + KB | 28 fév |

---

## 12. Limitations actuelles

### API CallRounded
- `/phone-numbers` retourne "Welcome" (pas de données)
- `/knowledge-bases` retourne 404
- Seuls `/calls` et `/agents/{id}` fonctionnent avec la clé actuelle
- → Contacter support CallRounded pour permissions

### Features partielles
- **Google Calendar** : OAuth implémenté mais pas testé en production (nécessite Google Cloud Console credentials)
- **Notifications WebSocket** : Frontend prêt, backend WebSocket non implémenté (polling)
- **LLM Agent Builder** : Fonctionnel si `ANTHROPIC_API_KEY` configurée
- **SMS/WhatsApp** : Exclu (nécessiterait Twilio)

### Sécurité
- JWT secret en `.env` (pas de vault)
- ✅ Rate limiting API : slowapi 120 req/min (ajouté Sprint 8)
- CORS restreint au `FRONTEND_URL`

---

## 13. Prochaines étapes

### Court terme (Sprint 8) — ✅ Terminé
1. ✅ **Tenant `display_name`** — champ configurable pour le nom du salon
2. ✅ **Pagination `/calls/rich`** — backend page/limit + frontend prev/next
3. ✅ **Sécurité preprod** — JWT_SECRET 48 bytes, 5 headers nginx, rate limiting slowapi
4. ✅ **Pipeline CI/CD** — GitHub Actions pour déploiement auto
5. ⏳ **Permissions API CallRounded** — phone-numbers et knowledge-bases (attente support)
6. ✅ **UX cleanup** — Coming Soon (alertes/rapports), filtres sentiment supprimés, agent name résolu
7. ✅ **Documentation** — DOCUMENTATION.md mise à jour Sprint 8

### Court terme (Sprint 2)
1. **Bouton désactivation agent** (demande William)
2. **Google Calendar OAuth** en preprod avec vrais credentials
3. **CI/CD pipeline dans repo CallRounded**

### Moyen terme
6. **Google Calendar OAuth** en preprod avec vrais credentials
7. **WebSocket backend** — notifications temps réel
8. **Multi-tenant complet** — plusieurs salons par instance
9. **Facturation** — Stripe (plans free/pro/enterprise)

### Long terme
10. **App mobile** — React Native pour les gérants
11. **Analytics IA** — résumés automatiques des tendances
12. **Intégrations** — Planity, Treatwell

---

## Annexe — Structure du projet

```
callrounded-manager/
├── api/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + CORS + routing
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── database.py          # AsyncSession SQLAlchemy
│   │   ├── models.py            # 14 tables (320 lignes)
│   │   ├── schemas.py           # Pydantic schemas (88 lignes)
│   │   ├── auth.py              # JWT decode + get_current_user (45 lignes)
│   │   ├── deps.py              # Dépendances FastAPI
│   │   ├── seed.py              # Seed admin user
│   │   ├── routes/
│   │   │   ├── __init__.py      # 13 routers (18 lignes)
│   │   │   ├── auth.py          # 4 routes (73 lignes)
│   │   │   ├── dashboard.py     # 1 route (140 lignes)
│   │   │   ├── agents.py        # 3 routes (66 lignes)
│   │   │   ├── calls.py         # 3 routes (224 lignes)
│   │   │   ├── admin.py         # 10 routes (466 lignes)
│   │   │   ├── llm.py           # 2 routes (369 lignes)
│   │   │   ├── templates.py     # 9 routes (432 lignes)
│   │   │   ├── analytics.py     # 4 routes (413 lignes)
│   │   │   ├── alerts.py        # 10 routes (512 lignes)
│   │   │   ├── calendar.py      # 8 routes (561 lignes)
│   │   │   ├── reports.py       # 3 routes (129 lignes)
│   │   │   ├── phone_numbers.py # 1 route (61 lignes)
│   │   │   └── knowledge_bases.py # 1 route (103 lignes)
│   │   └── services/
│   │       ├── callrounded.py   # Client API CallRounded (171 lignes)
│   │       └── llm_service.py   # Service Claude/Anthropic (227 lignes)
│   ├── alembic/                 # Migrations DB
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_admin.py
│   │   ├── test_agents.py
│   │   └── test_calls.py
│   ├── Dockerfile
│   ├── .env.example
│   └── requirements.txt
├── front/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx              # Routes (99 lignes)
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx    # Sidebar + nav (182 lignes)
│   │   ├── pages/               # 13 pages (4,373 lignes)
│   │   └── components/
│   │       ├── AgentTemplates.tsx  # (363 lignes)
│   │       ├── CalendarWidget.tsx  # (299 lignes)
│   │       ├── NotificationCenter.tsx # (307 lignes)
│   │       └── ui/              # shadcn/ui components
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── DOCUMENTATION.md         # ← Ce fichier
│   ├── DOCUMENTATION_OLD.md     # Ancienne version (Sprint 6)
│   ├── API_REFERENCE.md
│   ├── PLAN.md
│   ├── PROGRESS.md
│   └── architecture-saas.md
├── docker-compose.preprod.yml
└── README.md
```

---

*Documentation rédigée par Shiro 🦊 — 26 février 2026*  
*Synchronisée avec le code source (commit `d802c3c`)*
