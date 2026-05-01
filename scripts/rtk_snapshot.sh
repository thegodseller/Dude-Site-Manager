#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE="$ROOT/tHe_DuDe_Service"
WEBUI="$ROOT/tHe_DuDe_WebUI/dude_hawaiian_webui"
MISSIONRIDE="$SERVICE/customer_apps/ice_fac_aran/gps"

section() {
  printf '\n## %s\n' "$1"
}

branch_name() {
  local repo="$1"
  local branch
  branch="$(git -C "$repo" branch --show-current 2>/dev/null || true)"
  if [[ -n "$branch" ]]; then
    printf '%s\n' "$branch"
  else
    git -C "$repo" rev-parse --short HEAD 2>/dev/null || printf 'unavailable\n'
  fi
}

short_status() {
  local repo="$1"
  local output
  output="$(git -C "$repo" status --short 2>/dev/null | sed -n '1,80p')"
  if [[ -n "$output" ]]; then
    printf '%s\n' "$output"
  else
    printf 'clean\n'
  fi
}

path_status() {
  local repo="$1"
  local path="$2"
  local output
  output="$(git -C "$repo" status --short -- "$path" 2>/dev/null | sed -n '1,80p')"
  if [[ -n "$output" ]]; then
    printf '%s\n' "$output"
  else
    printf 'clean\n'
  fi
}

recent_commits() {
  local repo="$1"
  git -C "$repo" log --oneline -5 2>/dev/null || printf 'unavailable\n'
}

printf 'RTK snapshot: %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

section "Branches"
printf 'parent: %s\n' "$(branch_name "$ROOT")"
printf 'service: %s\n' "$(branch_name "$SERVICE")"
printf 'webui: %s\n' "$(branch_name "$WEBUI")"

section "Parent Status"
short_status "$ROOT"

section "Service Status"
short_status "$SERVICE"

section "WebUI Status"
path_status "$ROOT" "tHe_DuDe_WebUI/dude_hawaiian_webui"

section "Parent Recent Commits"
recent_commits "$ROOT"

section "Service Recent Commits"
recent_commits "$SERVICE"

section "MissionRide Files"
if [[ -d "$MISSIONRIDE" ]]; then
  find "$MISSIONRIDE" -maxdepth 4 \
    \( -path '*/__pycache__' -o -path '*/.venv' \) -prune -o \
    -type f -print \
    | sort \
    | sed "s#^$ROOT/##" \
    | sed -n '1,120p'
else
  printf 'MissionRide path not found: %s\n' "$MISSIONRIDE"
fi
