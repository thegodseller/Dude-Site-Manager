#!/usr/bin/env bash
set -euo pipefail

# Operator-run smoke test for the local LiteLLM gateway.
# This requires Docker and already-running DuDe containers. It does not start,
# stop, build, or remove containers.

HOST_GATEWAY="${LITELLM_BASE_URL:-http://127.0.0.1:4000/v1}"
CONTAINER_GATEWAY="${LITELLM_CONTAINER_BASE_URL:-http://host.docker.internal:4000/v1}"
AG_BOSS_CONTAINER="${AG_BOSS_CONTAINER:-ag_boss}"
AG_NEGOTIATOR_CONTAINER="${AG_NEGOTIATOR_CONTAINER:-ag_negotiator}"
NEGOTIATOR_CHAT_URL="${NEGOTIATOR_CHAT_URL:-http://localhost:8000/api/chat}"

echo "--- DuDe LiteLLM Smoke Test ---"
echo "This script requires Docker and running DuDe containers."

echo -n "Host -> $HOST_GATEWAY: "
if curl -s -o /dev/null --max-time 5 "$HOST_GATEWAY"; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

echo -n "$AG_BOSS_CONTAINER -> $CONTAINER_GATEWAY: "
if docker exec "$AG_BOSS_CONTAINER" curl -s -o /dev/null --max-time 5 "$CONTAINER_GATEWAY"; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

echo "Testing ag_negotiator intent classification..."
RESP=$(docker exec "$AG_NEGOTIATOR_CONTAINER" curl -s -X POST "$NEGOTIATOR_CHAT_URL" \
    -d '{"message": "ขอรายงานประจำวัน", "user": "test_user"}' \
    -H "Content-Type: application/json")

if echo "$RESP" | grep -q "📊"; then
    echo "Classification PASS"
else
    echo "Classification FAIL: $RESP"
    exit 1
fi

echo "SMOKE TEST COMPLETED SUCCESSFULLY"
