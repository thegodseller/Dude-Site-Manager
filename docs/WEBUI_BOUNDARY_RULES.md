# WebUI Boundary Rules

`tHe_DuDe_WebUI` contains separate frontend surfaces. Agents must not edit them interchangeably, even when both surfaces are part of the same parent repository.

## `tHe_DuDe_WebUI/corporate_site`

- Public marketing website.
- Served at `https://thegodseller.com/`.
- Edit this path only when the task explicitly says `corporate_site` is in scope.
- Never place server configs, `.env` files, secrets, backups, logs, or temporary files here.

## `tHe_DuDe_WebUI/dude_hawaiian_webui`

- Internal app, dashboard, and POS frontend.
- POS work belongs here.
- POS tasks must not touch `tHe_DuDe_WebUI/corporate_site`.

## Agent Prompt Rule

Whenever giving work to Codex, Gemini, Antigravity, or any other agent:

- State the exact target path.
- State out-of-scope paths.
- For POS tasks, include: `Do NOT touch corporate_site`.
- For corporate site tasks, include: `Do NOT touch dude_hawaiian_webui`.

## Validation Checklist

Before committing WebUI-related work, verify the touched paths:

```bash
git status --short
git diff --stat
git diff --name-only
```
