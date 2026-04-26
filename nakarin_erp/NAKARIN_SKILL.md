---
description: |
  Nakarin ERP business knowledge layer for DuDe.
  Use this skill whenever working on business workflows, ERP-like operations, approvals, reports, data models, LINE workflows, POS, room service, factory operations, construction operations, stock, production, or integrations.

  Trigger automatically when:
  - User mentions Nakarin ERP, Ice Fac Aran, AM Nexus, 121C, Room Service, POS, minimart, parking, room, factory, construction, stock, production, approval, LINE card, LIFF, employee request, cash advance, leave request, complaint, quality check, Android TV, Home Assistant, Tuya, Hikvision, or business report.
  - Writing backend routes, database schema, report queries, workflows, business rules, or agent behavior for any business module.
  - Updating DuDe behavior that affects business operations.

  Skip when:
  - Pure DuDe core infrastructure with no business behavior change.
  - Pure Docker maintenance that does not affect business rules.
  - Pure frontend styling with no workflow or data change.
---

# Nakarin ERP Skill

This skill is an index only.

Start here:
- nakarin_erp/SOURCE_OF_TRUTH.md
- nakarin_erp/AGENT_HANDOFF.md
- nakarin_erp/DECISIONS.md

Rules:
1. Never guess business rules.
2. Never duplicate business rules into DuDe Core.
3. Read only relevant files to save context.
4. If changing business behavior, update the matching documentation in the same commit.
5. If a rule is missing, write UNKNOWN and request owner confirmation.
6. Keep DuDe Core reusable.
7. Keep business-specific rules inside nakarin_erp/businesses/<business_name>/.
8. Keep shared business rules inside nakarin_erp/shared/.
9. Every AI assistant must read AGENT_HANDOFF.md before making changes.
10. The documentation is the single source of truth.
