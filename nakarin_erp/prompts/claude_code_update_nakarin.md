# Claude Code Update Nakarin

Use this prompt when Claude Code updates `nakarin_erp/`.

## Start Procedure Checklist

- Read `nakarin_erp/SOURCE_OF_TRUTH.md`
- Read `nakarin_erp/NAKARIN_SKILL.md`
- Read target business and shared files
- Check `DECISIONS.md`, `CHANGELOG.md`, and `AGENT_HANDOFF.md`
- Identify unknowns and conflicts before editing

## Working Rules

- Never guess
- Update docs when code changes business behavior
- Stop on conflict
- Keep shared rules in `shared/`
- Keep business-local rules in the target business folder
- Do not implement backend code in this task

## End Procedure Checklist

- Update all impacted documents
- Add a short changelog entry
- Add a decision entry if policy or architecture changed
- Update `AGENT_HANDOFF.md`
