# VisionLabel Local Integration

This document describes the local integration and configuration of VisionLabel within the DuDe Hawaiian infrastructure.

## Overview
VisionLabel is a web-based image annotation tool integrated into the DuDe ecosystem as an external dependency.

- **Local Path**: `tHe_DuDe_Service/VisionLabel`
- **Remote**: [https://github.com/Sompote/VisionLabel.git](https://github.com/Sompote/VisionLabel.git)
- **Deployment**: Built and served via the parent Docker Compose (`tHe_DuDe_Compose/docker-compose.yml`) on port **11119**.

## Git Integration
VisionLabel is treated as a **local external checkout**. It is currently ignored by the `tHe_DuDe_Service` parent repository's version control. Any local changes made to VisionLabel must be managed within its own repository context.

## Local Healthcheck Fix (cf7cd42)
A critical local fix was applied to the `Dockerfile` to ensure the container correctly reports its health status in Alpine-based environments.

### The Problem
The original `HEALTHCHECK` command used `http://localhost:80`. In Alpine Linux, `wget` resolves `localhost` to the IPv6 loopback address (`::1`) first. Since Nginx was configured to listen only on IPv4 (`0.0.0.0:80`), `wget` would receive a "Connection refused" error, causing Docker to mark the container as `unhealthy` even though the service was functional.

### The Fix
The `HEALTHCHECK` command was updated to use the explicit IPv4 loopback address.

- **Commit**: `cf7cd42` (fix: use IPv4 localhost for Docker healthcheck)
- **Change**:
  ```dockerfile
  - CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1
  + CMD wget --quiet --tries=1 --spider http://127.0.0.1:80 || exit 1
  ```

## Maintenance & Rebuilding
- **Do Not Push**: Do not push local fixes to the external remote repository without explicit owner approval.
- **Port**: The application is accessible at `http://localhost:11119` on the host.
- **New Deployment**: If rebuilding the environment on a new machine:
  1. Clone the VisionLabel repository into `tHe_DuDe_Service/VisionLabel`.
  2. Verify if the healthcheck fix (`127.0.0.1:80`) is applied to the `Dockerfile`.
  3. Rebuild via `docker compose up -d --build visionlabel`.
