# DuDe Standard

## Scope Rules

1. `nakarin_erp/` is business and domain source-of-truth.
2. Root `docs/` is platform and repository-level documentation.
3. `tHe_DuDe_Service/obsidian_vault/` is service runtime and audit knowledge.

## Safety Rules

1. Never commit secrets, `.env`, credentials, tokens, or private exports.
2. Require explicit approval for side-effecting operations.
3. Mark risky or dependency-bound skills as `dependency_gated` until validated.

## Change Rules

1. Prefer small and auditable diffs.
2. Keep docs aligned with behavior and decisions.
3. If truth is unknown, record `UNKNOWN: requires owner confirmation`.

## requirements:
Document the standard DuDe service model.

Use these standard concepts:

DuDe is a multi-agent microservices system.

Standard agents:
- ag_boss: main orchestrator
- ag_librarian: knowledge, RAG, memory, documentation
- ag_adventure: external research and web/OSINT tools
- ag_negotiator: user/customer communication gateway such as LINE, LIFF, WhatsApp, Telegram
- ag_watcher: camera, vision, monitoring, incident detection
- ag_butler: system assistant, maintenance, email, code, deployment, recovery

Standard port ranges:
- Agent services: 11111-11119
- Web UI services: 12221-12229
- Vector store services: 13331-13339
- Memory services: 14441-14449
- App services: 15551-15559
- Optimization engines: 16000-16099

Current known standard ports:
- ag_boss: host 11111 -> container 8080
- ag_librarian: host 11112 -> container 8080
- ag_adventure: host 11113 -> container 8080
- ag_negotiator: host 11114 -> container 8080
- ag_watcher: host 11115 -> container 8080
- ag_butler: host 11116 -> container 8080
- lineliff: host 15551 -> container 8080
- db_mem0: host 8050 -> container 8050

Memory and knowledge standard:
- mem0: agent/user memory and compact facts
- Blinko: live inbox, notes, incident feed, raw short-form operational records
- Obsidian: curated long-term knowledge, runbooks, audits, architecture, decisions
- Vector DB such as Qdrant: semantic retrieval index

Information flow:
- Raw events, messages, camera incidents, and quick notes should go to Blinko first.
- ag_librarian should summarize, classify, deduplicate, and decide what goes to mem0, Obsidian, and vector search.
- mem0 should not store long logs or raw incident dumps.
- Obsidian should not receive every raw event; it should receive curated long-term records.
- Git docs are the source of truth for repo-specific implementation details.
