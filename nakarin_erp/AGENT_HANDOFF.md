# Agent Handoff Protocol

This project may be edited by multiple AI coding assistants:

- Gemini CLI
- Claude Code
- Codex CLI
- Kimi CLI
- Antigravity

## Required Start Procedure

Before making changes:

1. Read AGENTS.md at repository root.
2. Read nakarin_erp/SOURCE_OF_TRUTH.md.
3. Read nakarin_erp/NAKARIN_SKILL.md.
4. Read nakarin_erp/DECISIONS.md.
5. Read the affected business module.
6. Check git status.

## Required End Procedure

After making changes:

1. Update affected documentation.
2. Update CHANGELOG.md.
3. Update affected business changelog.md if business-specific.
4. Add an entry to DECISIONS.md if an architectural or business decision was made.
5. Run ./scripts/validate_nakarin_erp.sh after any change under nakarin_erp/**.
6. Run any other available tests or validation commands if relevant.
7. Show changed files.
8. Summarize what changed, why, and how to verify.

## No-Drift Rules

- Do not invent business rules.
- Do not change business meaning without updating documentation.
- Do not hard-code one business into DuDe Core.
- Do not remove existing standards unless explicitly asked.
- Do not silently rename fields, tables, workflows, or services.
- Do not create duplicate truth files.

## Conflict Rule

If code and documentation disagree, stop and report the conflict.

Do not choose silently.

## Current Continuity Note

- Date: 2026-04-28
- Assistant: Codex CLI
- Scope touched: BMAD artifact-level enforcement for Nakarin ERP references
- Files updated: `tHe_DuDe_Service/_bmad/` templates/workflow steps, `scripts/validate_nakarin_erp.sh`, and `nakarin_erp/CHANGELOG.md`
- Open questions: whether to add runtime linting against generated BMAD output files is `UNKNOWN: requires owner confirmation`
- Conflicts: none identified in the added policy
- Next recommended step: run one end-to-end BMAD PRD/architecture/story/review cycle and confirm generated artifacts include concrete `nakarin_erp/**` references
