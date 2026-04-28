# Changelog

## Rules

- Append entries, never rewrite history without reason.
- Keep entries short and factual.
- Reference the affected business or shared area.

## Entries

- 2026-04-26: Initialized `nakarin_erp` as DuDe's business knowledge layer and populated governance, shared standards, business modules, and assistant prompts.
- 2026-04-26: Added `bmad_bridge/` policy files so BMAD artifacts must reference affected Nakarin ERP files and cannot replace the source of truth.
- 2026-04-26: Updated workflow documentation to require `./scripts/validate_nakarin_erp.sh` after changes under `nakarin_erp/**`.
- 2026-04-26: Recorded that the Nakarin ERP foundation is now committed in three documentation commits covering source of truth, validation script, and agent validation workflow.
- 2026-04-26: Deepened the Ice Fac Aran module for Phase 2 confirmed scope without changing other business modules.
- 2026-04-27: Added file intake integration guidance and approved Magika as a candidate file type detection layer for uploads and document imports.
- 2026-04-27: Added controlled Magika and RackPeek evaluation scripts plus infrastructure intake guidance without changing runtime code.
- 2026-04-27: Recorded local evaluation findings that Magika install requires `pipx` and RackPeek was cloned locally at `tools/vendor/RackPeek` without build, startup, or scanning.
- 2026-04-27: Completed controlled local Magika evaluation using user-local `pipx`; `magika 1.0.2` installed successfully and the eval script passed on the sample text file.
- 2026-04-27: Added a local RackPeek seed inventory and safe start/stop scripts so the local Web UI can show DuDe infrastructure data without network scanning.
- 2026-04-27: Updated the local RackPeek start path to keep the mounted config writable because RackPeek creates local backup files during load/migration.
- 2026-04-27: Moved local RackPeek from host port `18080` to `127.0.0.1:18081` so `18080` remains reserved for local llama-server use.
- 2026-04-27: Fixed the RackPeek local seed config by quoting incompatible `notes` values and updating the seeded RackPeek service entry from `18080` to `18081`.
- 2026-04-27: Created `owner_confirmation_checklist.md` for Ice Fac Aran to lock business rules and approval chains before implementation.
- 2026-04-27: Translated `owner_confirmation_checklist.md` into Thai for business owner review.
- 2026-04-27: Created `owner_interview_form_th.md` as a practical tool for capturing owner decisions.
- 2026-04-27: Synchronized RackPeek manual inventory with audited Docker/host services, fixing agent port mismatches and adding database/auxiliary services.
- 2026-04-27: Decommissioned unused `dude-download-portal` (port 8088) and updated RackPeek inventory to highlight port 11118 as the DuDe Global Control Dashboard.
- 2026-04-28: Enforced `Nakarin ERP References` requirements in BMAD PRD, architecture, story, and code-review artifacts plus validation checks in `scripts/validate_nakarin_erp.sh`.
