#!/usr/bin/env bash

set -euo pipefail

# Stops and removes only the local RackPeek container.
if docker ps -a --format '{{.Names}}' | grep -Fxq rackpeek; then
  docker rm -f rackpeek >/dev/null
fi
