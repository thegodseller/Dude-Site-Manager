# Business Rules Policy

- Shared business rules belong in `shared/`.
- Business-specific rules belong in `businesses/<business_name>/`.
- Do not place a business-local exception in shared files.
- If a rule may apply to multiple businesses, document the shared baseline first and then note local overrides.
