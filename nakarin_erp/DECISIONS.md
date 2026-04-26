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

### 2026-04-26 - Nakarin ERP foundation checkpoint

- Status: accepted
- Context: the initial Nakarin ERP documentation foundation, BMAD bridge, and validation workflow are now in place.
- Decision: Nakarin ERP is the single business source of truth; DuDe Core remains reusable and business-agnostic; BMAD is only a workflow layer; any change under `nakarin_erp/**` must run `./scripts/validate_nakarin_erp.sh`.
- Consequence: future assistants must treat business meaning, workflow references, and validation as one connected documentation contract.

### 2026-04-27 - Magika is a candidate file type detection layer

- Status: accepted
- Context: DuDe and Nakarin ERP need a safe file intake layer for uploads and document imports.
- Decision: Google Magika is approved as a candidate file type detection layer, not a malware scanner.
- Consequence: file intake design may use Magika for content-type detection, but separate malware or security controls remain required if adopted.

### 2026-04-27 - Magika and RackPeek are approved for controlled local evaluation only

- Status: accepted
- Context: DuDe needs safe preparation scripts and documentation before any product integration or production automation.
- Decision: Magika is approved for controlled local evaluation as a file type detection layer; RackPeek is approved for controlled local evaluation as an internal infrastructure inventory and discovery tool; neither is approved for production automation yet.
- Consequence: local install and evaluation scripts may exist in `tools/`, but runtime integration, automated scanning, and production policy remain gated by future approval.
