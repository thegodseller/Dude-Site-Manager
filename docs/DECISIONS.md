# Decisions

## 2026-04-28

1. `docs/` remains the platform/repository documentation location.
2. `nakarin_erp/` remains business/domain/customer source-of-truth.
3. `tHe_DuDe_Service/obsidian_vault/` remains service-level runtime/audit knowledge.
4. Legacy skill entries remain until consumer audits are complete.
5. **Model Compatibility Note:** `qwen3.5:0.8b` is present in Ollama tags but is not runtime-safe on the current `ollama_ov/OpenVINO` backend. Do not use it as `CHAT_MODEL` until compatibility is resolved. Use `qwen2.5:1.5b` for `ag_boss` `GeneralAssistant` fallback.

## requirements:
- Create an ADR style template.
