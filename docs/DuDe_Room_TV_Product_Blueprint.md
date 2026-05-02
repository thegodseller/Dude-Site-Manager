# DuDe Room TV Product Blueprint

**Mission:** DuDe-TV-000  
**Type:** Product Blueprint / Documentation Only  
**Last Updated:** 2026-05-02

---

## 1. Product Overview

DuDe Room TV is the in-room entertainment and service hub for guests at Le Blocs Resort properties.

- **Target device:** Android TV box installed in each guest room.
- **Main app:** DuDe Room TV App runs as a launcher-like experience.
- **Guest phone:** Becomes a TV remote and service request portal after scanning an on-screen QR code.
- **Core promise:** No app store download required for the guest. One QR scan = remote + room service menu.

**Target properties (owner-provided):**

| Property | Room Type | Price / Night | Max Guests | Breakfast | Parking | Check-in/out |
|---|---|---|---|---|---|---|
| Le Blocs Resort โรงเกลือ | ห้องสแตนดาด | 550 บาท | 2 คน | ไม่มีอาหารเช้า | มีที่จอดรถ | 12.00 เที่ยงวัน |
| Le Blocs Resort บ้านน้อย | ห้องสแตนดาด | 450 บาท | 2 คน | ไม่มีอาหารเช้า | มีที่จอดรถ | 12.00 เที่ยงวัน |

**Selling points — โรงเกลือ:**
- ใกล้ตลาดโรงเกลือ
- ใกล้เขมร
- ใกล้จุดผ่านแดน

**Selling points — บ้านน้อย:**
- ใกล้สถานีตำรวจ
- ใกล้โรงพยาบาล
- ใกล้ตลาด

> **Business rule:** Room availability still requires staff confirmation. Do not display fake availability or auto-confirm bookings.

---

## 2. Guest Journey

1. **Enter room** — Guest sees TV showing the DuDe Room TV home screen with a welcome message and a QR code.
2. **Scan QR** — Guest opens phone camera / LINE / any QR scanner and scans the code.
3. **Load web app** — Phone loads a lightweight mobile web page (no app store download).
4. **Pair** — The page pairs the phone to the room TV via a short-lived pairing token.
5. **Use remote** — Phone screen shows directional pad (up/down/left/right), OK, back, home, volume, channel.
6. **Request service** — Phone shows a guest service menu (food, housekeeping, laundry, maintenance, transport, front desk, checkout).
7. **Staff receives request** — The request becomes a DuDe case or LINE message routed to the appropriate staff role.
8. **Checkout** — Guest can request checkout from the phone or TV. Room data reset is triggered after staff confirms checkout.

---

## 3. TV Home Screen Concept

The TV home screen is the first thing the guest sees. It must be readable from 3 meters on a 32–55 inch TV.

**Layout (conceptual):**

```
+--------------------------------------------------+
|  Le Blocs Resort โรงเกลือ    ห้อง 101            |
|  ยินดีต้อนรับคุณ [ชื่อแขก]                       |
+--------------------------------------------------+
|                                                    |
|           [  สแกน QR ด้วยมือถือ  ]                |
|           [  (QR code ขนาดใหญ่)  ]                |
|                                                    |
+--------------------------------------------------+
|  [นำทาง]  [สถานที่ใกล้เคียง]  [บริการห้องพัก]      |
|  [ช่องทีวี]  [แอปสตรีมมิ่ง]  [เบราว์เซอร์]        |
+--------------------------------------------------+
|  [Settings] [Front Desk] [Checkout]               |
+--------------------------------------------------+
```

**Design constraints:**
- Large fonts (min 24sp TV scale).
- High contrast for living-room lighting.
- Focus-visible navigation for D-pad / remote.
- QR code must be large enough for reliable scanning from 2 meters.
- Clock and weather widget (optional MVP).

---

## 4. QR Mobile Remote Flow

**Pairing flow:**

```
TV (Android TV Box)                          Guest Phone
    |                                              |
    |-- 1. Display QR containing:                  |
    |      room_id, pairing_token,                 |
    |      mobile_remote_url                       |
    |------------------------------------------->  |
    |                                              |
    |<-- 2. Phone opens web page ------------------|
    |                                              |
    |-- 3. Phone POST /pair {token, phone_id} ---->|
    |                                              |
    |<-- 4. Backend returns session_id ------------|
    |                                              |
    |-- 5. Phone shows remote UI ----------------->|
    |                                              |
    |<-- 6. Phone WS/POST remote commands -------->|
    |    (up, down, left, right, ok, back,         |
    |     home, vol+, vol-, ch+, ch-)              |
```

**QR payload (conceptual, not final implementation):**
```json
{
  "r": "leblocs-rongkluea-101",
  "t": "a1b2c3d4",
  "u": "https://dude.example.com/remote"
}
```

**Security rules:**
- Pairing token expires after 15 minutes or first successful pair.
- Session expires after 24 hours of inactivity or at checkout.
- No guest-to-guest command leakage: commands are scoped to `room_id`.
- HTTPS only for mobile remote URL.

---

## 5. Guest Service Menu

The phone web app provides a service menu that sends requests to DuDe backend / LINE staff.

**Menu items:**

| Menu | Action | DuDu routing |
|---|---|---|
| สั่งอาหาร / ข้าว | Food order | Case: RoomService → Kitchen/FrontDesk |
| แม่บ้าน / ทำความสะอาด | Housekeeping request | Case: Housekeeping |
| ซักรีด | Laundry request | Case: Housekeeping |
| แจ้งซ่อม | Maintenance request | Case: Maintenance |
| รถ / มอเตอร์ไซค์ / แท็กซี่ | Transport request | Case: Logistics |
| ติดต่อแผนกต้อนรับ | Front desk message | Case: FrontDesk or LINE direct |
| เช็คเอาท์ | Checkout request | Case: FrontDesk |
| คู่มือท้องถิ่น | Static local guide | Read-only content |

**Each request form collects (minimal):**
- Room number (auto-filled from pairing).
- Request type (auto-filled from menu).
- Optional detail text (e.g., "ขอผ้าเช็ดตัวเพิ่ม").
- Optional urgency (normal / urgent).

**Do not collect:**
- Guest passwords for any streaming service.
- Detailed browser history.
- Payment card details on the TV or phone remote.

---

## 6. Android TV App Architecture

**Tech stack (MVP target):**

| Layer | Technology |
|---|---|
| Platform | Android TV (API 24+, leanback or Compose for TV) |
| Language | Kotlin |
| Launcher mode | Single-task, home-intent capable (future) |
| Networking | OkHttp + Retrofit |
| QR generation | ZXing or QRCode Kotlin library |
| Player main | Media3 ExoPlayer |
| Player fallback | VLC Android (debug / unsupported format fallback) |
| Web view | Android WebView (guest browser mode) |
| State / config | SharedPreferences + remote config API |

**Modules (future implementation):**

```
app/
  tv/
    homescreen/      -- TV UI, focus navigation, QR display
    player/          -- ExoPlayer wrapper, playlist, channel grid
    browser/         -- Guest browser wrapper, restricted mode
    settings/        -- Admin / staff settings (PIN protected)
  remote/
    pairing/         -- QR token generation, session lifecycle
    command/         -- Receive remote commands from phone
  service/
    api/             -- Retrofit interfaces to DuDe backend
    cases/           -- Submit service requests as DuDe cases
```

**Room identity:**
- Each TV box must know its `site_key` and `room_number`.
- Configurable via staff settings screen (PIN protected) or OTA config push.
- Example: `site_key = "leblocs-rongkluea"`, `room_number = "101"`.

---

## 7. Player Decision

**Primary player: Media3 ExoPlayer**
- Used for all in-app video playback (free TV streams, promotional videos, local media).
- Supports DASH, HLS, SmoothStreaming, progressive download.
- Hardware acceleration preferred.

**Fallback player: VLC Android**
- Used only when ExoPlayer cannot handle a container/codec.
- Debug builds may expose VLC for troubleshooting.
- Not exposed to guests by default.

**Streaming services:**
- Netflix, TrueID / TrueVisions, YouTube are launched as **official Android TV apps** via intent.
- Do not embed or proxy their content.
- Do not collect their login credentials.
- The TV home screen shows shortcut tiles that launch the official apps.

**Free TV channels:**
- Target channels: **3, 5, 7, 9**.
- MVP: official app shortcuts or legal web shortcuts.
- Later: integrate legal streams into ExoPlayer with proper licensing.
- Do not use unlicensed / pirated streams.

---

## 8. Privacy and Consent Rules

**May collect (with clear guest consent):**
- Guest name
- Phone number
- LINE userId (if paired via LINE scan)

**Must NOT collect:**
- Netflix / TrueID / any streaming service passwords.
- Detailed browser history.
- Payment card details on TV or remote.
- Biometric data.
- Precise location from phone GPS (room-level is sufficient).

**Data retention:**
- Service request data is retained only for operational follow-up and case history.
- After checkout, personal identifiers (name, phone, LINE userId) are cleared during room reset.
- Aggregated, anonymized statistics may be retained for business reporting.

**Consent model:**
- First QR scan shows a one-line consent checkbox: "ยินยอมให้ระบบบันทึกชื่อและเบอร์โทรเพื่อติดต่อกลับ".
- If declined, service requests still work but are anonymous (room-number only).

---

## 9. Room Reset After Checkout Concept

**Goal:** When a guest checks out, the room must be sanitized digitally so the next guest starts fresh.

**Reset actions:**

| Category | Action |
|---|---|
| Pairing | Invalidate all active phone pairings and sessions for the room. |
| Guest data | Clear guest name, phone, LINE userId from local storage and backend session. |
| Browser | Clear WebView cache, cookies, localStorage, and history. |
| Apps | Do NOT clear installed apps (Netflix, TrueID, YouTube). Only clear their **guest sessions** if the app supports it. |
| TV state | Reset home screen welcome message. Reset volume to default. |
| Cases | Do NOT delete historical DuDe cases. Cases remain for audit. |
| QR | Regenerate a new pairing token so the old QR is useless. |

**Trigger:**
- Staff confirms checkout in DuDe backend or LINE command.
- Backend sends a `POST /room/reset` or MQTT message to the TV box.
- TV box executes reset locally and acknowledges.

---

## 10. API Contract Draft (Room TV <> Mobile Remote <> DuDe Backend)

This section documents the future API contract. No runtime code is created yet.

### 10.1 Pairing

**`POST /api/room/pair`**
```json
{
  "room_id": "leblocs-rongkluea-101",
  "token": "a1b2c3d4",
  "phone_id": "uuid-or-line-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "sess_abc123",
  "room": {
    "site_key": "leblocs-rongkluea",
    "site_name": "Le Blocs Resort โรงเกลือ",
    "room_number": "101"
  },
  "expires_at": "2026-05-03T23:59:59+07:00"
}
```

### 10.2 Remote Command

**`POST /api/room/command`** (or WebSocket)
```json
{
  "session_id": "sess_abc123",
  "command": "ok",
  "payload": {}
}
```

**Allowed commands:** `up`, `down`, `left`, `right`, `ok`, `back`, `home`, `vol_up`, `vol_down`, `ch_up`, `ch_down`, `mute`.

**TV delivery:** Backend forwards command to the TV box via WebSocket / MQTT / long-polling endpoint.

### 10.3 Service Request

**`POST /api/room/service_request`**
```json
{
  "session_id": "sess_abc123",
  "room_id": "leblocs-rongkluea-101",
  "request_type": "housekeeping",
  "detail": "ขอผ้าเช็ดตัวเพิ่ม",
  "urgency": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "case_id": 123,
  "message": "ส่งคำขอไปยังแม่บ้านแล้ว"
}
```

**Backend behavior:** Create a DuDe case with:
- `intent_name`: `RoomService`, `Housekeeping`, `Maintenance`, `Logistics`, or `FrontDesk`
- `metadata`: `room_id`, `request_type`, `detail`, `urgency`
- `sender_ref`: derived from `phone_id` or `session_id`

### 10.4 Room Reset

**`POST /api/room/reset`** (staff only)
```json
{
  "room_id": "leblocs-rongkluea-101",
  "confirmed_by": "staff_id"
}
```

**Response:**
```json
{
  "success": true,
  "reset_actions": ["pairing_cleared", "guest_data_cleared", "browser_cleared", "qr_regenerated"]
}
```

### 10.5 Room Config

**`GET /api/room/config?room_id=...`**
```json
{
  "room_id": "leblocs-rongkluea-101",
  "site_key": "leblocs-rongkluea",
  "site_name": "Le Blocs Resort โรงเกลือ",
  "room_number": "101",
  "welcome_message": "ยินดีต้อนรับสู่ Le Blocs Resort โรงเกลือ",
  "services_enabled": ["food", "housekeeping", "laundry", "maintenance", "transport", "checkout"],
  "streaming_apps": ["netflix", "trueid", "youtube"],
  "free_tv_channels": [3, 5, 7, 9]
}
```

---


## IPTV Source Research Policy

The following repositories may be used only as research/reference inputs:

- `iptv-org/iptv`
- `akkradet/IPTV-THAI`
- `Free-TV/IPTV`
- `wadekarg/Gazibo-TV`
- `hanzoblackninja/IPTV-THAI`
- `4gray/iptvnator`
- `HerbertHe/iptv-sources`
- `iptv-org/awesome-iptv`
- `Guovin/iptv-api`
- `fanmingming/live`
- `imDazui/Tvlist-awesome-m3u-m3u8`
- `lizongying/my-tv`

Production rules:

- Use Media3 ExoPlayer only for legal, verified streams.
- Use VLC only as fallback/debug.
- Add stream health-check and blocklist concept.

Future admin workflow:

1. Import candidate source.
2. Normalize channel metadata.
3. Run stream health check.
4. Review legal/commercial-use status.
5. Request owner approval.
6. Publish approved channels to the room channel catalog.
7. Monitor broken streams and block failed or unsafe sources.


## 11. MVP Roadmap

| Phase | Code | Scope | Status |
|---|---|---|---|
| TV-001 | Home screen prototype | TV UI layout, focus navigation, placeholder tiles | Planned |
| TV-002 | Room identity config | Store/load `site_key` + `room_number`; admin settings screen | Planned |
| TV-003 | QR pairing | Generate QR, handle scan, create session, display paired state | Planned |
| TV-004 | Mobile remote | Phone web remote UI; send commands; TV receives and acts | Planned |
| TV-005 | Service request -> DuDu/LINE case | Phone service menu; submit to backend; create DuDe case | Planned |
| TV-006 | Official app launch shortcuts | Netflix, TrueID, YouTube intent launchers on TV home | Planned |
| TV-007 | Guest browser + reset | Restricted WebView; checkout-triggered reset logic | Planned |
| TV-008 | Free TV channel screen | Grid UI for channels 3, 5, 7, 9; legal source integration | Planned |
| TV-009 | Admin room config | Staff PIN-protected settings; OTA config endpoint | Planned |
| TV-010 | OTA / remote maintenance | Silent app update, remote restart, health ping | Planned |

** sequencing notes:**
- TV-001 through TV-004 form the "remote + home screen" MVP.
- TV-005 connects to the existing DuDe case system (`agents/ag_boss`).
- TV-007 room reset depends on checkout confirmation from staff; can be manual in MVP.
- TV-008 free TV is post-MVP because legal stream integration requires source verification.

---

## 12. Explicit Out-of-Scope

The following are **not** part of this blueprint or current mission:

- **No real Android app yet** — No Kotlin source files, no Gradle project, no APK build.
- **No ExoPlayer integration yet** — Architecture decision documented only.
- **No EasySlip** — Payment verification stays in the LINE flow; Room TV does not handle payments.
- **No payment automation** — No card storage, no auto-billing, no wallet integration.
- **No Docker / compose changes** — TV app is an Android APK; no server container changes.
- **No .env changes** — No new environment variables for TV.
- **No DB schema changes** — TV uses existing DuDe case APIs; no new migrations.
- **No corporate_site changes** — Public marketing site is untouched.
- **No POS changes** — POS Season 1 MVP is closed.
- **No Pi5 watcher dataset changes** — Vision data is untouched.
- **No WebUI runtime code changes** — TV is a separate Android client; existing WebUI is untouched.
- **No invented room data** — Prices, room types, breakfast, parking, and check-in/out times are owner-provided only.

---

## Appendix: Owner-Provided Room Catalog (Source of Truth)

### Le Blocs Resort โรงเกลือ
- Room type: ห้องสแตนดาด
- Price: 550 บาท / คืน
- Max guests: 2 คน
- Breakfast: ไม่มีอาหารเช้า
- Parking: มีที่จอดรถ
- Check-in/out: 12.00 เที่ยงวัน
- Selling points: ใกล้ตลาดโรงเกลือ, ใกล้เขมร, ใกล้จุดผ่านแดน

### Le Blocs Resort บ้านน้อย
- Room type: ห้องสแตนดาด
- Price: 450 บาท / คืน
- Max guests: 2 คน
- Breakfast: ไม่มีอาหารเช้า
- Parking: มีที่จอดรถ
- Check-in/out: 12.00 เที่ยงวัน
- Selling points: ใกล้สถานีตำรวจ, ใกล้โรงพยาบาล, ใกล้ตลาด

> **Rule:** If implementation needs separate check-in and checkout fields, preserve the owner-provided phrase "Check-in/out: 12.00 เที่ยงวัน". Do not guess separate times.
