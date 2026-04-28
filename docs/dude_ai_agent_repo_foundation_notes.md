# DuDe AI Agent Memory & Repo Foundation Notes

Generated: 2026-04-28

> This file consolidates the discussion about OnionClaw, Blinko, Obsidian, mem0, repo diary workflow, multi-IDE AI agent handoff, DuDe standards, Easy-Vibe, and SOUL.md.

---

## 1. OnionClaw: Does it use a lot of machine resources?

### Question

`https://github.com/JacobJandon/OnionClaw`  
กินสเปกเครื่องมากมั๊ย

### Answer

ไม่กินสเปกมาก ถ้าใช้เป็น search/fetch tool + LLM API

OnionClaw เหมาะเป็น Python CLI/Skill สำหรับ Tor OSINT ไม่ใช่โมเดล AI หนัก ๆ ดังนั้นภาระหลักคือ:

- Network
- Tor latency
- LLM API หรือ local model ที่เลือกใช้

ไม่ใช่ CPU/GPU โดยตรง

### Suitable machines

| Machine | Suitable | Notes |
|---|---:|---|
| Raspberry Pi 4/5 RAM 4–8GB | Yes | Good for light search/fetch, but Tor is slow |
| Dell 3060 i5 / RAM 16–24GB | Yes | Very suitable as external OSINT tool |
| i5 Gen6 RAM 32GB | Yes | No GPU needed |
| No GPU | Yes | Fine if using external LLM API |
| Local LLM 0.5B–1.5B | Yes | Light analysis, lower quality |
| Local LLM 7B+ | Heavy | Depends on RAM/VRAM/quantization |

### Recommended use in DuDe

Do not use OnionClaw as DuDe core.

Use it as an external OSINT tool under:

```text
ag_adventure
```

Better architecture:

```text
DuDe / Nexus
  ag_adventure
    osint-onion-worker
      OnionClaw
```

### Recommended config

For Dell 3060 or i5 Gen6 RAM 32GB:

```bash
SICRY_POOL_SIZE=2
LLM_PROVIDER=openai
TOR_SOCKS_HOST=127.0.0.1
TOR_SOCKS_PORT=9050
TOR_CONTROL_HOST=127.0.0.1
TOR_CONTROL_PORT=9051
```

For local small model:

```bash
SICRY_POOL_SIZE=1
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:1.5b
TOR_SOCKS_HOST=127.0.0.1
TOR_SOCKS_PORT=9050
TOR_CONTROL_HOST=127.0.0.1
TOR_CONTROL_PORT=9051
```

### Verdict

OnionClaw does not need high specs if it uses LLM API.  
Dell 3060 / i5 Gen6 RAM 16–32GB can run it comfortably.

But if running full pipeline, scraping many sites, using many TorPool processes, and running local LLM, it becomes heavier and slower.

---

## 2. Blinko vs Obsidian

### Question

Blinko กับ Obsidian ต่างกันมั๊ย

### Answer

ต่างกัน

```text
Obsidian = long-term knowledge vault for humans
Blinko   = fast note/memo/feed layer, good for AI and quick records
```

### Recommended DuDe flow

```text
LINE / Web / Camera / Logs
        ↓
Blinko = fast inbox / incident feed / memory inbox
        ↓
Librarian / RAG / summarize / classify
        ↓
Obsidian = knowledge vault / audit log / runbook / decision record
```

### Comparison

| Topic | Blinko | Obsidian |
|---|---|---|
| Main concept | Quick note / micro note / AI-friendly memo | Knowledge base / second brain |
| Best use | Fast input, incident, feed, inbox | Structured knowledge, runbook, audit, docs |
| AI-agent friendly | More suitable for live feed | Suitable if files are organized |
| Human long reading | Acceptable | Much better |
| Data structure | Record/note/feed | Markdown files |
| System integration | API/database friendly | Git/file-system friendly |
| RAG | Good for short fresh info | Good for permanent knowledge |
| Documentation | Not main strength | Very strong |
| Git | Not its strength | Very suitable |

### Blinko role

Blinko is the “AI memory inbox”.

Good for:

- Camera events
- Summarized agent logs
- LINE messages
- Short notes
- Tasks/events not yet organized
- Temporary or semi-permanent memory
- Incident feed

Example:

```text
[2026-04-26 22:10] Camera front-yard detected person.
Severity: medium
Summary: Unknown person near gate for 12 seconds.
Status: open
```

### Obsidian role

Obsidian is the “permanent system library”.

Good for:

- Runbooks
- Architecture
- Service inventory
- Incident report summaries
- Decision records
- Prompt policy
- Deployment notes
- Troubleshooting guides

Example:

```text
obsidian_vault/
  Audit/
    Final_Service_Audit_2026-04-25.md
    Async_Worker_Port_8000_Recovery_2026-04-25.md
  Architecture/
    AM_Nexus_Service_Map.md
  Runbooks/
    Restart_Hermes_Safely.md
```

### Source of truth

| Data | Recommended source of truth |
|---|---|
| Live events | Blinko |
| Raw incident feed | Blinko |
| Reviewed incident summary | Obsidian |
| Runbook | Obsidian |
| Service contract | Git repo |
| RAG memory | Qdrant + Obsidian/Blinko |
| System state | Database |
| Task queue | Redis/Queue |

### Final summary

```text
Blinko = remember fast
Obsidian = understand deeply
```

Use both.

---

## 3. Should DuDe use mem0 + Blinko + Obsidian?

### Question

ใช้สามตัวดีมั๊ย  mem0  blinko   obsidian

### Answer

ดี ใช้ได้ และเหมาะกับ DuDe/Nexus มาก  
แต่ต้องกำหนดบทบาทให้ชัด ไม่งั้นจะกลายเป็นความจำซ้ำซ้อน 3 กอง

### Core roles

```text
mem0     = memory for agent/user preferences and compact facts
Blinko   = inbox/feed/live events/quick notes
Obsidian = knowledge vault/runbook/audit/permanent docs
```

### Role table

| Tool | Main role | Should store | Should not store |
|---|---|---|---|
| mem0 | Agent memory | Preferences, compact facts, context | Long logs, raw incidents, documents |
| Blinko | Fast inbox | Incidents, feed, notes, LINE summaries | Permanent runbooks, main architecture |
| Obsidian | Long-term knowledge | Runbooks, audits, architecture, decisions | Raw logs at scale |

### Recommended information flow

```text
LINE / Camera / Web / Agent Logs
        ↓
     Blinko
 raw notes / feed / incidents
        ↓
 ag_librarian
 summarize / classify / deduplicate
        ↓
+------------------+------------------+
|                  |                  |
mem0            Obsidian
agent memory    official knowledge
```

### Rule for agents

```text
If it just happened → Blinko
If the agent must remember it next time → mem0
If it must be referenced long-term or audited → Obsidian
```

### Architecture

```text
                    +----------------+
                    |  LINE / LIFF   |
                    +----------------+
                            |
                    +----------------+
                    | ag_negotiator  |
                    +----------------+
                            |
                            v
+----------+        +----------------+        +----------+
| Camera   | -----> |    Blinko      | <----- | Web/API  |
| Events   |        |  live inbox    |        | Sources  |
+----------+        +----------------+        +----------+
                            |
                            v
                    +----------------+
                    | ag_librarian   |
                    | classify/RAG   |
                    +----------------+
                       |          |
                       |          |
                       v          v
                 +----------+   +----------------+
                 |  mem0    |   |   Obsidian     |
                 | memory   |   | knowledge vault|
                 +----------+   +----------------+
                       |          |
                       +----+-----+
                            |
                            v
                    +----------------+
                    |    Qdrant      |
                    | vector search  |
                    +----------------+
```

### Verdict

Use all 3, but let `ag_librarian` control the information flow.

Do not allow every agent to write randomly into every memory system.

---

## 4. Repo diary workflow

### Question

เวลาผมจะเริ่มรีโปใหม่ ผมก็จดบันทึก ทุกครั้งแบบไดอะรึ่เลย แล้วให้ ai มีส่วนร่วมด้วย ดีมั๊ย

### Answer

ดีมาก และควรทำเป็น standard

Every repo should have memory from day one.  
Do not let code exist without context.

### Recommended structure

```text
repo-name/
  README.md
  docs/
    PROJECT_DIARY.md
    DECISIONS.md
    RUNBOOK.md
    ARCHITECTURE.md
    TODO.md
```

Minimal version:

```text
docs/PROJECT_DIARY.md
docs/RUNBOOK.md
```

### `docs/PROJECT_DIARY.md` template

```markdown
# Project Diary

## 2026-04-26

### Goal
- Start a new repository and define the first working direction.

### Context
- Project name:
- Why this project exists:
- Target user:
- Expected outcome:

### What I did
- 

### What worked
- 

### What failed
- 

### Decisions
- 

### AI involvement
- Prompt used:
- AI suggestion:
- Accepted:
- Rejected:
- Reason:

### Files changed
- 

### Commands run

```bash
# Add commands here
```

### Next actions
- [ ] 
- [ ] 
```

### `docs/DECISIONS.md` template

```markdown
# Architecture Decisions

## ADR-0001: Initial direction

Date: 2026-04-26

### Status
Accepted

### Context
Describe the situation and why a decision is needed.

### Decision
Describe the decision clearly.

### Alternatives considered
- Option A:
- Option B:

### Consequences
- Positive:
- Negative:
- Risk:
```

### Recommended workflow

```text
1. Talk with AI to define the project
2. Ask AI to create PROJECT_DIARY.md
3. Ask AI to create first README.md
4. Ask AI to create RUNBOOK.md
5. Commit from day one
6. For major changes, update diary + decisions
```

### First commit example

```bash
git init
mkdir -p docs
touch README.md docs/PROJECT_DIARY.md docs/RUNBOOK.md docs/DECISIONS.md
git add .
git commit -m "initialize project knowledge base"
```

### Pattern for AI participation

```text
Human tells intent
AI proposes plan
Human approves or edits
AI writes files
Human tests
AI records outcome
Human commits
```

### Prompt for new repo

```text
ผมกำลังเริ่ม repo ใหม่ชื่อ: <repo-name>

เป้าหมายของโปรเจกต์:
<อธิบาย>

ช่วยผมสร้างโครงสร้างเอกสารเริ่มต้น:
1. README.md
2. docs/PROJECT_DIARY.md
3. docs/RUNBOOK.md
4. docs/DECISIONS.md
5. docs/TODO.md

เงื่อนไข:
- ใช้ Markdown
- เขียนให้คนและ AI อ่านต่อได้
- มีหัวข้อสำหรับจดสิ่งที่ลอง สิ่งที่พัง คำสั่งที่รัน และ next action
- อย่าใส่ข้อมูลสมมุติเกินจำเป็น
- ทำให้พร้อม commit แรก
```

### Important principle

```text
Diary is not decoration.
Diary is system memory.
```

---

## 5. How to make multiple IDEs and AI coding tools understand the same repo

### Question

ผมใช้ IDE หลายตัว Claude Code, Codex, Antigravity ทำไงให้เค้าทุกคนเข้าใจ ไม่ลืม

### Answer

Do not rely on each IDE or agent remembering.  
Make the repo self-documenting.

### Recommended structure

```text
repo-name/
  README.md
  AGENTS.md
  docs/
    PROJECT_DIARY.md
    RUNBOOK.md
    DECISIONS.md
    ARCHITECTURE.md
    TASKS.md
    CURRENT_STATE.md
  scripts/
    preflight.sh
    context_pack.sh
```

### Most important file

```text
AGENTS.md
```

This is the manual for every AI coding agent.

### Roles

| File | Role |
|---|---|
| `AGENTS.md` | Rules for all AI agents |
| `docs/CURRENT_STATE.md` | Latest repo state |
| `docs/PROJECT_DIARY.md` | Work history |
| `docs/RUNBOOK.md` | How to run/test/recover |
| `docs/DECISIONS.md` | Major decision reasons |
| `docs/ARCHITECTURE.md` | System overview |
| `docs/TASKS.md` | Pending/next tasks |
| `scripts/context_pack.sh` | Packs context for AI |

### `AGENTS.md` template

```markdown
# AGENTS.md

## Project Rules

This repository is maintained by multiple AI coding agents and human operators.

Every agent must read this file before making changes.

## Prime Directive

Do not make large architectural changes without updating the project documents.

Before editing code:
1. Read `README.md`
2. Read `docs/CURRENT_STATE.md`
3. Read `docs/RUNBOOK.md`
4. Read `docs/ARCHITECTURE.md`
5. Check `git status`

After editing code:
1. Run the relevant validation commands
2. Update `docs/CURRENT_STATE.md`
3. Update `docs/PROJECT_DIARY.md`
4. Update `docs/DECISIONS.md` if a major decision was made
5. Do not hide failures

## Source of Truth

- Runtime commands: `docs/RUNBOOK.md`
- Current system status: `docs/CURRENT_STATE.md`
- Architecture: `docs/ARCHITECTURE.md`
- History and work log: `docs/PROJECT_DIARY.md`
- Major decisions: `docs/DECISIONS.md`
- Pending work: `docs/TASKS.md`

## Coding Rules

- Prefer simple, maintainable code.
- Avoid unnecessary dependencies.
- Do not introduce new services unless clearly justified.
- Do not change ports without updating documentation.
- Do not delete working code unless there is a clear replacement.
- Do not commit secrets, tokens, passwords, private keys, or `.env` files.

## Validation Rules

Before claiming success, run the safest relevant checks available for this repo.

Recommended checks:

```bash
git status
find . -maxdepth 3 -type f | sort | head -200
```

If this is a Python project:

```bash
python3 -m py_compile $(find . -name "*.py" -not -path "./.venv/*")
```

If this is a Node.js project:

```bash
npm test
npm run lint
npm run build
```

If this is a Docker project:

```bash
docker compose config
docker compose ps
```

## Documentation Update Rules

Every meaningful change must update at least one of these:

- `docs/CURRENT_STATE.md`
- `docs/PROJECT_DIARY.md`
- `docs/RUNBOOK.md`
- `docs/TASKS.md`

Major architecture or policy changes must update:

- `docs/DECISIONS.md`
- `docs/ARCHITECTURE.md`

## Handoff Format

At the end of every work session, add a handoff note to `docs/CURRENT_STATE.md`.

The handoff must include:

- What changed
- Files changed
- Commands run
- What passed
- What failed
- Current risks
- Next recommended action

## Agent Behavior

Agents must be conservative.

Do:
- Explain what changed
- Keep changes small
- Preserve existing behavior when possible
- Write clear commit messages
- Ask for clarification only when the task is truly ambiguous

Do not:
- Rewrite the whole project casually
- Add hidden complexity
- Ignore existing documentation
- Assume undocumented ports or services
- Claim tests passed if they were not run
```

### `docs/CURRENT_STATE.md` template

```markdown
# Current State

Last updated: 2026-04-26

## Project Summary

This project exists to:

- 

## Current Working State

Status:

- [ ] Not started
- [ ] In progress
- [ ] Runs locally
- [ ] Runs in Docker
- [ ] Production ready
- [ ] Broken / needs recovery

## Known Good Commands

```bash
# Add commands that are known to work here
```

## Services

| Service | Port | Status | Notes |
|---|---:|---|---|
| example-service | 8080 | unknown | update this |

## Important Files

| File | Purpose |
|---|---|
| `README.md` | Project overview |
| `AGENTS.md` | Rules for AI agents |
| `docs/RUNBOOK.md` | Run and recovery guide |

## Last Changes

- 

## Files Changed Recently

- 

## Validation Run

```bash
# Add validation commands here
```

## Validation Result

- Passed:
- Failed:
- Not run:

## Known Issues

- 

## Risks

- 

## Next Recommended Action

1. 
2. 
3. 

## Handoff Note

Use this section to tell the next AI agent exactly where to continue.

Latest handoff:

- 
```

### `scripts/context_pack.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "===== REPOSITORY CONTEXT PACK ====="
echo

echo "===== GIT STATUS ====="
git status --short || true
echo

echo "===== BRANCH ====="
git branch --show-current || true
echo

echo "===== IMPORTANT FILES ====="
for file in   README.md   AGENTS.md   docs/CURRENT_STATE.md   docs/RUNBOOK.md   docs/ARCHITECTURE.md   docs/DECISIONS.md   docs/TASKS.md   docs/PROJECT_DIARY.md
do
  if [ -f "$file" ]; then
    echo
    echo "===== $file ====="
    sed -n '1,220p' "$file"
  fi
done

echo
echo "===== TOP LEVEL TREE ====="
find . -maxdepth 3   -not -path "./.git/*"   -not -path "./node_modules/*"   -not -path "./.venv/*"   -not -path "./__pycache__/*"   -print | sort | head -300

echo
echo "===== DONE ====="
```

### Standard prompt for every AI tool

```text
You are working inside this repository with other AI coding agents.

Before doing anything:
1. Read AGENTS.md
2. Read docs/CURRENT_STATE.md
3. Read docs/RUNBOOK.md
4. Check git status
5. Do not assume undocumented behavior

Task:
<ใส่งานตรงนี้>

Rules:
- Keep changes small and safe
- Do not rewrite unrelated files
- Do not introduce new dependencies unless necessary
- Run relevant validation commands
- Update docs/CURRENT_STATE.md
- Update docs/PROJECT_DIARY.md
- Tell me exactly what changed, what passed, what failed, and next action
```

### Golden rules

```text
Every agent must read AGENTS.md first
Every agent must update CURRENT_STATE.md after work
Every agent must commit or clearly say it did not commit
```

---

## 6. What to tell Codex to create all of this

### Question

ที่บอกมาทั้งหมด เยอะเหมือนกัน  
ผมจะบอกให้ codex ทำให้ยังไงครับ  
และการเอา dude ไปใช้ในงานที่ต่างกัน แต่ ai ก็ควรรู้จักค่ามาตรฐานของ dude

### Answer

Ask Codex to create a lightweight Foundation Kit first.

Do not let it modify application code yet.

### Prompt for Codex

```text
You are working inside this repository.

Goal:
Create a lightweight AI-agent project foundation so that Claude Code, Codex, Antigravity, and other AI coding agents can understand this repo consistently and continue work without forgetting context.

Important:
Do not rewrite application code.
Do not change runtime behavior.
Do not add new dependencies.
Only add documentation and lightweight helper scripts.

Create these files if missing:

1. AGENTS.md
2. docs/CURRENT_STATE.md
3. docs/PROJECT_DIARY.md
4. docs/RUNBOOK.md
5. docs/DECISIONS.md
6. docs/ARCHITECTURE.md
7. docs/TASKS.md
8. docs/DUDE_STANDARD.md
9. scripts/context_pack.sh

If files already exist, preserve useful existing content and append or merge carefully.

AGENTS.md requirements:
- Explain that every AI agent must read AGENTS.md first.
- Instruct agents to read docs/CURRENT_STATE.md, docs/RUNBOOK.md, docs/ARCHITECTURE.md, and docs/DUDE_STANDARD.md before changing code.
- Require agents to check git status before editing.
- Require small safe changes.
- Require documentation updates after meaningful changes.
- Require agents to report what changed, what passed, what failed, and next action.
- Require agents to never commit secrets or .env files.
- Require agents to not change ports/services without updating docs/DUDE_STANDARD.md and docs/ARCHITECTURE.md.

docs/DUDE_STANDARD.md requirements:
Document the standard DuDe service model.

Use these standard concepts:

DuDe is a multi-agent microservices system.

Standard agents:
- ag_boss: main orchestrator
- ag_librarian: knowledge, RAG, memory, documentation
- ag_adventure: external research and web/OSINT tools
- ag_negotiator: user/customer communication gateway such as LINE, LIFF, WhatsApp, Telegram
- ag_watcher: camera, vision, monitoring, incident detection
- ag_butler: system assistant, maintenance, email, code, deployment, recovery

Standard port ranges:
- Agent services: 11111-11119
- Web UI services: 12221-12229
- Vector store services: 13331-13339
- Memory services: 14441-14449
- App services: 15551-15559
- Optimization engines: 16000-16099

Current known standard ports:
- ag_boss: host 11111 -> container 8080
- ag_librarian: host 11112 -> container 8080
- ag_adventure: host 11113 -> container 8080
- ag_negotiator: host 11114 -> container 8080
- ag_watcher: host 11115 -> container 8080
- ag_butler: host 11116 -> container 8080
- lineliff: host 15551 -> container 8080
- db_mem0: host 8050 -> container 8050

Memory and knowledge standard:
- mem0: agent/user memory and compact facts
- Blinko: live inbox, notes, incident feed, raw short-form operational records
- Obsidian: curated long-term knowledge, runbooks, audits, architecture, decisions
- Vector DB such as Qdrant: semantic retrieval index

Information flow:
- Raw events, messages, camera incidents, and quick notes should go to Blinko first.
- ag_librarian should summarize, classify, deduplicate, and decide what goes to mem0, Obsidian, and vector search.
- mem0 should not store long logs or raw incident dumps.
- Obsidian should not receive every raw event; it should receive curated long-term records.
- Git docs are the source of truth for repo-specific implementation details.

docs/CURRENT_STATE.md requirements:
Create a practical handoff file with:
- Project summary
- Current working state
- Known good commands
- Services table
- Important files
- Last changes
- Validation result
- Known issues
- Risks
- Next recommended action
- Latest handoff note

docs/PROJECT_DIARY.md requirements:
Create a diary template with:
- Date
- Goal
- Context
- What I did
- What worked
- What failed
- Files changed
- Commands run
- AI involvement
- Decision notes
- Next actions

docs/RUNBOOK.md requirements:
Create sections for:
- Purpose
- Requirements
- Setup
- Environment
- Run locally
- Run with Docker
- Stop
- Logs
- Health check
- Validation
- Recovery

docs/DECISIONS.md requirements:
Create an ADR style template.

docs/ARCHITECTURE.md requirements:
Create a simple architecture template and include a section referencing docs/DUDE_STANDARD.md.

docs/TASKS.md requirements:
Create sections:
- Now
- Next
- Later
- Blocked
- Done

scripts/context_pack.sh requirements:
Create an executable Bash script that prints:
- git status
- current branch
- selected important docs
- top-level file tree up to depth 3
- avoid .git, node_modules, .venv, __pycache__

The script must be safe and dependency-light.

After creating files:
1. Run shell syntax validation for scripts/context_pack.sh.
2. Run scripts/context_pack.sh once if safe.
3. Show git status.
4. Summarize exactly what changed.
5. Do not commit unless I explicitly ask.
```

### Review prompt after Codex finishes

```text
Review the generated AI-agent foundation files.

Check for:
1. Missing DuDe standard values
2. Incorrect ports
3. Overly generic documentation
4. Any claim that is not true for this repo
5. Any risky instruction for future AI agents

Then improve the files conservatively.

Do not change application code.
Do not add dependencies.
Do not commit.
Show git diff summary and validation result.
```

### Commit prompt

```text
Commit only the documentation and helper script changes.

Before committing:
1. Show git status
2. Show the list of files to be committed
3. Ensure no .env, secrets, tokens, keys, or private files are included

Use this commit message:

initialize AI agent project foundation
```

### DuDe standard vs local project

Important separation:

```text
DuDe Standard = shared defaults every DuDe repo should understand
Project Local = actual implementation for this repo/site/use case
```

### Recommended structure

```text
repo/
  AGENTS.md
  docs/
    DUDE_STANDARD.md
    CURRENT_STATE.md
    ARCHITECTURE.md
    RUNBOOK.md
    PROJECT_DIARY.md
    DECISIONS.md
    TASKS.md
  scripts/
    context_pack.sh
```

### Important rule

```text
DuDe standard is reusable.
Project implementation is local.
Do not overwrite local implementation just because it differs from the standard.
If local implementation differs, document the difference.
```

### `DUDE_STANDARD.md` section for standard vs local

```markdown
# DuDe Standard

## Standard vs Local Implementation

This file defines the default DuDe standard.

Each repo may adapt the standard for its own use case.

If a repo differs from this standard, the difference must be documented in:

- `docs/ARCHITECTURE.md`
- `docs/CURRENT_STATE.md`
- `docs/DECISIONS.md`

Agents must not blindly overwrite local implementation to match this standard.

The correct behavior is:

1. Detect the difference
2. Document the difference
3. Ask or propose a migration only if the difference creates risk
```

### Audit prompt after foundation is committed

```text
Read AGENTS.md, docs/DUDE_STANDARD.md, docs/CURRENT_STATE.md, docs/ARCHITECTURE.md, and docs/RUNBOOK.md.

Then audit this repository against the DuDe standard.

Do not change code yet.

Report:
1. Which standard DuDe components exist
2. Which components are missing
3. Which ports match the standard
4. Which ports differ from the standard
5. Which documentation is outdated
6. Which risks should be fixed first
7. Recommended next small task

Do not modify files.
```

---

## 7. Easy-Vibe suitability

### Question

`https://github.com/datawhalechina/easy-vibe`  
เหมาะกับผมมั๊ย

### Answer

เหมาะในฐานะหลักสูตร/คู่มือฝึก AI coding workflow  
ไม่เหมาะเอามาเป็นแกนของ DuDe

### Use as reference

Easy-Vibe is useful for learning:

- AI IDE tools
- Git/GitHub
- Frontend/backend
- Supabase/database
- Deployment
- Dify/RAG
- Claude Code
- MCP
- Skills
- Agent Teams
- Spec Coding

### Suitable for

- Learning AI coding workflow
- Studying Claude Code/MCP/Skills
- Looking at examples such as AGENTS.md, CLAUDE.md, llms.txt
- Improving DuDe repo documentation style

### Not suitable for

- Replacing DuDe
- Being the agent runtime
- Becoming production backend
- Becoming the architecture foundation

### Recommended use

```text
Easy-Vibe = teacher / map / workflow reference
DuDe      = actual system
Codex     = worker for repo changes
AGENTS.md + DUDE_STANDARD.md = shared memory for all AI tools
```

### Prompt to use Easy-Vibe as reference only

```text
Study the Easy-Vibe repository structure and documentation approach as a reference only.

Goal:
Improve this repository's AI-agent documentation foundation.

Use Easy-Vibe-inspired ideas such as:
- AGENTS.md for agent rules
- llms.txt-style navigation for AI agents
- clear learning/project navigation
- AI-friendly documentation structure

But do not copy content blindly.
Do not turn this repo into a VitePress documentation site.
Do not add VitePress, Vue, Node dependencies, or frontend docs tooling.

Apply the ideas to this repo's actual purpose:
- DuDe multi-agent microservices
- repo handoff
- CURRENT_STATE.md
- RUNBOOK.md
- DUDE_STANDARD.md
- PROJECT_DIARY.md
- context_pack.sh

Make small documentation-only changes.
Do not modify application code.
Do not commit.
Show git diff summary and validation result.
```

### Score

| Area | Score |
|---|---:|
| Learn AI coding | 9/10 |
| Learn Claude Code/MCP/Skills | 8.5/10 |
| AGENTS/llms.txt example | 9/10 |
| Replace DuDe | 2/10 |
| Production framework | 2/10 |
| Repo discipline reference | 8/10 |

### Final

Do not clone Easy-Vibe as a base for DuDe.  
Use it as learning material and documentation inspiration.

---

## 8. Should the project have `SOUL.md`?

### Question

งั้นผมไม่ใช่หรอก ทำแบบที่เราคุยกันดีกว่า แล้วผมควรมี soul. mdมั๊ย

### Answer

ควรมี สำหรับ repo ระยะยาวหรือโปรเจกต์ที่มีเจตนา/บุคลิก/ปรัชญาชัดเจน เช่น:

- DuDe
- Nexus
- Ice Fac Aran

For small experiment repos, not necessary.

Recommended filename:

```text
docs/SOUL.md
```

or:

```text
PROJECT_SOUL.md
```

### Role of SOUL.md

```text
AGENTS.md        = rules for AI work
DUDE_STANDARD.md = standard DuDe architecture
CURRENT_STATE.md = current actual state
RUNBOOK.md       = how to run/recover
SOUL.md          = why this project exists
```

### Recommended structure

```text
repo/
  AGENTS.md
  docs/
    SOUL.md
    DUDE_STANDARD.md
    CURRENT_STATE.md
    ARCHITECTURE.md
    RUNBOOK.md
    PROJECT_DIARY.md
    DECISIONS.md
    TASKS.md
```

### Generic `docs/SOUL.md` template

```markdown
# Project Soul

## Purpose

This project exists to:

- 

## North Star

The project should always move toward:

- 

## Human Context

The system is designed to help:

- 

## Principles

- Keep the system useful before making it impressive.
- Prefer simple working tools over complex architecture.
- Preserve operator control.
- Make failures visible.
- Document decisions.
- Avoid hidden automation that can cause damage.
- Optimize for real-world reliability.

## What This Project Must Not Become

This project must not become:

- A complex demo that cannot be operated by real people.
- An autonomous system that acts without clear boundaries.
- A collection of disconnected experiments.
- A system that hides failures.
- A system that depends on undocumented magic.

## AI Agent Behavior

AI agents working on this project should:

- Understand the purpose before changing code.
- Keep changes small and reversible.
- Respect existing local implementation.
- Update documentation after meaningful changes.
- Explain risks clearly.
- Avoid over-engineering.

## Decision Style

When choosing between options:

1. Prefer the option that can run reliably today.
2. Prefer the option that the operator can understand.
3. Prefer the option that is easy to recover.
4. Prefer the option that preserves future flexibility.
5. Avoid adding complexity without a clear operational gain.

## Boundaries

The system may automate:

- 

The system must ask for human approval before:

- 

The system must never:

- 

## Long-Term Vision

In the long term, this project should become:

- 

## Current Focus

The current focus is:

- 
```

### DuDe `docs/SOUL.md` draft

```markdown
# Project Soul

## Purpose

DuDe exists to become a practical AI assistant system that helps humans operate real-world work more safely, clearly, and efficiently.

It is not only a chatbot. It is a multi-agent operational assistant.

## North Star

DuDe should help the operator see what is happening, understand what matters, and take the next safe action.

## Human Context

DuDe is designed for real people working with real businesses, homes, cameras, documents, machines, customers, and daily operational problems.

The system should reduce confusion, not create more complexity.

## Principles

- Useful first, impressive second.
- Human control first, automation second.
- Clear logs over hidden behavior.
- Small reliable services over one giant system.
- Local-first when practical.
- Cloud/API only when it clearly improves capability.
- Document everything important.
- Every service must have a clear job.
- Every agent must have a clear boundary.
- Recovery must be possible without guessing.

## What This Project Must Not Become

DuDe must not become:

- A flashy demo that cannot survive real use.
- A pile of agents that duplicate each other.
- A system that restarts, deletes, sends, or changes important things without permission.
- A black box that the owner cannot understand.
- A system that depends on one AI provider only.
- A system that stores everything everywhere.

## AI Agent Behavior

AI agents working on DuDe must:

- Read `AGENTS.md` first.
- Read `docs/DUDE_STANDARD.md` before changing architecture.
- Read `docs/CURRENT_STATE.md` before continuing work.
- Keep changes small and reversible.
- Preserve known-good behavior.
- Update documentation after meaningful changes.
- Never claim success without validation.
- Never hide failures.
- Never change service ports without documenting the change.

## Decision Style

When choosing between options:

1. Choose the simplest reliable option first.
2. Prefer boring infrastructure that can be debugged.
3. Prefer clear service boundaries.
4. Prefer explicit logs and health checks.
5. Prefer small local models for routine tasks.
6. Use stronger cloud models for planning, review, and complex reasoning.
7. Avoid adding an agent unless it has a distinct job.

## Standard Memory Philosophy

DuDe memory should be layered:

- Blinko stores live notes, incidents, and short operational feed.
- mem0 stores compact user and agent memory.
- Obsidian stores curated long-term knowledge, runbooks, audits, and decisions.
- Vector search indexes useful knowledge for retrieval.

Raw data should enter the system quickly.
Curated knowledge should be written slowly and deliberately.

## Automation Boundaries

DuDe may automate:

- Summarizing logs
- Classifying incidents
- Drafting messages
- Searching documents
- Preparing reports
- Suggesting recovery steps

DuDe must ask for human approval before:

- Restarting production services
- Sending customer messages
- Deleting files
- Changing firewall, network, or security settings
- Modifying secrets or credentials
- Running destructive commands
- Making purchases or financial decisions

DuDe must never:

- Hide errors from the operator
- Invent system status
- Commit secrets
- Delete backups without explicit approval
- Disable safety checks to make a task look successful

## Long-Term Vision

DuDe should become a practical local-first AI operating layer for real-world work.

It should connect cameras, messages, documents, tools, and humans through clear agent roles and safe automation.

## Current Focus

The current focus is:

- Make each repo understandable to humans and AI agents.
- Standardize documentation and handoff.
- Keep the system recoverable.
- Build useful workflows before adding complexity.
```

### Codex prompt to add SOUL.md

```text
Also create docs/SOUL.md.

Purpose:
Define the project's purpose, principles, boundaries, and long-term direction so all AI coding agents understand the intent behind the repo.

Requirements:
- Keep it practical, not poetic.
- Do not include fake claims about the current repo.
- Include sections:
  - Purpose
  - North Star
  - Human Context
  - Principles
  - What This Project Must Not Become
  - AI Agent Behavior
  - Decision Style
  - Automation Boundaries
  - Long-Term Vision
  - Current Focus
- If this repo is a DuDe-related repo, include DuDe memory philosophy:
  - Blinko for live notes and incident feed
  - mem0 for compact agent/user memory
  - Obsidian for curated long-term knowledge
  - Vector DB for semantic retrieval
- Do not modify application code.
- Do not add dependencies.
```

### Final verdict

For DuDe, `docs/SOUL.md` should exist.

```text
SOUL.md = intent and direction
AGENTS.md = AI work rules
DUDE_STANDARD.md = DuDe standard
CURRENT_STATE.md = latest real state
RUNBOOK.md = run/recovery instructions
```

---

## 9. Final recommended repo foundation

```text
repo/
  AGENTS.md
  docs/
    SOUL.md
    DUDE_STANDARD.md
    CURRENT_STATE.md
    ARCHITECTURE.md
    RUNBOOK.md
    PROJECT_DIARY.md
    DECISIONS.md
    TASKS.md
  scripts/
    context_pack.sh
```

### Operating principle

```text
Do not make AI tools remember separately.
Make the repository itself remember.
```

### DuDe knowledge principle

```text
Blinko = live inbox
mem0 = compact agent/user memory
Obsidian = curated long-term knowledge
Qdrant/vector DB = semantic retrieval
Git docs = repo-specific source of truth
```

### Practical rollout

1. Ask Codex to create the documentation foundation only.
2. Review generated files.
3. Commit documentation foundation.
4. Run an audit against DuDe standard.
5. Only then allow small code changes.

---

## 10. One-shot Codex prompt including SOUL.md

Use this if you want Codex to create everything in one pass:

```text
You are working inside this repository.

Goal:
Create a lightweight AI-agent project foundation so Claude Code, Codex, Antigravity, and other AI coding agents can understand this repo consistently and continue work without forgetting context.

Important:
Do not rewrite application code.
Do not change runtime behavior.
Do not add new dependencies.
Only add documentation and lightweight helper scripts.
Do not commit unless explicitly asked.

Create these files if missing:

1. AGENTS.md
2. docs/SOUL.md
3. docs/CURRENT_STATE.md
4. docs/PROJECT_DIARY.md
5. docs/RUNBOOK.md
6. docs/DECISIONS.md
7. docs/ARCHITECTURE.md
8. docs/TASKS.md
9. docs/DUDE_STANDARD.md
10. scripts/context_pack.sh

If files already exist, preserve useful existing content and append or merge carefully.

AGENTS.md:
- Every AI agent must read AGENTS.md first.
- Agents must read docs/SOUL.md, docs/CURRENT_STATE.md, docs/RUNBOOK.md, docs/ARCHITECTURE.md, and docs/DUDE_STANDARD.md before changing code.
- Agents must check git status before editing.
- Agents must make small safe changes.
- Agents must update documentation after meaningful changes.
- Agents must report what changed, what passed, what failed, and next action.
- Agents must never commit secrets or .env files.
- Agents must not change ports/services without updating docs/DUDE_STANDARD.md and docs/ARCHITECTURE.md.

docs/SOUL.md:
- Define project purpose, principles, boundaries, and long-term direction.
- Keep it practical, not poetic.
- Include sections:
  - Purpose
  - North Star
  - Human Context
  - Principles
  - What This Project Must Not Become
  - AI Agent Behavior
  - Decision Style
  - Automation Boundaries
  - Long-Term Vision
  - Current Focus
- If this repo is DuDe-related, include memory philosophy:
  - Blinko for live notes and incident feed
  - mem0 for compact agent/user memory
  - Obsidian for curated long-term knowledge
  - Vector DB for semantic retrieval

docs/DUDE_STANDARD.md:
Document the standard DuDe service model.

Use these standard concepts:

DuDe is a multi-agent microservices system.

Standard agents:
- ag_boss: main orchestrator
- ag_librarian: knowledge, RAG, memory, documentation
- ag_adventure: external research and web/OSINT tools
- ag_negotiator: user/customer communication gateway such as LINE, LIFF, WhatsApp, Telegram
- ag_watcher: camera, vision, monitoring, incident detection
- ag_butler: system assistant, maintenance, email, code, deployment, recovery

Standard port ranges:
- Agent services: 11111-11119
- Web UI services: 12221-12229
- Vector store services: 13331-13339
- Memory services: 14441-14449
- App services: 15551-15559
- Optimization engines: 16000-16099

Current known standard ports:
- ag_boss: host 11111 -> container 8080
- ag_librarian: host 11112 -> container 8080
- ag_adventure: host 11113 -> container 8080
- ag_negotiator: host 11114 -> container 8080
- ag_watcher: host 11115 -> container 8080
- ag_butler: host 11116 -> container 8080
- lineliff: host 15551 -> container 8080
- db_mem0: host 8050 -> container 8050

Memory and knowledge standard:
- mem0: agent/user memory and compact facts
- Blinko: live inbox, notes, incident feed, raw short-form operational records
- Obsidian: curated long-term knowledge, runbooks, audits, architecture, decisions
- Vector DB such as Qdrant: semantic retrieval index

Information flow:
- Raw events, messages, camera incidents, and quick notes should go to Blinko first.
- ag_librarian should summarize, classify, deduplicate, and decide what goes to mem0, Obsidian, and vector search.
- mem0 should not store long logs or raw incident dumps.
- Obsidian should not receive every raw event; it should receive curated long-term records.
- Git docs are the source of truth for repo-specific implementation details.

Also include:
- Standard vs Local Implementation section.
- Agents must not blindly overwrite local implementation to match the standard.
- If local implementation differs, document the difference in docs/ARCHITECTURE.md, docs/CURRENT_STATE.md, and docs/DECISIONS.md.

docs/CURRENT_STATE.md:
Create a practical handoff file with:
- Project summary
- Current working state
- Known good commands
- Services table
- Important files
- Last changes
- Validation result
- Known issues
- Risks
- Next recommended action
- Latest handoff note

docs/PROJECT_DIARY.md:
Create a diary template with:
- Date
- Goal
- Context
- What I did
- What worked
- What failed
- Files changed
- Commands run
- AI involvement
- Decision notes
- Next actions

docs/RUNBOOK.md:
Create sections for:
- Purpose
- Requirements
- Setup
- Environment
- Run locally
- Run with Docker
- Stop
- Logs
- Health check
- Validation
- Recovery

docs/DECISIONS.md:
Create an ADR style template.

docs/ARCHITECTURE.md:
Create a simple architecture template and include a section referencing docs/DUDE_STANDARD.md and docs/SOUL.md.

docs/TASKS.md:
Create sections:
- Now
- Next
- Later
- Blocked
- Done

scripts/context_pack.sh:
Create an executable Bash script that prints:
- git status
- current branch
- selected important docs
- top-level file tree up to depth 3
- avoid .git, node_modules, .venv, __pycache__

The script must be safe and dependency-light.

After creating files:
1. Run shell syntax validation for scripts/context_pack.sh.
2. Run scripts/context_pack.sh once if safe.
3. Show git status.
4. Summarize exactly what changed.
5. Do not commit unless I explicitly ask.
```

---

End of file.
