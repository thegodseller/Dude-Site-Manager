# Local AI Gateway Architecture

Unified access to local LLMs for DuDe via LiteLLM and llama.cpp.

## Architecture
\`\`\`text
[DuDe Agents (Docker)]
      |
      | (http://host.docker.internal:4000)
      v
[LiteLLM Gateway (Host Venv - Bound to 0.0.0.0)]
      |
      +---- (18080) ----> [llama-server (Qwen3.5 0.8B)]
      +---- (18082) ----> [llama-server (Qwen2.5 1.5B)]
      +---- (18084) ----> [llama-server (Qwen2.5-Coder 3B)]
      +---- (18086) ----> [llama-server (Qwen3-Embedding 0.6B)]
\`\`\`

## Component Map
| Alias | Port | Backend Model | Responsibility |
| :--- | :--- | :--- | :--- |
| \`dude-fast\` | 18080 | Qwen3.5 0.8B | Intent detection, simple chat. |
| \`dude-local\` | 18082 | Qwen2.5 1.5B | General Thai reasoning, fallback. |
| \`dude-code\` | 18084 | Qwen2.5-Coder 3B | Scripting, debugging, technical analysis. |
| \`dude-embed\` | 18086 | Qwen3-Embedding 0.6B | RAG, Vector generation. |

## Security & Connectivity
- **Binding**: LiteLLM is bound to \`0.0.0.0\` to allow communication between the Docker bridge network and the host gateway.
- **Risk**: Port 4000 is open on all interfaces. **Do not expose port 4000 to the public internet.**
- **Network**: Ensure the machine is behind a firewall or restricted to local/private LAN.
- **API keys**: `dummy-local-key` is a non-secret local placeholder only. Do not commit real API keys.
- **Configuration**: Prefer setting `LITELLM_API_KEY` through local `.env` or shell environment.
- **Future Improvement**: Transition LiteLLM into the Docker Compose network to restrict access to internal containers only.

## Operations
- **Status**: \`~/dude-litellm/status-local-ai-stack.sh\`
- **Health Check**: \`~/dude-litellm/healthcheck-local-ai-stack.sh\`
- **Smoke Test**: \`scripts/smoke_test_litellm_gateway.sh\`
- **Benchmark**: \`scripts/benchmark_litellm_models.sh\`
