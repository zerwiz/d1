# d1 Planning Hub — TODO & Remaining Work

This document tracks what is **done** and what is **left** for the project to work fully. Keep it updated as items are completed.

---

## Done (current state)

| Area | Status | Notes |
|------|--------|--------|
| **Rust indexer** | Done | Chunking (1k chars, 200 overlap), Tantivy, `RAG_INDEX_DIR`, `RAG_SCAN_DIRS`, `RAG_EXCLUDE_DIRS` |
| **Query binary** | Done | JSON lines `path` + `content` per chunk, search over title + content |
| **rag.sh** | Done | `build`, `query`, `chat`; passes chunks to `chat.py`; env `D1_PINNED_JSON` passed through to chat.py |
| **chat.py** | Done | Loads history, builds context from chunks + **pinned** (`D1_PINNED_JSON`), POST to llama.cpp, saves history; `D1_LLM_URL` |
| **Electron UI** | Done | Chat, sidebar, Add folder, Exclusions, Rebuild index, Upload, drag-drop, View file, Clear history, Export planning doc, **LLM offline banner**, **context pinning** (Pin/Unpin data files) |
| **Active context & tokens** | Done | Context viewer shows paths; token bar (est.) from `D1_META_*` |
| **Desktop launcher** | Done | `scripts/install-d1.sh` → `~/.local/share/applications/` |
| **File watcher** | Done | `scripts/watch.sh` reads `configs/watcher-dirs.txt` (data/ + external folders); UI writes this when adding folders or rebuilding |
| **Systemd unit** | Done | `configs/d1-watcher.service` uses placeholder `@D1_PROJECT_ROOT@`; **`scripts/install-watcher.sh`** substitutes real path and installs to `~/.config/systemd/user/` |
| **Install script** | Done | `scripts/install.sh` supports `--launcher` and **`--watcher`** (installs systemd unit via install-watcher.sh) |
| **Portability** | Done | Scripts use `D1_PROJECT_ROOT` or script-relative resolution; no hardcoded paths in code |
| **Watcher dirs on load** | Done | UI calls `writeWatcherDirsIfMissing(externalFolders)` on load so `watcher-dirs.txt` is created once when external folders exist and the file is missing. |
| **Pinned from context viewer** | Done | “Active context” paths have a **Pin** button; pinning adds the absolute path. Pinned list supports both data-folder names and absolute paths; `files:readByPath` and chat pipeline support both. |

---

## Remaining (optional polish)

*None at this time.*

---

## Quick reference

- **Build index:** `./scripts/rag.sh build` (set `RAG_SCAN_DIRS`, `RAG_EXCLUDE_DIRS` for multi-dir/excludes).
- **Chat (CLI):** `./scripts/rag.sh chat "your question"` (optional: `D1_PINNED_JSON` env for pinned context).
- **Watcher (foreground):** `./scripts/watch.sh` (watches dirs from `configs/watcher-dirs.txt`, else `data/`).
- **First-time install:** From root run `./install` (installs everything). `./install --opt` installs into /opt/ops/d1. Use `--no-launcher`, `--no-watcher`, `--no-cli` to skip parts.
- **Update:** From root run `./update` or `d1 update` — pull, build, and refresh launcher, watcher unit, and CLI.
- **Update (pull + rebuild):** `./scripts/update.sh` (git pull origin main, then npm install + cargo build).
- **Desktop launcher:** `./scripts/install-d1.sh`.
- **Systemd watcher:** `./scripts/install-watcher.sh` then `systemctl --user enable --now d1-watcher.service`.
- **d1 CLI (run from anywhere):** `./scripts/install-d1-cli.sh` or `./scripts/install.sh --cli`; then `d1 start`, `d1 stop`, `d1 status`, `d1 help`.

---

*Update this file when completing or adding tasks. See [ROADMAP.md](ROADMAP.md) and [PLANNING.md](PLANNING.md) for architecture.*
