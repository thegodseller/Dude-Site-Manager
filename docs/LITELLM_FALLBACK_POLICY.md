# LiteLLM Fallback Policy

This document defines routing and fallback behavior for the optional DuDe local
AI stack when LiteLLM is enabled through `LITELLM_BASE_URL`.

## Model Assignment

These aliases are local examples. The actual backend models and ports must
match the operator's LiteLLM configuration.

| Model Alias | Usage | Example Backend |
| :--- | :--- | :--- |
| `dude-fast` | Routing, intent detection, and short status replies. | Qwen3.5 0.8B |
| `dude-local` | General Thai conversation, reasoning, and fallback. | Qwen2.5 1.5B |
| `dude-code` | Code generation and debugging. | Qwen2.5-Coder 3B |
| `dude-embed` | Text embeddings for RAG and search. | Qwen3-Embedding 0.6B |

## Fallback Logic

The system should retry with `dude-local` if `dude-fast` fails under any of
these conditions:

1. Empty content: no text returned in the completion.
2. Reasoning leak: response contains `<think>` or unexpectedly long reasoning.
3. Timeout: request exceeds the configured timeout.
4. Classification error: `dude-fast` fails to return valid JSON for intent
   detection.

## Intent-Based Routing

- If intent is `unknown` or has `HIGH` priority requiring complex reasoning,
  prefer `dude-local` over `dude-fast`.
- Code-related intents such as `analyze_file` and `generate_code` should route
  to `dude-code` when that alias is configured.

## Secret Handling

- API keys must come from environment or local secret management.
- Do not commit real API keys to this repository.
- Use `dummy-local-key` only as a local placeholder when an unauthenticated
  development gateway expects a non-empty key value.

## Performance Constraints

- Shared iGPU memory can make concurrent local model serving slow.
- Avoid concurrent heavy generation on multiple large local models.
