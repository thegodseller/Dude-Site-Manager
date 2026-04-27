# LiteLLM & Model Fallback Policy

## Routing Strategy
1. **Chat/Completions**: Always use LiteLLM Gateway (`host.docker.internal:4000`).
2. **Embeddings**: Always use the direct `llama-server` endpoint (`host.docker.internal:18086`).
3. **Nomic Evaluation**: Evaluation is pending. Do not switch or mix vectors until Nomic top-1 accuracy is verified.

## Fallback Logic
- `dude-fast` (LiteLLM) -> fallback to `dude-local` (LiteLLM) on failure or reasoning leak.
- Embedding fallback is not configured; if port 18086 is down, RAG operations will fail.
