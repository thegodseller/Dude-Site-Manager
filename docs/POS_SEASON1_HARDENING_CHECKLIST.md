# POS Season 1 Hardening Checklist

Last audited: 2026-05-01

## Scope Boundary

This checklist covers the internal POS/admin stack:

- Backend: `tHe_DuDe_Service/agents/ag_pos`
- Internal UI: `tHe_DuDe_WebUI/dude_hawaiian_webui`
- Validation script: `scripts/validate_pos_api.sh`

`corporate_site` is out of scope for POS Season 1 hardening. Do not modify or deploy `tHe_DuDe_WebUI/corporate_site` as part of this work.

## Current POS Capabilities

- Product search by Thai text, English text, barcode, and core catalog fields.
- Cashier identity with employee list, PIN login, session start/end route, reset PIN, deactivate employee, and role display.
- Shift open, current shift lookup, shift close, and shift summary.
- Sale ticket creation with stock deduction and insufficient-stock rejection.
- Receipt endpoint for confirmed and voided tickets.
- Manager-authorized ticket void with stock restoration and audit logging.
- Ticket history with status and ticket number filters.
- Daily sales report with ticket counts, sales totals, payment breakdown, top items, and cashier summary.
- Inventory adjustment with stock ledger and audit log.
- Product catalog management with create, update, deactivate, price-change audit, and duplicate SKU rejection.
- Low-stock dashboard and reorder point settings.
- Purchase order MVP with create, list, receive, cancel, stock increase on receive, ledger entry, and audit log.
- CSV exports for daily report and ticket history:
  - `GET /api/pos/reports/daily/export.csv?date=YYYY-MM-DD`
  - `GET /api/pos/tickets/export.csv?date=YYYY-MM-DD`

## API Security Audit

The POS API currently has no general authentication middleware, bearer token, cookie session, CSRF protection, or server-side authorization policy per endpoint. Treat the service as internal-network-only until this is fixed.

Endpoints currently open but should be manager/admin protected before real production:

- Employee management:
  - `GET /api/pos/employees`
  - `POST /api/pos/employees`
  - `PATCH /api/pos/employees/{employee_id}`
  - `POST /api/pos/employees/{employee_id}/deactivate`
  - `POST /api/pos/employees/{employee_id}/reset-pin`
- Audit log:
  - `GET /api/pos/audit-log`
- CSV and report exports:
  - `GET /api/pos/reports/daily/export.csv`
  - `GET /api/pos/tickets/export.csv`
  - `GET /api/pos/reports/daily`
  - `GET /api/pos/tickets`
- Purchase orders:
  - `POST /api/pos/purchase-orders`
  - `GET /api/pos/purchase-orders`
  - `GET /api/pos/purchase-orders/{po_id}`
  - `POST /api/pos/purchase-orders/{po_id}/receive`
  - `POST /api/pos/purchase-orders/{po_id}/cancel`
- Inventory and product administration:
  - `POST /api/pos/inventory/adjust`
  - `GET /api/pos/inventory/ledger`
  - `POST /api/pos/products`
  - `PATCH /api/pos/products/{product_id}`
  - `POST /api/pos/products/{product_id}/deactivate`
  - `PATCH /api/pos/products/{product_id}/reorder-settings`
  - `GET /api/pos/inventory/low-stock`

Existing server-side authorization:

- `POST /api/pos/tickets/{ticket_id}/void` checks employee role against `MANAGER`, `ADMIN`, `SUPERVISOR`, or `OWNER`.

## Session Behavior Audit

- The internal UI stores the active cashier in `localStorage` under `dude_pos_active_cashier`.
- The stored cashier object does not include PIN, hash, or salt, based on current employee response shaping.
- No expiry timestamp is stored with the local cashier session.
- No server-side session token is issued by `POST /api/pos/employees/session/start`.
- `POST /api/pos/employees/session/end` confirms termination but does not revoke a server-side token because no token exists yet.
- The UI calls `session/end` when ending a cashier session, then removes local storage.
- There is no inactivity auto-logout in the current UI.

Before real production, add a server-issued session token or signed cookie, expiry, revoke/logout semantics, and inactivity auto-logout. Define the timeout with the owner; current value is `UNKNOWN: requires owner confirmation`.

## Data Safety Audit

PIN and credential handling observed:

- Employee list and employee create/update responses return `id`, `display_name`, `role`, `is_active`, and `created_at`; they do not return `pin_code`, `pin_code_hash`, or `salt`.
- PIN login reads `pin_code`, `pin_code_hash`, and `salt` internally for verification, but returns only the public employee shape.
- Reset PIN writes `pin_code_hash` and `salt`, clears legacy `pin_code`, and does not return secret fields.
- CSV export uses an allowlisted field set and a blocked field set: `pin`, `pin_code`, `pin_code_hash`, `salt`, and `pin_salt`.
- Daily CSV fields are limited to report counts and totals.
- Ticket CSV fields are limited to ticket metadata and payment method.

Audit log caveat:

- The backend `log_event` helper stores arbitrary metadata and `GET /api/pos/audit-log` returns metadata as stored.
- Current audited metadata usage does not intentionally log PIN/hash/salt values.
- The frontend display sanitizes suspicious metadata keys before rendering.
- Backend audit-log sanitization is not centralized. Before real production, add a backend denylist/allowlist sanitizer in `log_event` and export/report paths.

## Database And Migration Readiness

Visible POS migration files, in order:

1. `001_initial_pos_schema.sql`
2. `002_create_products_table.sql`
3. `003_add_products_catalog_fields.sql`
4. `004_add_stock_tracking.sql`
5. `005_create_pos_employee.sql`
6. `006_harden_pos_employee.sql`
7. `007_create_pos_audit_log.sql`

No duplicate or obviously unsafe migration filenames were found in the visible `agents/ag_pos/migrations` directory.

Schema status endpoint audit:

- Runtime `/api/pos/schema/status` reports status `ok`.
- Runtime `tables_found` includes `pos_purchase_order` and `pos_purchase_order_item`.
- `expected_tables` in `get_schema_status()` does not include `pos_purchase_order` or `pos_purchase_order_item`.
- No visible migration file creates `pos_purchase_order` or `pos_purchase_order_item`, even though purchase order APIs depend on those tables.

Production blocker: add an explicit purchase order migration and update schema status expected tables before real production deployment. The current database has the tables, but the migration contract is incomplete.

## Must Fix Before Real Production

- Add real API authentication and authorization. Manager/admin actions must not be open network endpoints.
- Protect employee management, audit logs, CSV exports, purchase orders, inventory adjustment, and product administration by server-side role checks.
- Replace localStorage-only cashier persistence with server-issued session tokens or signed cookies.
- Add cashier session expiry and inactivity auto-logout; timeout value is `UNKNOWN: requires owner confirmation`.
- Add backend audit metadata sanitization so sensitive fields cannot be stored or returned by mistake.
- Add purchase order migration files and include purchase order tables in schema status expected tables.
- Add backup and restore proof for the POS database before any real production cutover.
- Define owner-approved approval thresholds for stock adjustment, void, refund, discount, and purchase order receiving. Current thresholds are `UNKNOWN: requires owner confirmation`.
- Ensure deployment is restricted to internal/admin networks until API auth is complete.

## Nice To Have After Demo

- Dedicated export endpoints for audit log and stock ledger, with strict field allowlists.
- Rate limiting for PIN login and manager override attempts.
- Central role policy table instead of role literals in application code.
- CSV export date range support with row limits.
- Better operator-visible session expiry warning.
- Automated migration drift check in CI.
- Read-only manager dashboard account for reports only.
- PDF report exports after CSV hardening is complete.

## Operational Readiness Checklist

Backup and restore:

- Take a database backup before demo data reset or deployment.
- Store backup path, timestamp, database name, and operator in the run log.
- Restore the backup into a non-production database.
- Run POS validation against the restored database before declaring backup valid.
- Keep raw exports and ad hoc CSV dumps out of git history.

Deployment:

- Confirm working tree is clean in parent and child repos.
- Commit and push `tHe_DuDe_Service` first when backend changes exist.
- Commit/update/push the parent repo after nested service commit is available remotely.
- Rebuild and recreate `ag_pos` after backend code changes because the Docker image copies `app/` at build time.
- Keep `.env` files unchanged and never print secrets.
- Keep `corporate_site` out of the POS deployment path.

Rollback:

- Record parent commit hash and `tHe_DuDe_Service` commit hash before deployment.
- Keep the previous `ag_pos` image or commit available.
- Roll back service first, then parent gitlink if needed.
- Restore database from the pre-deployment backup if migrations or data writes must be reversed.
- Run the smoke test checklist after rollback.

## Exact Validation Commands

From repository root:

```bash
git status --short
git -C tHe_DuDe_Service status --short
git -C tHe_DuDe_WebUI/dude_hawaiian_webui status --short
bash scripts/validate_pos_api.sh
```

From the internal WebUI directory:

```bash
cd /home/thegodseller/DuDe_Hawaiian/tHe_DuDe_WebUI/dude_hawaiian_webui
pnpm run build
```

Secret scan:

```bash
cd /home/thegodseller/DuDe_Hawaiian
grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude='*.svg' 'sk-[A-Za-z0-9_-]\{8,\}' \
  tHe_DuDe_WebUI/dude_hawaiian_webui \
  tHe_DuDe_Service/agents/ag_pos \
  scripts/validate_pos_api.sh \
  docs 2>/dev/null || true
```

## Exact Deployment Smoke Test Commands

Health and schema:

```bash
curl -fsS http://127.0.0.1:11116/health
curl -fsS http://127.0.0.1:11116/health/db
curl -fsS http://127.0.0.1:11116/api/pos/schema/status
```

CSV exports:

```bash
TODAY=$(date +%Y-%m-%d)
curl -fsSI "http://127.0.0.1:11116/api/pos/reports/daily/export.csv?date=$TODAY"
curl -fsSI "http://127.0.0.1:11116/api/pos/tickets/export.csv?date=$TODAY"
curl -fsS "http://127.0.0.1:11116/api/pos/reports/daily/export.csv?date=$TODAY" | head -n 2
curl -fsS "http://127.0.0.1:11116/api/pos/tickets/export.csv?date=$TODAY" | head -n 2
```

Full gate:

```bash
cd /home/thegodseller/DuDe_Hawaiian
bash scripts/validate_pos_api.sh
cd /home/thegodseller/DuDe_Hawaiian/tHe_DuDe_WebUI/dude_hawaiian_webui
pnpm run build
```

## Demo Close Decision

Season 1 demo close is acceptable only for an internal, controlled demo network after the validation commands pass.

Real production is blocked until API authentication, role enforcement, session expiry, backend audit sanitization, purchase order migrations, and backup/restore proof are completed.
