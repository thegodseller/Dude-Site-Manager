# Root Agent Instructions

This repository contains DuDe Core and Nakarin ERP.

## Main Concept

DuDe Core is the reusable AI/agent/automation engine.

Nakarin ERP is the single source of truth for business operations.

## Mandatory Rules

1. Read nakarin_erp/SOURCE_OF_TRUTH.md before changing business logic.
2. Read nakarin_erp/AGENT_HANDOFF.md before editing.
3. Business-specific rules must live in nakarin_erp/businesses/<business_name>/.
4. Shared business rules must live in nakarin_erp/shared/.
5. Do not hard-code business-specific behavior into DuDe Core.
6. If code changes business behavior, update Nakarin ERP documentation in the same commit.
7. After any change under nakarin_erp/**, run ./scripts/validate_nakarin_erp.sh from the repository root.
8. If documentation and code disagree, stop and report the conflict.
9. Never guess approval rules, accounting rules, stock rules, production rules, or report definitions.
10. Use UNKNOWN: requires owner confirmation when information is missing.
11. Keep changes small, traceable, and reversible.

## Supported Business Modules

- ice_fac_aran
- am_nexus
- 121c
- room_service
- pos

## AI Tools

This repository may be edited by:

- Gemini CLI
- Claude Code
- Codex CLI
- Kimi CLI
- Antigravity

All tools must follow the same source of truth.

## Nested Repo Push Rule:
- tHe_DuDe_Service is a gitlink/nested repository.
- Always commit and push tHe_DuDe_Service first.
- Then commit/update/push the parent repository.
- Never push parent gitlink commits that reference nested commits not available on the nested remote.

---

## DuDe Hawaiian Token-Saving Overlay

### Current Project Boundaries
- Parent repo: /home/thegodseller/DuDe_Hawaiian
- Nested service repo: tHe_DuDe_Service
- WebUI app: tHe_DuDe_WebUI/dude_hawaiian_webui
- Corporate site: tHe_DuDe_WebUI/corporate_site
- MissionRide path: tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/

### Critical Boundaries
- corporate_site is a public marketing site. Do not touch it unless explicitly requested.
- POS Season 1 MVP is closed. Do not touch POS unless explicitly requested.
- MissionRide is the current GPS mission-app work.
- Generated Pi5 watcher datasets are ignored and must not be committed.
- Never inspect or print .env files.

### Token-Saving Workflow
- Scout only: inspect only named files and nearby entry points.
- Plan only: write a short plan without editing.
- Patch only: edit the smallest file set required.
- Validate only: run named checks and summarize results.

### Validation Commands
- git status --short
- git -C tHe_DuDe_Service status --short
- git -C tHe_DuDe_WebUI/dude_hawaiian_webui status --short
- bash scripts/rtk_snapshot.sh

### Output Rules
- Use git diff --stat before full diffs.
- Cap long command output with sed -n.
- Summarize logs only.
- Never paste long build logs.
- Never run git add .

### Final Report Format
- Files inspected
- Files changed
- Validation result
- Risks
- Child commit hash, if any
- Parent commit hash, if any
- Confirmation that corporate_site, POS, and .env files were untouched
