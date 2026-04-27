# RackPeek Integration

## Candidate Infrastructure Tool

- RackPeek is a candidate internal infrastructure inventory and discovery tool.
- RackPeek is separate from DuDe Core and should be treated as an optional infrastructure tool until approved.

## Safety Rules

- RackPeek must not scan external networks.
- RackPeek must only scan approved internal CIDR ranges.
- Production scan policy is `UNKNOWN: requires owner confirmation`.

## Security Rules

- Credentials, SSH keys, API tokens, and device passwords must never be committed.
- RackPeek licensing must be reviewed before product integration.

## Evaluation Notes

- Local evaluation may be prepared through `tools/install_rackpeek.sh`.
- Repository inspection may be performed through `tools/eval_rackpeek.sh`.
- RackPeek was cloned locally for evaluation at `tools/vendor/RackPeek`.
- The observed local clone state was commit `a223715` and tag `RackPeek-1.3.1`.
- `tools/vendor/RackPeek` is local-only evaluation material and must not be committed.
- RackPeek shows zero hardware, systems, and services until a valid inventory `config.yaml` exists under the mounted config path.
- The local DuDe seed inventory path is `ops/rackpeek/config/config.yaml`.
- The mounted local config directory must remain writable because RackPeek creates backup files such as `config.yaml.bak.*`.
- RackPeek uses local host port `18081` and container port `8080`.
- Host port `18080` is reserved for local llama-server.
- The local RackPeek Web UI should be opened at `http://127.0.0.1:18081`.
- RackPeek is manual inventory only for the DuDe local workflow and must not be treated as a network scanner.
- Current verification result: RackPeek HTTP 500 was traced to invalid seed YAML; quoted `notes` values and the corrected `rackpeek-ui` port `18081` removed the config parse error, RackPeek starts cleanly, and Docker shows `127.0.0.1:18081->8080/tcp`.
- LiteLLM local gateway (`http://127.0.0.1:4000`) has been added to the manual inventory in `ops/rackpeek/config/config.yaml`.
- Latest manual audit (2026-04-27) synchronized `ops/rackpeek/config/config.yaml` with running Docker/host services (Fixing agent ports 11112-11114, db_mem0 13332, and adding database/auxiliary containers).
- Removed port 8088 (File Browser / download portal) from inventory as it is no longer used and the container was decommissioned.
- Port 11118 is confirmed as the DuDe Global Control Dashboard.
- RackPeek is a manual inventory tool; it does not auto-discover services. Use `docker ps` and `ss -ltnp` to verify reality before updating the inventory.
- `UNKNOWN: host curl may still fail in this environment despite Docker port mapping; verify from browser at http://127.0.0.1:18081.`
- Production scan policy remains `UNKNOWN: requires owner confirmation`.
