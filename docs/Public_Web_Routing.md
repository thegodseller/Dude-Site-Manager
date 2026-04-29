# Public Web Routing & Recovery Documentation

This document outlines the public-facing web routing configuration for `thegodseller.com` and its subdomains following the 502 error recovery.

## 1. Primary Site Routing
The main traffic flow utilizes **Cloudflare Tunnel** to securely route external requests to the local host.

| Hostname | Target (Internal) | Purpose |
| :--- | :--- | :--- |
| `thegodseller.com` | `localhost:80` | Main Corporate Site |
| `www.thegodseller.com` | `localhost:80` | Main Corporate Site (www alias) |
| `liff.thegodseller.com` | `localhost:80` | Temporary Routing (LIFF Apps) |
| `line.thegodseller.com` | `localhost:11112` | ag_negotiator (Line Webhook) |
| `dashboard.thegodseller.com` | `localhost:5173` | Vite Development Dashboard |
| `control.thegodseller.com` | `localhost:11118` | Aegis Control Dashboard (if configured) |

## 2. Nginx Configuration
The local Nginx instance serves the static corporate site and acts as a reverse proxy for certain services.

- **Corporate Site Root**: `/home/thegodseller/DuDe_Hawaiian/tHe_DuDe_WebUI/corporate_site`
- **Config Files (Touched during recovery)**:
    - `/etc/nginx/sites-available/thegodseller.com`: Active site configuration.
    - `/etc/nginx/conf.d/thegodseller.conf`: **DISABLED** (avoiding duplicate port 80 conflicts).

## 3. Infrastructure Notes
- **Cloudflare Config**: `/home/thegodseller/.cloudflared/config.yml`
- **Deprecated Ports**: Port **15551** is deprecated/dead and must not be used for new services.

## 4. Validation Commands
Use these commands to verify the integrity of the routing:

```bash
# Verify main site connectivity
curl -I https://thegodseller.com
curl -I https://www.thegodseller.com

# Verify LIFF subdomain
curl -I https://liff.thegodseller.com

# Verify Line Negotiator health
curl -sS https://line.thegodseller.com/health
```

---
**Status**: Stable (Recovered from 502)
**Date**: 2026-04-30
