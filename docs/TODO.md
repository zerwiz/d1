# d1 Planning Hub — TODO & Remaining Work

This document tracks what is **done** and what is **left** for the project to work fully. Keep it updated as items are completed.

---

## Done (current state)

| Area | Status | Notes |
|------|--------|--------|
| **Rust indexer** | Done | Chunking (1k chars, 200 overlap), Tantivy, `RAG_INDEX_DIR`, `RAG_SCAN_DIRS`, `RAG_EXCLUDE_DIRS` |
| **Query binary** | Done | JSON lines `path` + `content` per chunk, search over title + content |
| **rag.sh** | Done | `build`, `query`, `chat`; passes chunks to `chat.py` |
| **chat.py** | Done | Loads history, builds context from chunks, POST to llama.cpp, saves history; `D1_LLM_URL` |
| **Electron UI** | Done | Chat, sidebar, Add folder, Exclusions, Rebuild index, Upload, drag-drop, View file, Clear history, Export planning doc |
| **Active context & tokens** | Done | Context viewer shows paths; token bar (est.) from `D1_META_*` |
| **Desktop launcher** | Done | `scripts/install-d1.sh` → `~/.local/share/applications/` |
| **File watcher** | Done | `scripts/watch.sh` runs `rag.sh build` on changes in `data/` |
| **Systemd unit** | Present | `configs/d1-watcher.service` (path still hardcoded — see below) |

---

## Remaining (for project to work fully)

### High priority

| # | Task | Description |
|---|------|-------------|
| 1 | **Systemd unit portability** | `configs/d1-watcher.service` uses `ExecStart=%h/CodeP/d1/scripts/watch.sh`. Make path configurable (e.g. install script that substitutes project path into the unit, or use `WorkingDirectory` + relative script). |
| 2 | **Watcher + external folders** | `watch.sh` only watches `data/`. When users add external folders in the UI, changes there do not trigger reindex. Either extend the watcher to support multiple dirs (e.g. from a small config or env) or document that auto-watch applies only to `data/`. |

### Medium priority

| # | Task | Description |
|---|------|-------------|
| 3 | **UI: LLM offline handling** | When llamacpp-droid is not running (e.g. port 8080), show a clear “LLM unavailable” state (banner or persistent message), not only an error line in the chat. |
| 4 | **Context pinning** | Phase 3 in ROADMAP: let user manually select documents to always include in the AI context (pin to context). |

### Lower priority / polish

| # | Task | Description |
|---|------|-------------|
| 5 | **Single setup script** | Done: `scripts/install.sh` (deps check, npm install, cargo build, optional `--launcher`). Optional: extend to install systemd unit. `scripts/update.sh` pulls from `origin main` and rebuilds. |
| 6 | **Portability pass** | Confirm all scripts and the Electron app resolve paths via `D1_PROJECT_ROOT` or script-relative paths; systemd is the main remaining hardcoded path. |

---

## Quick reference

- **Build index:** `./scripts/rag.sh build` (set `RAG_SCAN_DIRS`, `RAG_EXCLUDE_DIRS` for multi-dir/excludes).
- **Chat (CLI):** `./scripts/rag.sh chat "your question"`.
- **Watcher (foreground):** `./scripts/watch.sh` (watches `data/` only).
- **First-time install:** `./scripts/install.sh` (use `--launcher` to add desktop launcher).
- **Update (pull + rebuild):** `./scripts/update.sh` (git pull origin main, then npm install + cargo build).
- **Desktop launcher:** `./scripts/install-d1.sh`.
- **Systemd:** Copy `configs/d1-watcher.service` to `~/.config/systemd/user/`, fix `ExecStart` path, then `systemctl --user enable --now d1-watcher.service`.

---

*Update this file when completing or adding tasks. See [ROADMAP.md](ROADMAP.md) and [PLANNING.md](PLANNING.md) for phases and architecture.*
