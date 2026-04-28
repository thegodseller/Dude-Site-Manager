#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "== Repository =="
echo "${ROOT_DIR}"
echo

echo "== Current Branch =="
git rev-parse --abbrev-ref HEAD
echo

echo "== Git Status (short) =="
git status --short
echo

echo "== Important Documents =="
DOCS=(
  "AGENTS.md"
  "docs/SOUL.md"
  "docs/DUDE_STANDARD.md"
  "docs/CURRENT_STATE.md"
  "docs/RUNBOOK.md"
  "docs/DECISIONS.md"
  "docs/TASKS.md"
  "docs/PROJECT_DIARY.md"
  "docs/DuDe-Architecture-Document.md"
  "nakarin_erp/SOURCE_OF_TRUTH.md"
)

for doc in "${DOCS[@]}"; do
  if [[ -f "${doc}" ]]; then
    echo "-- ${doc}"
    head -n 6 "${doc}"
  else
    echo "-- ${doc} (missing)"
  fi
  echo
done

echo "== Top-Level Tree (depth 2) =="
find . -mindepth 1 -maxdepth 2 \
  \( -type d \( -name ".git" -o -name "node_modules" -o -name ".venv" -o -name "__pycache__" \) -prune \) \
  -o -print \
  | sed 's|^\./||' \
  | sed '/^$/d' \
  | head -n 80
