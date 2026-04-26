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
- Build, runtime startup, and scan execution are intentionally out of scope for this phase.
