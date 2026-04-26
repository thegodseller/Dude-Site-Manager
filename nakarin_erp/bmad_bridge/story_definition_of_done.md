# Story Definition Of Done

A BMAD story that affects business logic is done only when all conditions below are true.

## Required Checklist

- The story lists exact affected Nakarin ERP files.
- The implementation or change proposal matches those files.
- Business logic updates are reflected in Nakarin ERP documentation.
- Shared logic changes update shared Nakarin ERP files.
- Business-local changes update the correct `businesses/<business_name>/` files.
- `nakarin_erp/CHANGELOG.md` is updated.
- The affected business `changelog.md` is updated when relevant.
- Any business-rule conflict is reported and work stops until clarified.

## Not Done Conditions

- Business logic changed but Nakarin ERP docs were not updated.
- BMAD story text conflicts with Nakarin ERP.
- BMAD story omits exact file references.
- BMAD output duplicates large sections of Nakarin ERP instead of referencing them.
