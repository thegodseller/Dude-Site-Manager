# BMAD Bridge

`bmad_bridge/` defines how BMAD workflow artifacts must interact with Nakarin ERP.

## Core Position

- BMAD is the workflow system.
- BMAD is not the business source of truth.
- Nakarin ERP remains the single source of truth for business meaning.

## Files

- `bmad_usage_policy.md`
- `story_definition_of_done.md`
- `prd_template_mapping.md`
- `qa_gate_policy.md`

## Usage Summary

1. Start from affected Nakarin ERP files.
2. Reference exact Nakarin ERP files in BMAD artifacts.
3. Do not duplicate all Nakarin ERP content into BMAD documents.
4. Stop if BMAD output conflicts with Nakarin ERP.
