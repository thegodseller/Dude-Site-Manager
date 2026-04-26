#!/usr/bin/env bash

set -euo pipefail

if command -v magika >/dev/null 2>&1; then
  echo "PASS: magika is already installed"
  magika --version
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "FAIL: python3 is required but not found"
  exit 1
fi

if ! command -v pipx >/dev/null 2>&1; then
  echo "FAIL: pipx is not installed"
  echo "Install pipx first with:"
  echo "python3 -m pip install --user pipx"
  echo "python3 -m pipx ensurepath"
  exit 1
fi

echo "PASS: pipx detected"
echo "Installing magika with pipx"
pipx install magika
magika --version
