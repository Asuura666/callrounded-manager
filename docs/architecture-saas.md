# Architecture SaaS Freelance

Source: Google Drive (architecture-saas-freelance.docx)

## Résumé

Modèle: **Isolation totale — 1 instance par client**

### Stack
- IaC: Terraform (OVH Public Cloud)
- Config: Ansible
- Containers: Docker Compose + Traefik v3
- CI/CD: GitHub Actions → GHCR
- Monitoring: Grafana + Prometheus + Loki
- Backend: FastAPI
- Frontend: React + Vite

### Workflow onboarding
```bash
./onboard-client.sh --name acme --domain acme.monapp.com --plan b2-7
```

Durée: ~5-7 minutes pour un client opérationnel.

(Document complet disponible sur Google Drive)
