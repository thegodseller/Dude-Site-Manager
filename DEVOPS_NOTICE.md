# 🛡️ DuDe Infrastructure & Routing Notice
**CRITICAL: READ THIS BEFORE MODIFYING WEBUI FILES**

## 🌐 Domain & Port Mapping
The infrastructure is split into two distinct layers serving different purposes. Do NOT mix their ports or entry points.

| Domain | Port | Purpose | Source Location |
|:---|:---|:---|:---|
| `thegodseller.com` | **15551** | **Corporate Website** (The Godseller) | `tHe_DuDe_WebUI/corporate_site/` |
| `dashboard.thegodseller.com` | **5173** | **DuDe Dashboard** (Nexus Control) | `tHe_DuDe_WebUI/dude_hawaiian_webui/` |
| `global-control.local` | **11118** | **DuDe Global Control Dashboard** | `tHe_DuDe_Service/dude_web_control/` |

## ⚠️ Critical Rules for AI Agents
1. The corporate static site lives in `tHe_DuDe_WebUI/corporate_site/`.
2. The corporate entry point is `tHe_DuDe_WebUI/corporate_site/index.html`.
3. The corporate static site is intended for port **15551**.
4. The React/Vite dashboard lives in `tHe_DuDe_WebUI/dude_hawaiian_webui/`.
5. `tHe_DuDe_WebUI/dude_hawaiian_webui/index.html` must remain the minimal Vite shell with:
   - `<div id="root"></div>`
   - `<script type="module" src="/src/main.tsx"></script>`
6. The dashboard dev server port is **5173**.
7. **DO NOT replace the dashboard `index.html` with the corporate landing page.**
8. **DO NOT mount the host user's full `~/.ssh` into containers.** Use dedicated deploy keys, SSH agent forwarding, or host-side sync instead.

## 🛠️ Recovery & Restart Commands
- **Start Corporate Site:**
  - `cd /home/thegodseller/DuDe_Hawaiian/tHe_DuDe_WebUI/corporate_site`
  - `npx serve -l 15551 .`
- **Start Dashboard:**
  - `cd /home/thegodseller/DuDe_Hawaiian/tHe_DuDe_WebUI/dude_hawaiian_webui`
  - `npm run dev`

## Nested Repo Push Rule:
- tHe_DuDe_Service is a gitlink/nested repository.
- Always commit and push tHe_DuDe_Service first.
- Then commit/update/push the parent repository.
- Never push parent gitlink commits that reference nested commits not available on the nested remote.

## 📦 External Dependencies
- **VisionLabel**: Local external checkout in `tHe_DuDe_Service/VisionLabel`.
  - See [docs/VISIONLABEL_LOCAL.md](docs/VISIONLABEL_LOCAL.md) for local fixes and architecture.

---
*Last updated: 2026-04-27 by Antigravity AI*
