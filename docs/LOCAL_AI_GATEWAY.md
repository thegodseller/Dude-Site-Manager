# Local AI Gateway Architecture

Unified access to local LLMs for DuDe via LiteLLM and direct llama.cpp endpoints.

## Architecture
```text
[DuDe Agents (Docker)]
      |
      |--- (Chat) ----> [LiteLLM Gateway (Host:4000)]
      |                      |
      |                      +-- (18080) --> [Qwen3.5 0.8B]
      |                      +-- (18082) --> [Qwen2.5 1.5B]
      |                      +-- (18084) --> [Qwen2.5-Coder 3B]
      |
      |--- (Embed) ---> [Direct llama-server (Host:18086)]
                             |
                             +-- (18086) --> [Qwen3-Embedding 0.6B]
```

## Component Map
| Alias | Port | Backend Model | Responsibility |
| :--- | :--- | :--- | :--- |
| `dude-fast` | 18080 | Qwen3.5 0.8B | Intent detection, simple chat (via LiteLLM). |
| `dude-local` | 18082 | Qwen2.5 1.5B | General Thai reasoning, fallback (via LiteLLM). |
| `dude-code` | 18084 | Qwen2.5-Coder 3B | Technical analysis, scripting (via LiteLLM). |
| `dude-embed` | 18086 | Qwen3-Embedding 0.6B | RAG, Vector generation (Direct Endpoint). |

## Embedding Status
- **Default**: Qwen3-Embedding 0.6B (Direct llama-server on port 18086).
- **Candidate**: Nomic v2 MoE (Ollama). Evaluation is currently **BLOCKED** as the Ollama server is not running on this host.
- **Note**: LiteLLM /v1/embeddings route is currently bypassed due to request format mismatch; DuDe agents must use the direct host port for vector operations.

## Security
- LiteLLM is bound to `0.0.0.0` for container reachability. Do not expose port 4000 publicly.
- Model servers (1808x) remain bound to `127.0.0.1`.

## Security & Secret Hygiene (STRICT)
- **NEVER** run `cat .env` or equivalent commands that output raw values to the terminal or logs.
- **NEVER** commit real API keys, tokens, or secrets to the repository.
- **ALWAYS** use `scripts/print_env_keys_safe.sh` for inspecting environment configuration.
- **ALWAYS** redact values in any debugging output or documentation.
