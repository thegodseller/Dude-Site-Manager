# Room Service Business Skill

## Purpose

Use this module for Android TV and in-room room service operations only.

## Rules

- Keep guest-facing service flows local here.
- Separate Android TV behavior from hotel operations only when it changes business meaning.
- Mark all unconfirmed guest workflow details as `UNKNOWN: requires owner confirmation`.

## Start Procedure

1. Read `README.md`.
2. Read `business_context.md`.
3. Read `android_tv_flow.md` and `room_service_flow.md`.
4. Read `workflows.md`, `data_model.md`, `approval_flow.md`, and `reports.md`.

## End Procedure

1. Update impacted files.
2. Append `changelog.md`.
3. Leave open guest-operation questions explicit.
