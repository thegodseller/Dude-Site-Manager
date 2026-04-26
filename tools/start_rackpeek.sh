#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
config_dir="$repo_root/ops/rackpeek/config"

mkdir -p "$config_dir"
chmod 777 "$config_dir"

if [[ -f "$config_dir/config.yaml" ]]; then
  chmod 666 "$config_dir/config.yaml"
fi

if docker ps -a --format '{{.Names}}' | grep -Fxq rackpeek; then
  docker rm -f rackpeek >/dev/null
fi

docker run -d \
  --name rackpeek \
  -p 127.0.0.1:18081:8080 \
  -v "$config_dir:/app/config" \
  aptacode/rackpeek:latest >/dev/null

printf 'RackPeek Web UI: http://127.0.0.1:18081\n'
printf 'Port 18080 remains reserved for local llama-server.\n'
