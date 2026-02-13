# CallRounded API Reference

> **Source officielle** : https://docs.callrounded.com/api-reference
> 
> **Base URL** : `https://api.callrounded.com/v1`
> 
> **Authentification** : Header `X-Api-Key: <api-key>`

---

## 📞 Calls

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/calls/phone` | Démarrer un nouvel appel téléphonique |
| `GET` | `/calls/{id}` | Récupérer les détails d'un appel |
| `GET` | `/calls` | Lister tous les appels |
| `PATCH` | `/calls/{id}` | Modifier un appel |
| `POST` | `/calls/{id}/terminate` | Terminer un appel en cours |
| `DELETE` | `/calls/{id}` | Supprimer un appel |

### Exemple : Démarrer un appel
```bash
curl --request POST \
  --url https://api.callrounded.com/v1/calls/phone \
  --header 'Content-Type: application/json' \
  --header 'X-Api-Key: <api-key>' \
  --data '{
    "from_number": "+33612345678",
    "to_number": "+33698765432",
    "agent_id": "uuid-de-l-agent",
    "dynamic_variables_values": {
      "first_name": "Jean",
      "last_name": "Dupont"
    }
  }'
```

**Docs** : https://docs.callrounded.com/api-reference/calls/start-a-new-phone-call

---

## 🤖 Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/agents` | Créer un nouvel agent |
| `GET` | `/agents/{id}` | Récupérer un agent |
| `PATCH` | `/agents/{id}` | Modifier un agent |
| `DELETE` | `/agents/{id}` | Supprimer un agent |
| `GET` | `/agents/{id}/versions` | Récupérer les versions d'un agent |
| `POST` | `/agents/{id}/deploy` | Déployer un agent (mettre en production) |

> ⚠️ **Note** : L'API n'a PAS d'endpoint pour lister tous les agents (`GET /agents` → 405).
> Il faut connaître l'ID de l'agent.

**Docs** : https://docs.callrounded.com/api-reference/agents/get-agent

---

## 📱 Phone Numbers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/phone-numbers` | Lister tous les numéros de téléphone |
| `PATCH` | `/phone-numbers/{id}` | Modifier un numéro (assigner à un agent, etc.) |

**Docs** : https://docs.callrounded.com/api-reference/phone-numbers/list-phone-numbers

---

## 📖 Knowledge Bases

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/knowledge-bases/{id}` | Récupérer les détails d'une base de connaissances |
| `POST` | `/knowledge-bases/{id}/sources` | Ajouter des sources à une KB |
| `DELETE` | `/knowledge-bases/{id}/sources` | Supprimer des sources d'une KB |

> 💡 **Tip** : Les Knowledge Bases contiennent les infos du salon (horaires, services, tarifs, etc.)
> que l'agent utilise pour répondre aux clients.

**Docs** : https://docs.callrounded.com/api-reference/knowledge-bases/get-knowledge-base-details

---

## ❓ Post-Call Questions

Questions posées automatiquement après chaque appel pour qualifier les leads.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/post-call-questions` | Lister toutes les questions |
| `POST` | `/post-call-questions` | Créer une nouvelle question |
| `GET` | `/post-call-questions/{id}` | Récupérer une question |
| `PATCH` | `/post-call-questions/{id}` | Modifier une question |
| `DELETE` | `/post-call-questions/{id}` | Supprimer une question |

**Docs** : https://docs.callrounded.com/api-reference/post-call-questions/list-post-call-questions

---

## 🔐 Authentification

Toutes les requêtes doivent inclure le header :
```
X-Api-Key: votre-clé-api
```

---

## 📚 Ressources

- **Documentation complète** : https://docs.callrounded.com
- **Getting Started** : https://docs.callrounded.com/documentation/getting_started/what_are_voice_agents
- **Discord Rounded** : Support et communauté

---

*Dernière mise à jour : 2026-02-13*
