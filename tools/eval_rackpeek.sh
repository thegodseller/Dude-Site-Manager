#!/usr/bin/env bash

set -euo pipefail

target_dir="tools/vendor/RackPeek"

if [[ ! -d "$target_dir/.git" ]]; then
  echo "FAIL: RackPeek repository is not available at $target_dir"
  echo "Run ./tools/install_rackpeek.sh first"
  exit 1
fi

echo "PASS: RackPeek repository found"
git -C "$target_dir" status --short
git -C "$target_dir" log --oneline -1
find "$target_dir" -maxdepth 2 -type f \( -iname "README*" -o -iname "docker-compose*.yml" -o -iname "package.json" -o -iname "pyproject.toml" -o -iname "go.mod" -o -iname "Cargo.toml" -o -iname "*.csproj" \) -print

readme_path="$(find "$target_dir" -maxdepth 2 -type f -iname "README*" | sort | head -n 1 || true)"
if [[ -n "$readme_path" ]]; then
  echo "PASS: showing README preview from $readme_path"
  sed -n '1,160p' "$readme_path"
else
  echo "WARN: no README file found under $target_dir"
fi
