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
| ag_boss | Main orchestrator | 11111 | 8000 | `/health` | `tHe_DuDe_Service/agents/ag_boss` | Active |
| ag_negotiator | LINE / webhook gateway | 11112 | 8000 | `/health` | `tHe_DuDe_Service/agents/ag_negotiator` | Active |
| ag_librarian | Knowledge / sync / search | 11113 | 8000 | `/health` | `tHe_DuDe_Service/agents/ag_librarian` | Active |
| ag_adventure | External research | 11114 | 8000 | `/health` | `tHe_DuDe_Service/agents/ag_adventure` | Active |
| ag_watcher | Vision / OCR / monitoring | 11115 | 8000 | `/health` | `tHe_DuDe_Service/agents/ag_watcher` | Active |
| ag_butler | IoT / task / log writer | 11116 | 8000 | `/health` | `tHe_DuDe_Service/agents/ag_butler` | Active |

## Memory and Storage Services

| Service | Role | Host Port | Container Port | Health Endpoint | Notes |
|---|---|---:|---:|---|---|
| db_postgres | Structured data | 12221 | 5432 | verify | Do not expose publicly |
| db_qdrant (HTTP) | Vector DB API | 12222 | 6333 | `/healthz` | Used by RAG / Mem0 |
| db_qdrant (gRPC) | Vector DB gRPC | 12223 | 6334 | verify | Internal client path |
| db_redis | Cache / rate limiting | 13331 | 6379 | verify | Internal service |
| db_mem0 | Memory API service | 13332 | 8080 | `/health` | Active service name |
| ollama_ov | Local LLM / embeddings | 11435 | 11434 | `/api/tags` | Internal/local-only |

## App Services

| Service | Role | Host Port | Container Port | Health Endpoint | Notes |
|---|---|---:|---:|---|---|
| blinko | Human dashboard / notes | 15555 | 1111 | `/health` | Live inbox |
| dude_web_control | System dashboard | 11118 | 8080 | `/health` | Requires auth |
| visionlabel | Annotation UI | 11119 | 80 | verify | Active in compose |
| dude_scheduler | Cron worker | none | n/a | n/a | No host port exposed |

## Open Questions

- `blinko_bridge` is not present in current active compose services. Legacy references may still exist in older docs or fallback env names.
- Some services may expose health via endpoint paths that vary by implementation version. If unknown, treat as `verify`.

## Standard Port Policy

- Keep host ports stable once assigned.
- Any port change requires simultaneous update of:
  - `tHe_DuDe_Compose/docker-compose.yml`
  - this `docs/SERVICE_CONTRACT.md`
- Internal-only services should not be publicly exposed without explicit security documentation.

## Validation Commands

```bash
git status --short
docker compose -f tHe_DuDe_Compose/docker-compose.yml ps
docker compose -f tHe_DuDe_Compose/docker-compose.yml config
curl -sf http://localhost:11111/health
curl -sf http://localhost:11113/health
curl -sf http://localhost:13332/health
curl -sf http://localhost:12222/healthz
```
