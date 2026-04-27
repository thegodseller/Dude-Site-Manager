#!/usr/bin/env bash
set -euo pipefail

# Local LiteLLM benchmark helper.
# This script calls only the configured LiteLLM endpoint. It does not start
# services, stop services, or run Docker.

GATEWAY="${LITELLM_BASE_URL:-http://127.0.0.1:4000/v1}"

curl_headers=(-H "Content-Type: application/json")
if [[ -n "${LITELLM_API_KEY:-}" ]]; then
    curl_headers+=(-H "Authorization: Bearer ${LITELLM_API_KEY}")
fi

run_bench() {
    local alias=$1
    local type=$2
    echo "Benchmarking $alias..."

    local start
    start=$(date +%s%N)
    local resp
    if [[ "$type" == "chat" ]]; then
        resp=$(curl -s "$GATEWAY/chat/completions" \
            "${curl_headers[@]}" \
            -d "{ \"model\": \"$alias\", \"messages\": [{\"role\": \"user\", \"content\": \"Explain RAG in one sentence Thai.\"}], \"max_tokens\": 100 }")
    else
        resp=$(curl -s "$GATEWAY/embeddings" \
            "${curl_headers[@]}" \
            -d "{ \"model\": \"$alias\", \"input\": \"DuDe Factory\" }")
    fi
    local end
    end=$(date +%s%N)
    local diff=$(( (end - start) / 1000000 ))

    if [[ "$type" == "chat" ]]; then
        local content
        local tokens
        local think
        content=$(echo "$resp" | jq -r '.choices[0].message.content')
        tokens=$(echo "$resp" | jq -r '.usage.total_tokens // 0')
        think=$(echo "$content" | grep -c "<think>" || true)
        printf "| %-15s | %-6sms | %-6s tokens | reasoning=%s | content=%s... |\n" \
            "$alias" "$diff" "$tokens" "$think" "${content:0:20}"
    else
        local dim
        dim=$(echo "$resp" | jq -r '.data[0].embedding | length')
        printf "| %-15s | %-6sms | dim=%-10s | status=OK |\n" \
            "$alias" "$diff" "$dim"
    fi
}

echo "| MODEL           | LATENCY | DETAILS                      | STATUS       |"
echo "|-----------------|---------|------------------------------|--------------|"
run_bench "${DUDE_FAST_MODEL:-dude-fast}" "chat"
run_bench "${DUDE_LOCAL_MODEL:-dude-local}" "chat"
run_bench "${DUDE_CODE_MODEL:-dude-code}" "chat"
run_bench "${DUDE_EMBED_MODEL:-dude-embed}" "embed"
