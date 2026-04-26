# QA Gate Policy

BMAD QA notes must verify source-of-truth alignment before a story can pass.

## QA Gate Checks

- The BMAD artifact lists exact affected Nakarin ERP files.
- The implemented behavior matches the referenced Nakarin ERP files.
- Any business logic change includes Nakarin ERP documentation updates.
- Shared and business-local boundaries were respected.
- No BMAD artifact became a second business truth store.

## Fail Conditions

- Missing Nakarin ERP file references.
- Business behavior changed without Nakarin ERP updates.
- BMAD notes conflict with Nakarin ERP.
- Duplicated business definitions in BMAD that should have remained references.

## QA Action On Conflict

1. Stop the story.
2. Record the conflicting BMAD artifact and Nakarin ERP file paths.
3. Request owner or maintainer clarification before continuing.
