#!/usr/bin/env bash

set -euo pipefail

repo_url="https://github.com/Timmoth/RackPeek.git"
target_dir="tools/vendor/RackPeek"

mkdir -p "tools/vendor"

if [[ -d "$target_dir/.git" ]]; then
  echo "PASS: RackPeek repository already exists"
  git -C "$target_dir" pull --ff-only
else
  echo "PASS: cloning RackPeek repository into $target_dir"
  git clone "$repo_url" "$target_dir"
fi

git -C "$target_dir" log --oneline -1
ls -la "$target_dir"
find "$target_dir" -maxdepth 2 -type f \( -iname "README*" -o -iname "docker-compose*.yml" -o -iname "package.json" -o -iname "pyproject.toml" -o -iname "go.mod" -o -iname "Cargo.toml" -o -iname "*.csproj" \) -print
