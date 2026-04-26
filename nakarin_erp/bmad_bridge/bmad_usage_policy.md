# BMAD Usage Policy

## Authority Rules

1. BMAD is the workflow system, not the business source of truth.
2. Nakarin ERP remains the single source of truth.

## Reference Rules

Every BMAD artifact must reference exact affected Nakarin ERP files, including:

- PRD
- architecture document
- story
- QA note

Typical reference targets:

- `nakarin_erp/businesses/<business_name>/workflows.md`
- `nakarin_erp/businesses/<business_name>/data_model.md`
- `nakarin_erp/businesses/<business_name>/approval_flow.md`
- `nakarin_erp/businesses/<business_name>/reports.md`
- `nakarin_erp/shared/common_workflows.md`
- `nakarin_erp/reports/<report_name>.md`

## Conflict Rules

- If BMAD output conflicts with Nakarin ERP, stop and report the conflict.
- Do not silently reconcile business meaning from BMAD assumptions.

## Duplication Rules

- Do not duplicate all Nakarin ERP content into BMAD docs.
- Link or reference the exact files instead.
- Copy only the minimum context needed for workflow execution.

## Update Rules

- If BMAD output changes business logic, update the affected Nakarin ERP docs in the same change.
- A BMAD artifact without Nakarin ERP references is incomplete.
