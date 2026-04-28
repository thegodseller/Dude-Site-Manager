# Nakarin ERP Source of Truth

Nakarin ERP is the single business truth layer for DuDe deployments.

## Purpose

This folder stores business knowledge, workflows, data models, reports, approval rules, and operational standards for all businesses connected to DuDe.

## Rule

If any business logic, workflow, database schema, report definition, approval rule, LINE command, integration behavior, or operating standard changes, update this knowledge base in the same commit.

## Golden Rule

Code may change only after the documentation source of truth is checked.

Documentation must change when code changes business behavior.

## Ownership

- DuDe Core owns reusable agent mechanisms.
- Nakarin ERP owns business meaning.
- Each business folder owns its own specific rules.

## Business Modules

- Ice Fac Aran: Ice factory production and operation
- AM Nexus: Construction company operations
- 121C: Canned corn packing factory
- Room Service: Android TV and in-room service system
- POS: Minimart, parking, and room sales operations

## Update Requirements

Every implementation must update at least one of these when relevant:

- CHANGELOG.md
- DECISIONS.md
- affected business changelog.md
- affected workflow file
- affected data model file
- affected report file
- affected integration file

## Anti-Drift Rule

No AI assistant may invent business rules.

If information is missing, write:

UNKNOWN: requires owner confirmation

Then stop and ask for confirmation before implementation.

## Repository Boundaries

- `nakarin_erp/` is for business, domain, customer, workflow, and operational knowledge.
- Root `docs/` is for DuDe platform and repository-level documentation.
- `tHe_DuDe_Service/obsidian_vault` is for service-level runtime, operations, and audit knowledge.

## Privacy and Secret Handling

- Store private business documents only under `nakarin_erp/private/`.
- Do not commit private documents, raw exports, or secrets.
- Never commit API keys, `.env` files, tokens, or credentials.
- Never commit raw employee identifiers or private customer documents.
- Keep extracted spreadsheets, CSV exports, and ad hoc data dumps out of git history.
