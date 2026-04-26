# RackPeek Local Inventory

This folder stores local DuDe infrastructure inventory for RackPeek.

- RackPeek is used here as documentation and inventory only.
- RackPeek is not an auto-scanner in this workflow.
- No credentials, passwords, tokens, or SSH keys may be stored here.
- The local RackPeek container bind-mounts this config into `/app/config`.
- The mounted config directory must remain writable because RackPeek creates local backup files such as `config.yaml.bak.*`.
- The earlier RackPeek HTTP 500 was confirmed to come from incompatible seed YAML: plain `notes` values containing `UNKNOWN:` were parsed as invalid mappings.
- The local seed config now uses quoted note strings and the RackPeek service entry on `127.0.0.1:18081`.
- Open the RackPeek Web UI at `http://127.0.0.1:18081`.
- Host port `18080` is reserved for local LLM / llama-server usage.
- Current use is manual inventory only; network scanning is out of scope.
