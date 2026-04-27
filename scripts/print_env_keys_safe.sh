#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-}"

if [[ -z "$FILE" ]]; then
    echo "Usage: $0 <path-to-env-file>"
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "Error: File $FILE not found."
    exit 1
fi

echo "--- Safe Env Inspection: $FILE ---"
# Match keys (start of line followed by alphanumeric/underscore until =) and replace value with <redacted>
sed -E 's/^([A-Z0-9_]+)=.*/\1=<redacted>/' "$FILE" | grep -E "^[A-Z0-9_]+=<redacted>$"
