# DuDe GPS MissionRide Reality Audit

> **Ticket:** DuDe-GPS-001
> **Date:** 2026-05-03
> **Machine:** Dell OptiPlex-3060
> **Baseline:** Parent repo clean, tHe_DuDe_Service clean, WebUI clean, tHe_DuDe_Service HEAD = `6f0a52b5c60ac6a1a52732cc44d5187d821abd73`
> **Scope:** Documentation/audit only. No runtime, corporate_site, WebUI, POS, .env, Docker/compose, DB, or Pi5 changes.

---

## 1. Executive Summary

MissionRide is marketed as a real-time driver mission-support and fleet-visibility system with foreground GPS, ETA updates, off-route/stopped-too-long alerts, and SOS escalation.

**Reality:**
- A **backend skeleton** exists (`tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/backend/`) with in-memory stubs, FastAPI-style routes, and a smoke-test script. It is **not wired into production**.
- **LINE** recognizes MissionRide intent and delivery-status keywords, but today it only queries the generic `dude_cases` table and returns a placeholder Flex card with static text.
- **No persistent GPS store, no real location intake, no live map backend, no ETA calculation, and no alert engine** are running.
- The corporate_site demos are **simulations / product vision only** and must not be treated as implementation truth.

This audit documents what exists, what is missing, and the safest next steps to close the gap without scope drift.

---

## 2. Existing Marketing / Product Assets Found

### 2.1 Corporate Site (Marketing Only)
- **File:** `tHe_DuDe_WebUI/corporate_site/index.html` (MissionRide section, lines 391–502)
- **File:** `tHe_DuDe_WebUI/corporate_site/demos/missionride.html` (interactive demo, 528 lines)
- **File:** `tHe_DuDe_WebUI/corporate_site/404.html` (link to demo)
- **File:** `tHe_DuDe_WebUI/corporate_site/sitemap.xml` (demo URL indexed)

These pages show:
- Schematic route maps with live vehicle position
- Stop-by-stop delivery progress and ETA updates
- Off-route detection and stopped-too-long alerts
- SOS emergency escalation to office command
- Driver score / mission scoring
- Battery-aware adaptive GPS (foreground-only claims)
- Fleet status cards (moving / stopped / SOS / idle / done)

> **Important:** The demo page (`demos/missionride.html`) is a **standalone simulation**. It defaults to deterministic demo data and does not consume real GPS events. The JavaScript includes a mock API call to `/api/missionride/office/vehicles` that falls back to simulation when the backend is unreachable.

### 2.2 Prototype Assets in Service Repo
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/prototypes/missionride_live_demo.html`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/prototypes/driver_app_wireframe.html`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/demo_notes.md`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/ux_notes.md`

These are design prototypes and demo notes, not production runtime code.

### 2.3 Planning Documents
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/README.md`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/backend/README.md`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/data_model.md`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/api_contract.md` (referenced, not inspected in detail)
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/privacy_policy_draft.md` (referenced)
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/battery_and_heat_strategy.md`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/android_driver_app_plan.md`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/office_dashboard_plan.md`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/play_store_strategy.md`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/gamification_plan.md`

---

## 3. What corporate_site Currently Claims or Shows

| Claim | Source | Evidence Type |
|-------|--------|---------------|
| Real-time driver route guidance, ETA visibility, safety escalation | `index.html` meta / OG tags | Marketing copy |
| Schematic route maps with live vehicle position | `index.html` lines 398, 405–411 | Screenshot / mockup |
| Stop-by-stop delivery progress and ETA updates | `index.html` lines 399, 357 | Screenshot / mockup |
| Off-route detection and stopped-too-long alerts | `index.html` lines 400, 418, 486 | Feature list + FAQ |
| SOS emergency escalation to office command | `index.html` lines 401, 418, 482 | Feature list + FAQ |
| Adaptive GPS modes, foreground-only, never background | `index.html` lines 423, 467, 478 | FAQ + privacy statement |
| Driver performance scoring (on-time, stops, problems) | `index.html` lines 428, 491 | Feature list + demo JS |
| Live fleet overview with on-time rate | `index.html` lines 413 | Screenshot / mockup |
| Battery-aware tracking | `index.html` lines 423 | Feature claim |
| Works on standard smartphones, no special hardware | `index.html` lines 474 | FAQ |

All of the above are **product vision / UX reference**. None of them are backed by a running production service today.

---

## 4. What Real Runtime / Backend / LINE Currently Supports

### 4.1 Backend Skeleton (`gps/backend/`)
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/backend/app/main.py`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/backend/app/routes.py`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/backend/app/storage.py`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/backend/app/schemas.py`
- **File:** `tHe_DuDe_Service/customer_apps/ice_fac_aran/gps/backend/scripts/smoke_test_missionride_api.sh`

**What it does:**
- Self-contained FastAPI app with in-memory dictionaries (`DRIVERS`, `VEHICLES`, `MISSIONS`, `TRIPS`, `LOCATION_EVENTS`, `SOS_EVENTS`, `DRIVER_EVENTS`).
- Stubbed endpoints:
  - `POST /api/missionride/auth/driver-login`
  - `GET /api/missionride/missions/today`
  - `POST /api/missionride/missions/{mission_id}/start`
  - `POST /api/missionride/locations` (batch upload)
  - `POST /api/missionride/sos`
  - `POST /api/missionride/missions/{mission_id}/stop` / `finish`
  - `GET /api/missionride/office/vehicles`
  - `GET /api/missionride/office/vehicles/{vehicle_id}/latest`
  - `GET /api/missionride/office/missions/active`
  - `GET /api/missionride/office/sos`
  - `GET /api/missionride/driver/mission/current`
  - `GET /api/missionride/office/routes/active`
  - `POST /api/missionride/driver/events`
- Validates required fields (lat/lng/accuracy/recorded_at) and rejects events for non-active missions.
- Route contract builder (`_build_route_contract`) returns `route_status`, `off_route`, `stopped_too_long`, `sos_active`, `eta_minutes`, `current_position`, `next_stop`, `stops`, and `planned_route`.
- Supports driver lifecycle events: `mission_started`, `arrived_stop`, `completed_stop`, `off_route`, `reroute_requested`, `stopped_too_long`, `sos_triggered`, `sos_acknowledged`, `mission_completed`.

**What it does NOT do:**
- No Postgres / no persistent storage.
- No production authentication or authorization.
- No Docker wiring, no service startup integration.
- No real ETA calculation (parses a static `HH:MM` string into minutes as a demo approximation).
- No geofence or off-route geometry calculation (route status is set manually via driver events).
- No stopped-too-long timer engine.
- No SOS escalation pipeline (records event in memory only).
- No retention policy enforcement.

### 4.2 LINE Integration (ag_boss / ag_negotiator)
- **File:** `tHe_DuDe_Service/agents/ag_boss/app/api/human_command.py`
- **File:** `tHe_DuDe_Service/agents/ag_boss/app/services/line_flex_status_cards.py`
- **File:** `tHe_DuDe_Service/agents/ag_boss/app/services/line_flex_welcome_menu.py`
- **File:** `tHe_DuDe_Service/agents/ag_boss/app/services/case_parser.py`
- **File:** `tHe_DuDe_Service/agents/ag_negotiator/app/main.py`

**What exists:**
- Quick-menu command `🚚 สถานะการจัดส่ง` maps to `build_delivery_status_flex()`.
- Command `สถานะ missionride` queries `case_service.get_stats(days_back=7, domain="MissionRide")`.
- Command `สถานะการจัดส่ง` does the same and returns a Flex card with case counts and urgent flags.
- `ag_negotiator` LLM prompt includes `MissionRide` as a classified intent.
- `case_parser.py` maps domain `"MissionRide"` to display `"ขนส่ง / MissionRide"`.
- `_handle_business_intent` returns a static reply: *"สำหรับ MissionRide สามารถติดตามเส้นทางขนส่ง และสถานะคนขับแบบเรียลไทม์ครับ"*.

**What it does NOT do:**
- Does not read from any GPS store.
- Does not ingest driver location shares from LINE.
- Does not compute ETA, off-route, or stopped-too-long status.
- The delivery Flex card footer contains a disabled placeholder button: `📍 GPS เร็ว ๆ นี้`.

### 4.3 WebUI Runtime (Read-Only Inspection)
- **File:** `tHe_DuDe_Service/dude_web_control/dude_hawaiian_webui/src/pages/DriverApp/DriverApp.jsx`
  - SOS modal exists but only calls `alert("SOS Signal Sent to HQ!")`; no GPS coordinate capture, no backend POST.
- **File:** `tHe_DuDe_WebUI/dude_hawaiian_webui/live_map.html`
  - Placeholder iframe `src="/gps-map/"` with a hardcoded "GPS Feed: Active" legend. No real data source.

### 4.4 Database
- **Cases table:** `agents/ag_boss/migrations/001_create_cases_table.sql` and `002_update_cases_schema.sql`
  - Stores generic `dude_cases` with `intent_name`, `status`, `metadata` JSONB.
  - MissionRide cases can be created and counted, but there is **no GPS-specific schema**.
- **No migrations** exist for `gps_driver`, `gps_vehicle`, `gps_mission`, `gps_location_event`, etc.
- **Data model draft** (`data_model.md`) is planning-only and explicitly states: *"Exact fields, indexes, retention policy, and relationships require owner and engineering confirmation before implementation."*

---

## 5. Gap Table: Marketing vs Runtime

| Marketing Claim | Runtime Reality | Gap Severity |
|-----------------|-----------------|--------------|
| Real-time live vehicle position on schematic map | Backend skeleton stores last location in memory; no persistent GPS store; no live WebSocket/stream | High |
| ETA updates | Skeleton parses a static `HH:MM` string; no real routing or traffic-aware ETA | High |
| Off-route detection | Route status is set manually by `driver/events` POST; no geometry/geofence calculation | High |
| Stopped-too-long alert | Route status set manually; no background timer or distance threshold engine | High |
| SOS emergency escalation | SOS event is stored in memory; no escalation pipeline (push, call, LINE alert to boss) | High |
| Driver performance scoring | Skeleton has `gps_score_event` draft model only; no scoring engine | Medium |
| Battery-aware adaptive GPS | Documented in strategy docs; not implemented in any running service | Medium |
| Foreground-only tracking, no background | Enforced by API rejection of finished-mission events, but no actual phone app exists | Medium |
| Fleet command dashboard | Prototype HTML only; no production dashboard wired to backend | Medium |
| LINE driver location share | Not implemented | High |
| LINE status cards with real GPS data | Flex card shows case counts only; GPS data is placeholder | High |

---

## 6. Existing LINE Pieces Related to MissionRide / Delivery

1. **Welcome Menu Button:** `🚚 สถานะการจัดส่ง` (`line_flex_welcome_menu.py`)
2. **Delivery Status Flex Card:** `build_delivery_status_flex()` (`line_flex_status_cards.py`)
   - Shows total / urgent case counts from `dude_cases`.
   - Footer contains `📍 GPS เร็ว ๆ นี้` placeholder button.
3. **Intent Classification:** `ag_negotiator` prompt includes `MissionRide` as a valid intent.
4. **Boss Command Handlers:**
   - `สถานะ missionride` → case stats
   - `สถานะการจัดส่ง` → case stats + Flex card
   - `missionride` keyword in free text → `override_intent = "MissionRide"` → creates a generic case via `case_parser`
5. **Static Business Intent Reply:** Returns a promise sentence about real-time tracking, but performs no GPS lookup.

---

## 7. Missing Backend Pieces

| Piece | Why It Matters | Current State |
|-------|----------------|---------------|
| **Driver location intake API** | Accept real lat/lng from driver phone or LINE | Skeleton endpoint exists (`POST /api/missionride/locations`) but is in-memory, unauthenticated, and unwired |
| **Mission / route object** | Define planned stops, sequence, and planned route geometry | Skeleton has hardcoded `ROUTE_DATA` for one demo mission; no CRUD for real missions |
| **GPS event storage** | Persist location events for audit, playback, and analytics | In-memory `LOCATION_EVENTS` list only; no Postgres table |
| **Live status calculation** | Determine moving/stopped/idle from GPS stream | Not implemented |
| **ETA calculation** | Compute estimated arrival based on distance, traffic, and remaining stops | Skeleton approximates `HH:MM` → minutes; no real engine |
| **Stopped-too-long alert** | Detect when vehicle is stationary beyond threshold | Status can be injected via `driver/events`; no automatic engine |
| **Off-route alert** | Detect deviation from planned path | Status can be injected via `driver/events`; no geometry engine |
| **SOS escalation** | Notify office/channel when SOS is triggered | Event recorded in memory; no push/alert pipeline |
| **Retention / privacy controls** | Auto-delete location events after mission end per policy | Not implemented; data model draft notes retention is `UNKNOWN: requires owner confirmation` |

---

## 8. Proposed Runtime Architecture

This is a **proposed** future architecture, not a commitment to build it all at once.

```
Driver Phone / LINE Mini App
│
├─ Foreground location capture (during active mission only)
├─ Batch upload to Location Intake API
└─ SOS trigger → SOS Intake API

         │
         ▼
   ┌─────────────────┐
   │ Location Intake │  (FastAPI / async handler)
   │   API (GPS)     │  - Validate mission active
   └─────────────────┘  - Write to GPS event store
         │
         ▼
   ┌─────────────────┐
   │  MissionRide    │  - Domain logic: mission lifecycle,
   │    Service      │    route contract, status calc,
   │   (ag_boss)     │    ETA, off-route, stopped-too-long
   └─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌─────────────┐
│dude_cases│ │ Future GPS  │
│  table   │ │   Store     │
│(metadata)│ │(location   │
│          │ │ events,     │
│          │ │ trips, sos) │
└────────┘ └─────────────┘
    │         │
    ▼         ▼
┌──────────────────────────┐
│  LINE Status Cards /     │
│  Dashboard / Live Map    │
│  (WebUI, later)          │
└──────────────────────────┘
```

### Component Notes
- **Driver phone / LINE location share:** Could be a LINE LIFF mini app or a simple web view that requests geolocation permission and batches uploads. Must be foreground-only.
- **ag_negotiator:** Classifies MissionRide intent; in future could route location-share messages to the intake API.
- **ag_boss:** Owns the case metadata (`dude_cases`) and business-intent replies. Should remain the orchestrator, not the geometry calculator.
- **MissionRide service/domain:** A dedicated module or microservice that owns route geometry, ETA, and alert rules. Can be a Python service sharing the same DB.
- **Case metadata:** Continue using `dude_cases` for human-readable incident/mission records, but do not store high-frequency GPS points in JSONB.
- **Future GPS store:** Postgres tables per `data_model.md` (or a simplified v1 subset) with strict retention.
- **LINE status cards:** Upgrade `build_delivery_status_flex()` to query the MissionRide service for real vehicle positions and ETAs.
- **Dashboard / live map:** Out of scope for v1; can consume the same route-contract API (`MissionRide-007`) later.

---

## 9. Privacy Rules (Current Policy + Gaps)

### Documented Rules (from existing READMEs and marketing)
1. **Collect location only during active mission.**
   - Skeleton API rejects events for finished missions.
2. **Do not track outside mission.**
   - Marketing claims: "foreground-only and active only during assigned missions."
3. **Clear consent/notice for driver.**
   - UX notes mention a constant system-status bar showing GPS active state.
   - Demo notice text: `ระบบจะส่งตำแหน่งเฉพาะระหว่างเริ่มภารกิจจนจบภารกิจ`
4. **Do not store location longer than necessary.**
   - `data_model.md` mentions retention but marks exact period `UNKNOWN: requires owner confirmation`.
5. **Owner/admin access only.**
   - No RBAC implementation exists yet.

### Gaps
- No automated retention purge.
- No audit log for location access.
- No explicit driver consent capture (e-signature or checkbox) in code.
- No data-export or deletion flow for driver location history.

---

## 10. MVP Roadmap (Proposed GPS Tickets)

| Ticket | Title | Scope | Depends On |
|--------|-------|-------|------------|
| **GPS-002** | Location Intake API | Wire skeleton `POST /api/missionride/locations` into production DB, add auth, batch validation, mission-gate. | Owner confirms schema subset |
| **GPS-003** | LINE Driver Location Share Flow | Build a lightweight LINE LIFF or web page that captures foreground GPS and POSTs to intake API; driver must start mission first. | GPS-002 |
| **GPS-004** | MissionRide Case Status from GPS | Upgrade `build_delivery_status_flex()` and boss handlers to read from the real GPS store instead of `dude_cases` counts only. | GPS-002 |
| **GPS-005** | Live Map / Dashboard Prototype | Build a minimal office page (or upgrade existing prototype) that polls the route-contract API and renders vehicle positions. | GPS-002, GPS-004 |
| **GPS-006** | Off-route and Stopped-too-long Alerts | Implement geometry/geofence check and stopwatch logic; emit alert events that boss can surface in LINE. | GPS-002 |
| **GPS-007** | SOS Escalation | Build escalation pipeline: SOS event → push notification / LINE alert to office group + case creation with high urgency. | GPS-002 |

> **Recommended next ticket:** **GPS-002 Location Intake API** because every other feature depends on having a real, persistent location stream.

---

## 11. Explicit Out of Scope

This audit and its creation **did not** and **must not** include:

- **corporate_site changes** — No edits to `tHe_DuDe_WebUI/corporate_site/`.
- **Runtime code changes** — No edits to `ag_boss`, `ag_negotiator`, backend skeleton, WebUI, or DriverApp.
- **DB schema changes** — No new migrations or SQL executed.
- **Docker / compose changes** — No edits to `docker-compose.yml` or Dockerfiles.
- **Environment file changes** — No `.env` edits.
- **POS changes** — No edits to `agents/ag_pos` or POS modules.
- **Pi5 watcher datasets** — No inspection or generation of watcher data.
- **Git commits** — This audit is delivered as an uncommitted document.

---

## Validation Checklist

- [x] Parent repo clean before audit.
- [x] `tHe_DuDe_Service` clean before audit.
- [x] `tHe_DuDe_WebUI/dude_hawaiian_webui` clean before audit.
- [x] Only new file created: `docs/DuDe_GPS_MissionRide_Reality_Audit.md`.
- [x] No corporate_site files modified.
- [x] No WebUI runtime code modified.
- [x] No tHe_DuDe_Service runtime code modified.
- [x] No `.env`, Docker/compose, DB schema/migration, POS, or Pi5 dataset changes.

---

## Files Inspected

### Parent Repo
- `AGENTS.md`
- `GEMINI.md`
- `CLAUDE.md`
- `scripts/rtk_snapshot.sh`

### tHe_DuDe_Service (Runtime / Backend / LINE)
- `customer_apps/ice_fac_aran/gps/README.md`
- `customer_apps/ice_fac_aran/gps/backend/README.md`
- `customer_apps/ice_fac_aran/gps/demo_notes.md`
- `customer_apps/ice_fac_aran/gps/data_model.md`
- `customer_apps/ice_fac_aran/gps/backend/app/main.py`
- `customer_apps/ice_fac_aran/gps/backend/app/routes.py`
- `customer_apps/ice_fac_aran/gps/backend/app/storage.py`
- `customer_apps/ice_fac_aran/gps/backend/app/schemas.py`
- `customer_apps/ice_fac_aran/gps/backend/scripts/smoke_test_missionride_api.sh`
- `agents/ag_boss/app/api/human_command.py`
- `agents/ag_boss/app/services/line_flex_status_cards.py`
- `agents/ag_boss/app/services/line_flex_welcome_menu.py`
- `agents/ag_boss/app/services/case_parser.py`
- `agents/ag_negotiator/app/main.py`
- `agents/ag_boss/migrations/001_create_cases_table.sql`
- `agents/ag_boss/migrations/002_update_cases_schema.sql`
- `dude_web_control/dude_hawaiian_webui/src/pages/DriverApp/DriverApp.jsx`

### tHe_DuDe_WebUI (WebUI)
- `dude_hawaiian_webui/live_map.html`

### corporate_site (Read-Only)
- `corporate_site/index.html` (MissionRide section)
- `corporate_site/demos/missionride.html`
- `corporate_site/404.html`
- `corporate_site/sitemap.xml`

---

## Risk Level

**R2 — easily reversed.** This change adds a single documentation file and does not modify any runtime code, configuration, or marketing assets.

---

## Assumptions Made

1. The backend skeleton in `gps/backend/` is the only production-relevant runtime code for MissionRide. No other hidden service or table was found during search.
2. `corporate_site` and `prototypes/` are marketing/UX reference only, as stated in project instructions.
3. The `dude_cases` table is the sole persistent store linked to MissionRide today, and it only holds generic case metadata.
4. No Pi5 watcher datasets are relevant to this audit.

---

*End of Audit — DuDe-GPS-001*
