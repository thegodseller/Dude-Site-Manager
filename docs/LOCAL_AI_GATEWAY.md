# Local AI Gateway Architecture

DuDe can optionally use LiteLLM as an OpenAI-compatible gateway to local models.
This path is enabled only when services receive `LITELLM_BASE_URL`.

## Example Architecture

```text
[DuDe agents running in Docker]
      |
      | http://host.docker.internal:4000/v1
      v
[LiteLLM gateway on Docker host]
      |
      +---- 18080 ----> llama-server example: fast model
      +---- 18082 ----> llama-server example: local chat model
      +---- 18084 ----> llama-server example: code model
      +---- 18086 ----> llama-server example: embedding model
```

The ports and model names above are local examples, not project requirements.
Keep them aligned with the operator's LiteLLM configuration.

## Example Component Map

| Alias | Example Port | Responsibility |
| :--- | :--- | :--- |
| `dude-fast` | 18080 | Intent detection and simple replies. |
| `dude-local` | 18082 | General Thai reasoning and fallback. |
| `dude-code` | 18084 | Scripting, debugging, and technical analysis. |
| `dude-embed` | 18086 | RAG and vector generation. |

## Operations

Local host-side tooling may live outside this repository, for example under a
user-managed `~/dude-litellm/` directory. Treat that path as an operator example,
not a repository dependency.

Repository helpers:

- Smoke test: `scripts/smoke_test_litellm_gateway.sh`
- Benchmark: `scripts/benchmark_litellm_models.sh`

The smoke test requires Docker and running DuDe containers. The benchmark calls
only the configured local LiteLLM endpoint.

## Linux Container Access

When a container calls `http://host.docker.internal:4000/v1` on Linux, that
specific compose service needs:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Do not add host gateway access to services that do not call LiteLLM.

## Secret Handling

Do not commit real API keys. Use environment variables or local secret
management. `dummy-local-key` is acceptable only as a documented local
placeholder for development gateways that require a non-empty value.
