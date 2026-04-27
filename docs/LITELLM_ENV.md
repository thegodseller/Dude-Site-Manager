# LiteLLM Environment Configuration

LiteLLM is optional. DuDe services keep their Ollama-native defaults unless
`LITELLM_BASE_URL` is set in the runtime environment.

Set these variables in `tHe_DuDe_Compose/.env` only when using the local
OpenAI-compatible LiteLLM gateway:

```bash
# Gateway URL for containers that call LiteLLM.
LITELLM_BASE_URL=http://host.docker.internal:4000/v1

# Local placeholder only. Do not commit real API keys.
LITELLM_API_KEY=dummy-local-key

# Model aliases. These are local examples and must match your LiteLLM config.
DUDE_FAST_MODEL=dude-fast
DUDE_LOCAL_MODEL=dude-local
DUDE_CODE_MODEL=dude-code
DUDE_EMBED_MODEL=dude-embed

# Optional timeout for local gateway calls.
DUDE_LLM_TIMEOUT_SECONDS=30
```

`LITELLM_API_KEY` must be supplied from environment or local secret management.
Do not commit real API keys to this repository.

On Linux, `host.docker.internal` works from containers only when the calling
service has this compose entry:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Only add that entry to containers that actually call LiteLLM. For host-side
scripts on the same machine, use `http://127.0.0.1:4000/v1` instead.
