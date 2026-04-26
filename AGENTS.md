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
