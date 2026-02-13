# CallRounded Manager — Plan d'amélioration

**Date** : 2026-02-13
**Branche** : `Shiro/white_cart`
**Équipe** : Shiro 🦊 (Frontend) + Kuro 🐺 (Backend)

---

## 🎯 Objectifs (demande Ilane)

### Feature 1 : Système Admin/User
- **SUPER_ADMIN** : Peut tout voir, créer des comptes, assigner des agents
- **TENANT_ADMIN** : Admin d'un tenant (salon)
- **USER** : Voit seulement ses agents assignés + dashboard filtré

### Feature 2 : Création d'agent via LLM
- Onglet spécial admin
- Interface chat avec LLM
- Le LLM connaît la doc CallRounded
- Création d'agent conversationnelle

---

## 📋 Plan d'exécution

### Phase 1 : Système Admin/User

#### Backend (Kuro 🐺)
- [ ] Ajouter enum `UserRole` (SUPER_ADMIN, TENANT_ADMIN, USER)
- [ ] Table `user_agent_assignments` (user_id, agent_external_id)
- [ ] Migration Alembic
- [ ] Routes admin :
  - `GET /admin/users` — Lister tous les users
  - `POST /admin/users` — Créer un user
  - `PATCH /admin/users/{id}` — Modifier (rôle, actif)
  - `DELETE /admin/users/{id}` — Supprimer
  - `POST /admin/users/{id}/agents` — Assigner agents
  - `DELETE /admin/users/{id}/agents/{agent_id}` — Retirer agent
- [ ] Middleware `require_role(roles: list[UserRole])`
- [ ] Filtrer les données selon le rôle dans les routes existantes
- [ ] Tests unitaires pour chaque route

#### Frontend (Shiro 🦊)
- [ ] Page `/admin/users` — Liste des users avec actions
- [ ] Modal création user
- [ ] UI assignation agents (multi-select)
- [ ] Filtrage dashboard selon agents assignés
- [ ] Guards de route selon rôle
- [ ] Afficher le rôle dans le header

### Phase 2 : Création d'agent via LLM

#### Backend (Kuro 🐺)
- [ ] Route `POST /admin/agent-builder/chat`
- [ ] Intégration LLM (Anthropic Claude)
- [ ] System prompt avec doc CallRounded
- [ ] Extraction des paramètres agent depuis la conversation
- [ ] Appel API CallRounded pour créer l'agent

#### Frontend (Shiro 🦊)
- [ ] Page `/admin/agent-builder`
- [ ] Interface chat (messages, input, historique)
- [ ] Preview de l'agent en cours de création
- [ ] Bouton "Créer l'agent" quand prêt
- [ ] Feedback visuel du statut

---

## 🧪 Tests

### Backend
- pytest avec fixtures
- Tests pour chaque endpoint
- Tests de permissions (user ne peut pas accéder admin)
- Coverage > 80%

### Frontend
- Tests manuels pour l'instant
- Vérifier responsive

---

## 📝 Logging

### Backend
- `structlog` déjà en place
- Ajouter logs pour :
  - Création/modification users
  - Assignation agents
  - Appels LLM (prompt, response, durée)
  - Erreurs avec context

### Frontend
- Console.log pour debug
- Erreurs API loggées

---

## 🎨 Charte graphique W&I

- **Bleu nuit** : #0E2A47
- **Or** : #C9A24D
- **Blanc** : #FFFFFF
- **Noir** : #1A1A1A
- **Typo titres** : Playfair Display
- **Typo texte** : Montserrat

---

## 📁 Structure fichiers à créer

```
api/app/
├── models.py          # Ajouter UserRole, UserAgentAssignment
├── routes/
│   ├── admin.py       # Nouvelles routes admin
│   └── agent_builder.py  # Route chat LLM
├── services/
│   └── llm_agent_builder.py  # Service LLM
└── tests/
    ├── test_admin.py
    └── test_agent_builder.py

front/src/
├── pages/
│   ├── AdminUsersPage.tsx
│   └── AgentBuilderPage.tsx
├── components/
│   ├── UserTable.tsx
│   ├── AssignAgentsModal.tsx
│   └── ChatInterface.tsx
└── hooks/
    └── useRole.ts
```

---

*Plan créé par Shiro 🦊 — À jour : 2026-02-13 00:47 UTC*
