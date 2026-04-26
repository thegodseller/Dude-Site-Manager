# Decisions

Record durable architecture and policy decisions here.

## Decision Log

### 2026-04-26 - `nakarin_erp` is the business source of truth

- Status: accepted
- Context: multiple AI assistants need one authoritative business layer.
- Decision: business meaning lives in `nakarin_erp/`, while DuDe Core keeps reusable agent mechanisms.
- Consequence: business behavior changes require documentation updates here.

### 2026-04-26 - Business boundaries stay local

- Status: accepted
- Context: each business has distinct workflows and approvals.
- Decision: business-specific rules stay in `businesses/<business_name>/`; shared rules stay in `shared/`.
- Consequence: assistants must avoid hard-coding a single business into reusable core logic.
