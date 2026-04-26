# PRD Template Mapping

Use this mapping when writing BMAD PRDs and architecture documents.

## Section Mapping

- Business objective -> reference affected business `README.md` and `business_context.md`
- Workflow scope -> reference affected `workflows.md` files
- Data requirements -> reference affected `data_model.md` files and shared `data_model/`
- Approval rules -> reference affected `approval_flow.md` files and shared workflow files
- Reports -> reference affected `reports.md` files and shared `reports/`
- Integrations -> reference affected `integrations/` files
- Cross-business rules -> reference affected `shared/` files

## Architecture Document Rule

Architecture documents must include a section named `Nakarin ERP References` listing exact files, for example:

- `nakarin_erp/businesses/pos/room_flow.md`
- `nakarin_erp/businesses/pos/approval_flow.md`
- `nakarin_erp/shared/common_reports.md`

## PRD Writing Rules

- Summarize intent in BMAD.
- Keep detailed business meaning in Nakarin ERP.
- Reference exact files instead of rebuilding the knowledge layer inside the PRD.
