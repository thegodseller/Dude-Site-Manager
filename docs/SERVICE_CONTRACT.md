# Service Contract

## Purpose

This document defines the expected service names, roles, ports, health endpoints, and ownership boundaries for the DuDe Hawaiian platform.

It is used by humans and AI coding agents before changing Docker Compose, ports, health checks, dashboards, or agent routing.

## Rules

- Do not change service ports without updating this file.
- Do not rename services without updating Docker Compose, health checks, and this file.
- Do not expose internal services publicly without documenting the security model.
- Do not commit secrets, `.env` files, tokens, passwords, private keys, or customer-private data.
- If local implementation differs from the DuDe standard, document the difference instead of silently changing code.

## Agent Services

| Service | Role | Host Port | Container Port | Health Endpoint | Source Path | Notes |
|---|---|---:|---:|---|---|---|
| ag_boss | Main orchestrator | 11111 | 8000 or 8080 | `/health` | `tHe_DuDe_Service/agents/ag_boss` | Verify actual compose mapping |
| ag_negotiator | LINE / webhook gateway | 11112 | 8000 or 8080 | `/health` | `tHe_DuDe_Service/agents/ag_negotiator` | Verify actual compose mapping |
| ag_librarian | Knowledge / RAG / Blinko sync | 11113 | 8000 or 8080 | `/health` | `tHe_DuDe_Service/agents/ag_librarian` | Verify actual compose mapping |
| ag_adventure | External research | 11114 | 8000 or 8080 | `/health` | `tHe_DuDe_Service/agents/ag_adventure` | Verify actual compose mapping |
| ag_watcher | Vision / OCR / monitoring | 11115 | 8000 or 8080 | `/health` | `tHe_DuDe_Service/agents/ag_watcher` | Verify actual compose mapping |
| ag_butler | IoT / task / log writer | 11116 | 8000 or 8080 | `/health` | `tHe_DuDe_Service/agents/ag_butler` | Verify actual compose mapping |

## Memory and Storage Services

| Service | Role | Host Port | Health Endpoint | Notes |
|---|---|---:|---|---|
| db_postgres | Structured data | 12221 | unknown | Do not expose publicly |
| db_qdrant | Vector DB | 12222 | `/healthz` | Used by RAG / Mem0 |
| db_redis | Cache / rate limiting | 13331 | unknown | Internal service |
| db_ollama | Local LLM | 11434 | `/api/tags` | Internal or local-only |
| mem0_svc | Memory service | 13332 | `/health` | Verify current compose |

## App Services

| Service | Role | Host Port | Health Endpoint | Notes |
|---|---|---:|---|---|
| blinko | Human dashboard / notes | 15555 | `/health` | Live inbox |
| blinko_bridge | Blinko API bridge | 15556 | `/health` | Used by agents |
| dude_web_control | System dashboard | 11118 | `/health` | Requires auth |

## Validation Commands

```bash
git status --short
docker compose ps
docker compose config
curl -sf http://localhost:11111/health
curl -sf http://localhost:11118/health
```
