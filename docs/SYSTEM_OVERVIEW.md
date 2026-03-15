# d1 Planning Hub — System Overview

This document describes the d1 system, its architecture, and **all capabilities** in one place. Use it for onboarding, integration, or reference.

---

## 1. What d1 Is

**d1** is a **local-first Retrieval-Augmented Generation (RAG)** system for project planning and document management. It:

- Indexes your markdown (and optionally other text) into a fast searchable index.
- Lets you chat with an AI that uses your indexed content as context.
- Runs the LLM via **[llamacpp-droid](https://github.com/zerwiz/llamacpp-droid)** (llama.cpp on port 8080) — **100% private**, no cloud.

No Elasticsearch, no heavy stacks: Rust (Tantivy) for indexing, Electron for the UI, Python for the chat bridge.

---

## 2. Architecture (Three Layers)

| Layer | Role | Components |
|-------|------|------------|
| **Data** | Files and index | Markdown in `data/` and external folders; Tantivy index (path in `RAG_INDEX_DIR`) |
| **Engine** | Index + AI | Rust indexer + query binary; `rag.sh`; `chat.py` → llama.cpp HTTP API |
| **UI** | Planning Hub | Electron app: chat, sidebar, file list, context viewer, token bar, export |

Data flows: **User query** → **RAG retrieval** (Rust) → **Context + pinned docs** → **chat.py** → **llama.cpp** → **Response** → **UI**.

---

## 3. Capabilities Overview

### 3.1 Indexing & Search

| Capability | Description |
|------------|-------------|
| **Recursive chunking** | Markdown is split into ~1,000-character chunks with 200-character overlap for better context. |
| **Tantivy index** | Full-text search over **title** (filename) and **content**; sub-millisecond retrieval. |
| **Multi-directory scan** | Index `data/` plus any **external folders** you add in the UI. |
| **Exclusions** | Exclude folders (e.g. `node_modules`) from the index via the UI exclusion list. |
| **Configurable paths** | `RAG_INDEX_DIR`, `RAG_DATA_DIR`, `RAG_SCAN_DIRS`, `RAG_EXCLUDE_DIRS` (see [Configuration](#6-configuration)). |

**Commands:** `./scripts/rag.sh build` (rebuild index), `./scripts/rag.sh query "term"` (JSON lines of matching chunks).

---

### 3.2 Chat & RAG

| Capability | Description |
|------------|-------------|
| **Query-driven retrieval** | Each message: query is run against the index; top chunks are sent to the LLM with the question. |
| **Conversation memory** | History stored in `data/chat_history.json`; sent to the LLM so the assistant keeps context. |
| **Pinned context** | **Pin** documents (from the data file list or from **Active context** paths) so they are **always** included in the AI context for every message. |
| **Pinned from context viewer** | After a reply, the “Active context” panel shows which files were used; you can **Pin** any of those paths (absolute paths supported). |
| **No context fallback** | If the index has no matches, the query is sent to the LLM without RAG context. |

**Command:** `./scripts/rag.sh chat "your question"` (CLI). In the UI, type in the input bar and click Send.

---

### 3.3 Planning Hub UI (Electron)

| Capability | Description |
|------------|-------------|
| **Chat** | Type questions; responses use RAG + pinned docs + history. |
| **Sidebar: external folders** | **Add folder to index** — pick directories to include in the index; list is stored and used for rebuild + watcher config. |
| **Sidebar: exclusions** | **Add exclusion** — directories to skip when indexing. |
| **Sidebar: Rebuild index** | Rebuilds the index with current data + external folders and exclusions; also updates `configs/watcher-dirs.txt` for the file watcher. |
| **Sidebar: data files** | List of files in `data/` with **Search** filter. |
| **Upload file** | Copy local `.md` (or other) files into `data/`. |
| **Drag-and-drop** | Drop files onto the sidebar to copy them into `data/`. |
| **View** | Open a data file in the chat area (rendered as Markdown or raw text). |
| **Pin / Unpin** | On each data file: **Pin** adds it to “Pinned to context”; **Unpin** removes it. Pinned docs are sent with every chat message. |
| **Pinned to context** | List of pinned items (data filenames or absolute paths); **Unpin** per item. |
| **Clear history** | Clears `data/chat_history.json` and the on-screen chat. |
| **Export planning doc** | Exports the current conversation to a Markdown file in `data/` (e.g. `plan-session-2025-03-16T12-00-00.md`). |
| **Active context & token usage** | Panel shows paths used for the last reply and an estimated token-usage bar (e.g. tokens / 8192). **Pin** on any path to pin that file for future messages. |
| **LLM offline banner** | If the LLM (llamacpp-droid on port 8080) is unreachable, a red banner appears; you can dismiss it or fix the connection and send again. |

---

### 3.4 File Watcher & Systemd

| Capability | Description |
|------------|-------------|
| **Watcher config** | `configs/watcher-dirs.txt` lists directories to watch (one path per line). UI writes this when you add folders or click Rebuild index; on load, if the file is missing and you have external folders, it is created once. |
| **watch.sh** | Watches all dirs in `watcher-dirs.txt` (or only `data/` if the file is missing); on any change, runs `./scripts/rag.sh build`. |
| **Systemd unit** | `configs/d1-watcher.service` (template with `@D1_PROJECT_ROOT@`). **install-watcher.sh** substitutes the real project path and installs to `~/.config/systemd/user/d1-watcher.service`. Then: `systemctl --user enable --now d1-watcher.service` to run the watcher in the background. |

So: **external folders are watched** as long as they are in `watcher-dirs.txt` (which the UI keeps in sync when you add folders or rebuild).

---

### 3.5 Install & Run

| Capability | Description |
|------------|-------------|
| **install.sh** | Full install by default: UI, Rust indexer, **desktop launcher**, **systemd watcher unit**, **d1 CLI**. Use `--no-launcher`, `--no-watcher`, `--no-cli` to skip any. |
| **install-to-opt** (root) | Install into **/opt/ops/d1**: creates `/opt/ops`, clones there if missing, then runs `./install` there. Pass `--no-*` to skip components. |
| **update.sh** | Pull from origin main, `npm install`, `cargo build --release`, then **refresh** launcher, watcher unit, and CLI so they point at the updated code. |
| **install-d1.sh** | Installs the “d1 Planning Hub” desktop entry in `~/.local/share/applications/` so the app appears in the application menu. |
| **install-watcher.sh** | Installs the systemd user unit with the correct project path. |
| **start** (root) | Starts the Electron app (`cd systems/d1-chat-ui && npm start`). |
| **stop** (root) | Stops the running Electron process. |
| **fine** (root) | Status: app running?, watcher running?, index present? |
| **d1** (CLI) | After `install-d1-cli.sh` or `install.sh --cli`: run `d1 start`, `d1 stop`, `d1 status`, `d1 build`, `d1 chat "..."`, `d1 update`, `d1 help` from any directory. |

**Recommended install location:** `/opt/ops/d1`. From any clone run **`./install --opt`** to create `/opt/ops`, clone there, and run the full install.

---

### 3.6 Portability & Configuration

| Capability | Description |
|------------|-------------|
| **No hardcoded paths** | Scripts resolve project root from script location or `D1_PROJECT_ROOT`. Systemd unit is generated with the real path by `install-watcher.sh`. |
| **Env-based config** | Index dir, data dir, scan dirs, exclude dirs, and LLM URL are set via environment variables (see below). |

---

## 4. Data Flow (One Message)

1. User types a message; optionally has **pinned** docs (data files or absolute paths).
2. UI calls main process → `rag.sh chat "<message>"` with `D1_PINNED_JSON` in env (if any pinned).
3. **rag.sh** runs the **query** binary with the message; gets JSON lines (path + content per chunk).
4. **rag.sh** passes message + chunk lines to **chat.py**.
5. **chat.py** loads `data/chat_history.json`, builds context from chunks + `D1_PINNED_JSON`, truncates if needed, sends messages to **llama.cpp** `POST /v1/chat/completions`.
6. **chat.py** appends user + assistant to history, saves JSON, prints response (+ optional token meta).
7. UI parses response and paths; shows reply, updates **Active context** and token bar; shows **Pin** on each context path.

---

## 5. Key Files & Directories

| Path | Purpose |
|------|---------|
| `systems/rust_indexer/` | Tantivy indexer (main) and query binary; reads `RAG_*` env. |
| `systems/d1-chat-ui/` | Electron app (main, renderer, preload, index.html). |
| `scripts/rag.sh` | build | query | chat. |
| `scripts/chat.py` | Builds context, calls llama.cpp, manages history. |
| `scripts/watch.sh` | inotify on dirs from `configs/watcher-dirs.txt` (or `data/`), runs `rag.sh build`. |
| `scripts/install.sh`, `install-d1.sh`, `install-watcher.sh`, `update.sh` | Install and update. |
| `configs/d1-watcher.service` | Systemd template. |
| `configs/watcher-dirs.txt` | Written by UI; list of dirs for watch.sh. |
| `data/` | User markdown, `chat_history.json`, exported planning docs. |
| `data/chat_history.json` | Conversation history for the LLM. |
| Index directory | By default `systems/rag/tantivy_index`; overridden by `RAG_INDEX_DIR`. |

---

## 6. Configuration

| Variable | Meaning | Default / usage |
|----------|---------|------------------|
| `D1_PROJECT_ROOT` | Project root (scripts, UI resolve from this or script path). | Inferred from script location. |
| `RAG_INDEX_DIR` | Where the Tantivy index is stored. | `$D1_PROJECT_ROOT/systems/rag/tantivy_index` |
| `RAG_DATA_DIR` | Default data directory for files and history. | `$D1_PROJECT_ROOT/data` |
| `RAG_SCAN_DIRS` | Comma-separated dirs to index (used by Rust indexer and UI when rebuilding). | Fallback: `RAG_DATA_DIR` |
| `RAG_EXCLUDE_DIRS` | Comma-separated dirs to exclude from indexing. | Empty |
| `D1_LLM_URL` | LLM server base URL (used by chat.py and UI LLM check). | `http://localhost:8080` |
| `D1_PINNED_JSON` | JSON array of `{path, content}` for pinned docs (set by UI when sending chat). | Set by Electron main process. |

---

## 7. Integration: llamacpp-droid

d1 does **not** run an LLM itself. It uses the **llama.cpp HTTP server** that you run via [llamacpp-droid](https://github.com/zerwiz/llamacpp-droid) (e.g. on port 8080). d1:

- Sends `POST /v1/chat/completions` with `messages` (system + history + current prompt with RAG + pinned context).
- Expects a JSON response with `choices[0].message.content`.

If the server is down, the UI shows the **LLM unavailable** banner and chat returns a connection error. See [INTEGRATION_LLAMACPP_DROID.md](./INTEGRATION_LLAMACPP_DROID.md) for details.

---

## 8. Quick Command Reference

### Terminal commands (from anywhere, after `d1` CLI install)

Install once from root: `./install` (includes CLI). Then from any directory:

| Command | Description |
|--------|--------------|
| `d1 start` | Start the Planning Hub (Electron). |
| `d1 stop` | Stop the Electron app. |
| `d1 status` | Status (app, watcher, index). |
| `d1 build` | Rebuild the RAG index. |
| `d1 query "term"` | Print matching chunks (JSON lines). |
| `d1 chat "question"` | RAG + LLM reply from CLI. |
| `d1 update` | Pull from GitHub and rebuild. |
| `d1 install [--launcher] [--watcher] [--cli]` | First-time install. |
| `d1 watcher` | Run file watcher in foreground. |
| `d1 help` | List all commands. |

### From repo root

| Command | Description |
|--------|--------------|
| `./install` | **Single install:** UI, Rust, launcher, watcher unit, d1 CLI. `./install --opt` for /opt/ops/d1. |
| `./update` | Pull, rebuild, refresh launcher, watcher, CLI. |
| `./start` | Start the Planning Hub. |
| `./stop` | Stop the app. |
| `./fine` | Status. |
| `./scripts/rag.sh build` | Rebuild the index. |
| `./scripts/rag.sh query "term"` | Matching chunks. |
| `./scripts/rag.sh chat "question"` | RAG + LLM. |

---

## 9. Related Docs

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | High-level intro and setup. |
| [PLANNING.md](./PLANNING.md) | High-level planning and AI engine. |
| [ROADMAP.md](./ROADMAP.md) | Phases and component overview. |
| [TODO.md](./TODO.md) | What’s done and what’s left. |
| [RAG_PLANNING.md](./RAG_PLANNING.md) | RAG design and constraints. |
| [INTEGRATION_LLAMACPP_DROID.md](./INTEGRATION_LLAMACPP_DROID.md) | d1 ↔ llamacpp-droid. |

---

*This overview is the single place for all d1 capabilities; update it when adding features or changing architecture.*
