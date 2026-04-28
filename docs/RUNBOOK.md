# Runbook

## Quick Checks

```bash
git status --short
```

```bash
./scripts/validate_nakarin_erp.sh
```

```bash
python3 tHe_DuDe_Service/scripts/validate_skill_registry.py
```

## Context Snapshot

```bash
./scripts/context_pack.sh
```

## Safety Checklist Before Commit

1. Confirm no secrets or private exports are staged.
2. Confirm source-of-truth docs are updated for behavior changes.
3. Confirm nested repo/gitlink rules are respected.
