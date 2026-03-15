# d1 Planning Hub

d1 is a high-performance, local-first **Retrieval-Augmented Generation (RAG)** system designed specifically for project planning and document management. It combines a **Rust** indexing engine with an **Electron** UI to provide an AI-powered assistant that knows your files.

## Core Features

* **Recursive Chunking Indexer**: Built with Rust and Tantivy for sub-millisecond document retrieval using 1,000-character chunks to optimize context window usage.
* **Global Disk Scanning**: Index folders from anywhere on your computer with configurable exclusion lists (e.g., skip `node_modules`).
* **Conversational Planning**: Integrated Electron chat interface with persistent session memory.
* **llamacpp droid Integration**: Connects directly to local `llama.cpp` containers via port 8080 for 100% private inference.
* **Token Monitoring**: Real-time visual feedback of context window usage.
* **Planning Exports**: One-click export of AI brainstorming sessions into Markdown files.

## Project Structure

* **`systems/rust_indexer`**: The high-speed indexing engine.
* **`systems/d1-chat-ui`**: The Electron-based user interface.
* **Index**: The generated search index is written to a path set by `RAG_INDEX_DIR` (see `scripts/rag.sh`; often under `data/`).
* **`scripts`**: Automation for building, querying, and system installation.
* **`data`**: Default directory for project documents and session exports.

## Setup Instructions

**From repo root — one command:**

```bash
./install
```

This installs the UI, Rust indexer, desktop launcher, systemd watcher unit, and d1 CLI. To install into **/opt/ops/d1** (create /opt/ops, clone there, then install):

```bash
./install --opt
```

To skip parts: `./install --no-launcher`, `./install --no-watcher`, or `./install --no-cli`.

### 1. Prerequisites

Ensure you have the following installed:

* Rust & Cargo
* Node.js & npm
* Python 3
* `inotify-tools` (for the file watcher)
* [llamacpp droid](https://github.com/zerwiz/llamacpp-droid) (running on port 8080)

### 2. Install Dependencies

**Option A — from root (recommended):**

```bash
./install
```

Installs UI, Rust indexer, launcher, watcher unit, and d1 CLI. Use `./install --no-launcher`, `--no-watcher`, or `--no-cli` to skip parts.

**Option B — manual:** `cd systems/d1-chat-ui && npm install` then `cd ../rust_indexer && cargo build --release`; run `./install` for launcher/watcher/CLI.

### 3. Updating (pull and refresh everything)

```bash
./update
# or: d1 update
```

Pulls from GitHub, rebuilds, and refreshes launcher, watcher unit, and d1 CLI.

## Running the app

**From the application menu:** After `./install`, open **Show Applications** (or your app grid), search for **d1 Planning Hub**, and click to start. The launcher is installed to `~/.local/share/applications/`.

**From anywhere (terminal):** After `./install` (which installs the d1 CLI), run:

| Command | Description |
|--------|--------------|
| `d1 start` | Start the Planning Hub (Electron app). |
| `d1 stop` | Stop the running app. |
| `d1 status` | Show status: app, watcher, index. |
| `d1 build` | Rebuild the RAG index. |
| `d1 chat "question"` | Send a question from the CLI (RAG + LLM). |
| `d1 update` | Pull from GitHub and rebuild. |
| `d1 help` | List all commands. |

**From repo root:** `./start`, `./stop`, `./fine`, `./install`, `./update`.

## Usage

### Indexing Files

1. Open the **d1 Planning Hub** from your applications menu.
2. Use the **Add Folder** button in the sidebar to select your project directories.
3. Click **Rebuild Index** to process the files into chunks.

### Chatting & Planning

1. Type your query in the input bar. The AI will automatically retrieve relevant chunks from your indexed files.
2. View the **Active Context** panel to see exactly which documents the AI is reading.
3. Click **Export Planning Doc** to save the conversation as a new document.

### Maintenance

* **Clear History**: Resets the AI's conversation memory.
* **Exclusions**: Add sensitive folders to the exclusion list to keep them out of the index.
* **Pinned to context**: Use **Pin** on a data file to always include it in the AI context for every query; **Unpin** to remove.
* **LLM offline**: If llamacpp-droid is not running, a red banner appears; fix the connection and send again or dismiss the banner.

## Systemd Integration

To keep the index updated automatically in the background (watches `data/` and any external folders you added in the UI):

```bash
./scripts/install-watcher.sh
systemctl --user enable --now d1-watcher.service
```

Or use `./scripts/install.sh --watcher` during first-time install.

---

**Docs:** **[docs/SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md)** (all capabilities) · [docs/PLANNING.md](docs/PLANNING.md) · [docs/ROADMAP.md](docs/ROADMAP.md) · [docs/TODO.md](docs/TODO.md)
