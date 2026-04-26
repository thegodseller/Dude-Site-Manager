# Ice Fac Aran Business Skill

## Purpose

Use this module for ice factory production and operations only.

## Rules

- Keep sensor, production, quality, and operational risks local to this folder.
- Reuse shared entities and shared workflows where applicable.
- Mark all unconfirmed production thresholds as `UNKNOWN: requires owner confirmation`.
- Treat owner and factory manager as confirmed approval actors for this module where LINE approval is referenced.
- Do not invent approval thresholds, escalation times, or HR policy details.

## Start Procedure

1. Read `README.md`.
2. Read `business_context.md`.
3. Read `workflows.md`, `data_model.md`, and `approval_flow.md`.
4. Read `iot_sensor_plan.md`, `production_gauge_vision.md`, and `risk_library.md` if the task touches those topics.
5. Read `reports.md` when the task affects monitoring, approvals, or department reporting.

## End Procedure

1. Update changed files.
2. Append `changelog.md`.
3. Leave unresolved operational questions explicit.
