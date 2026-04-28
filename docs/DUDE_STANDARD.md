# DuDe Standard

## Scope Rules

1. `nakarin_erp/` is business and domain source-of-truth.
2. Root `docs/` is platform and repository-level documentation.
3. `tHe_DuDe_Service/obsidian_vault/` is service runtime and audit knowledge.

## Safety Rules

1. Never commit secrets, `.env`, credentials, tokens, or private exports.
2. Require explicit approval for side-effecting operations.
3. Mark risky or dependency-bound skills as `dependency_gated` until validated.

## Change Rules

1. Prefer small and auditable diffs.
2. Keep docs aligned with behavior and decisions.
3. If truth is unknown, record `UNKNOWN: requires owner confirmation`.
