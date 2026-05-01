# Gemini CLI Project Guidance

Use this file to save tokens and avoid broad repository scans.

## Project Layout

- Parent repo: `/home/thegodseller/DuDe_Hawaiian`
- Nested service repo: `tHe_DuDe_Service`
- WebUI app: `tHe_DuDe_WebUI/dude_hawaiian_webui`
- Corporate site: `tHe_DuDe_WebUI/corporate_site`
- MissionRide GPS work: `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/`

## Boundaries & Do-Not-Touch Rules

- `corporate_site` is a public marketing site. Do not touch it unless explicitly requested.
- POS Season 1 MVP is closed. Do not touch POS code unless explicitly requested.
- MissionRide is the current GPS mission-app work path.
- Generated Pi5 watcher datasets are ignored and must not be committed.
- Do not read or print `.env` files or secrets.
- Never use `git add .`. Stage exact files or exact directories requested by the task.

## Nested Repo Workflow

When changing files under `tHe_DuDe_Service`:

1. Commit inside `tHe_DuDe_Service` first.
2. Then commit the parent `tHe_DuDe_Service` gitlink in `DuDe_Hawaiian`.

## Validation Commands

```bash
git status --short
git -C tHe_DuDe_Service status --short
git -C tHe_DuDe_WebUI/dude_hawaiian_webui status --short
bash scripts/rtk_snapshot.sh
```

## Token-Saving Workflow

- Scout only: inspect only the files named by the task plus nearby entry points.
- Plan only: write a short plan without reading unrelated systems.
- Patch only: edit the smallest file set that satisfies the task.
- Validate only: run the named checks and summarize results.

## Standard Final Report Format

- Files inspected
- Files changed
- Validation result
- Risks
- Child commit hash, if any
- Parent commit hash, if any
- Confirmation that `corporate_site`, POS, and `.env` files were untouched
