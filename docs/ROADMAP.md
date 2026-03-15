# Project d1: Planning Roadmap

This document outlines the full architecture and development phases for the **d1 Planning Hub**. The goal is a lightweight, local-first RAG system that uses **Rust** for speed and **Electron** for a professional planning interface.

---

## Project Architecture

The system is divided into three distinct layers.

1. **Data Layer:** Local markdown files and a Tantivy-based index.
2. **Engine Layer:** A Rust indexer for fast retrieval and a Python bridge to **llamacpp-droid**.
3. **UI Layer:** An Electron application providing chat, file management, and project planning tools.

---

## Phase 1: Core Backend (Completed)

- **Rust Indexer:** Built with Tantivy to scan the `/data` directory.
- **Subject Extraction:** Logic to extract titles from markdown `#` headers.
- **Retrieval Logic:** Query scripts that return absolute file paths for relevant context.
- **AI Bridge:** Python script (`chat.py`) connecting the indexer to the **llamacpp-droid** API on port **8080**.

---

## Phase 2: Electron UI & File Management (Completed)

- **Planning Hub UI:** Electron shell with chat and document sidebar.
- **Conversational Memory:** `chat_history.json` for long-term planning sessions.
- **File Operations:** Manual upload and drag-and-drop for markdown documents.
- **Search & Filter:** Real-time sidebar filtering.
- **Document Viewer:** View button to open and read files in the app.

---

## Phase 3: Advanced UX & Document Integration (In Progress)

- **Markdown Rendering:** Done — viewer uses `marked` to render `.md` files in the chat area; raw `<pre>` for non-markdown.
- **Automatic Re-indexing:** Done for `data/` via `scripts/watch.sh`; external folders not yet watched (see [TODO.md](./TODO.md)).
- **Context Pinning:** Not yet implemented — manually select documents to include in the AI context.

---

## Phase 4: System Stability & Deployment (Planned)

- **Relative Path Refactoring:** Ensure the project is portable (scripts use `D1_PROJECT_ROOT`; systemd unit path still to be made configurable — see [TODO.md](./TODO.md)).
- **Systemd Integration:** `d1-watcher.service` exists; make `ExecStart` path portable (install script or config).
- **Error Handling:** UI notifications when the **llamacpp-droid** container is offline (see [TODO.md](./TODO.md)).
- **Installation Script:** `scripts/install.sh` for first-time install; `scripts/update.sh` pulls from `origin main` and rebuilds (see [TODO.md](./TODO.md)). Optional: extend to install systemd unit.

---

## Component Overview

| Component   | Technology   | Path                    |
|------------|--------------|-------------------------|
| Indexer    | Rust (Tantivy) | `/systems/rust_indexer` |
| Interface  | Electron / Node | `/systems/d1-chat-ui`   |
| API Bridge | Python 3     | `/scripts/chat.py`      |
| Automation | Bash         | `/scripts/rag.sh`       |
| Storage    | Markdown / JSON | `/data`              |

---

## Related Docs

- [PLANNING.md](./PLANNING.md) — High-level system planning and AI engine.
- [TODO.md](./TODO.md) — **What’s done and what’s left** for the project to work fully.
- [RAG_PLANNING.md](./RAG_PLANNING.md) — RAG design and phases.
- [INTEGRATION_LLAMACPP_DROID.md](./INTEGRATION_LLAMACPP_DROID.md) — d1 ↔ llamacpp-droid flow.

---

*Keep this file updated as phases are completed or scope changes.*
