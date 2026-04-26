# Nakarin ERP

`nakarin_erp/` is the business knowledge layer for DuDe, created in memory of the owner's younger brother.

## Purpose

- Serve as the single source of truth for business operations.
- Let multiple AI assistants continue each other's work safely.
- Separate reusable DuDe Core mechanisms from business meaning.
- Prevent duplicated truth, silent drift, and fake assumptions.

## Scope

- Documentation and knowledge architecture only.
- No backend implementation belongs here yet.
- Unknown facts must remain explicit until owner confirmation.

## Operating Rules

- Never guess.
- Update docs when code changes affect business behavior.
- Stop on conflict.
- Keep shared business rules in `shared/`.
- Keep business-specific rules in `businesses/<business_name>/`.

## Businesses

- `ice_fac_aran/`: ice factory production and operations.
- `am_nexus/`: construction company operations.
- `121c/`: canned corn packing factory.
- `room_service/`: Android TV and in-room room service.
- `pos/`: minimart, parking, and room sales operations.

## Main Entry Files

- `SOURCE_OF_TRUTH.md`
- `NAKARIN_SKILL.md`
- `AGENT_HANDOFF.md`
- `CHANGELOG.md`
- `DECISIONS.md`

## Integration Bridges

- `bmad_bridge/`: BMAD workflow integration rules that must defer to Nakarin ERP as the business source of truth
