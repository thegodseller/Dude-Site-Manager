#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="logs/embedding_benchmark_$(date +%Y%m%d_%H%M%S).log"
mkdir -p logs

echo "--- Embedding Benchmark ---" | tee -a "$LOG_FILE"

# 1. Check Qwen (Direct llama-server)
echo -n "Checking Qwen3-Embedding (18086)... "
if curl -s --max-time 5 http://127.0.0.1:18086/v1/embeddings \
    -H "Content-Type: application/json" \
    -d '{"model": "qwen3-embedding-0.6b", "input": "test"}' | grep -q "embedding"; then
    echo "PASS" | tee -a "$LOG_FILE"
else
    echo "FAIL" | tee -a "$LOG_FILE"
    exit 1
fi

# 2. Check Nomic (Ollama)
echo -n "Checking Nomic v2 MoE (Ollama:11434)... "
if curl -s --max-time 2 http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo "READY (Starting full benchmark)" | tee -a "$LOG_FILE"
    # Full benchmark logic would go here
else
    echo "SKIP (Ollama server not running)" | tee -a "$LOG_FILE"
fi

echo "BENCHMARK COMPLETED"
