# LiteLLM Environment Configuration

Set these in \`tHe_DuDe_Compose/.env\` or the local shell environment to enable
the gateway.

\`\`\`bash
LITELLM_BASE_URL=http://host.docker.internal:4000/v1
LITELLM_API_KEY=dummy-local-key
DUDE_FAST_MODEL=dude-fast
DUDE_LOCAL_MODEL=dude-local
DUDE_CODE_MODEL=dude-code
DUDE_EMBED_MODEL=dude-embed
DUDE_LLM_TIMEOUT_SECONDS=30
DUDE_LOG_PROMPTS=false
\`\`\`

`dummy-local-key` is a non-secret local placeholder for development gateways
that expect a non-empty key value. Do not commit real API keys. Prefer setting
`LITELLM_API_KEY` through a local `.env` file or shell environment.
