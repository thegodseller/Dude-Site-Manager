#!/usr/bin/env bash
set -euo pipefail

# Safely test LiteLLM gateway and agent connectivity from the host.
# Does not modify or restart containers.

LITELLM_BASE_URL="${LITELLM_BASE_URL:-http://127.0.0.1:4000/v1}"
NEGOTIATOR_CHAT_URL="${NEGOTIATOR_CHAT_URL:-http://127.0.0.1:11112/api/chat}"

# Prepare auth header if LITELLM_API_KEY is set
AUTH_HEADER=()
if [[ -n "${LITELLM_API_KEY:-}" ]]; then
    AUTH_HEADER=(-H "Authorization: Bearer $LITELLM_API_KEY")
fi

echo "--- DuDe LiteLLM Smoke Test (Safe Host-Side) ---"

# 1. Gateway Check
echo -n "Gateway Reachability ($LITELLM_BASE_URL): "
if curl -s -o /dev/null --max-time 5 "$LITELLM_BASE_URL/models" "${AUTH_HEADER[@]}"; then
    echo "PASS"
else
    echo "FAIL (Check if LiteLLM is running and API key is correct)"
    exit 1
fi

# 2. Agent -> Gateway Functional Check (Intent Classification)
# Tests if ag_negotiator (on host port 11112) can process a message via the LLM.
echo -n "ag_negotiator Intent Classification ($NEGOTIATOR_CHAT_URL): "
RESP=$(curl -s -X POST "$NEGOTIATOR_CHAT_URL" \
    -H "Content-Type: application/json" \
    -d '{"message": "ขอรายงานประจำวัน", "user": "smoke_tester"}')

if echo "$RESP" | grep -q "reply_message"; then
    echo "PASS"
else
    echo "FAIL: $RESP"
    exit 1
fi

echo "SMOKE TEST COMPLETED SUCCESSFULLY"
