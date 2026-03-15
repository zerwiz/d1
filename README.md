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

### 1. Prerequisites

Ensure you have the following installed:

* Rust & Cargo
* Node.js & npm
* Python 3
* `inotify-tools` (for the file watcher)
* [llamacpp droid](https://github.com/zerwiz/llamacpp-droid) (running on port 8080)

### 2. Install Dependencies

**Option A — one-shot install (recommended):**

```bash
./scripts/install.sh
```

To also add the desktop launcher to your app menu:

```bash
./scripts/install.sh --launcher
```

**Option B — manual steps:**

```bash
cd systems/d1-chat-ui && npm install
cd ../rust_indexer && cargo build --release
./scripts/install-d1.sh   # optional: desktop launcher
```

### 3. Updating (pull from GitHub and rebuild)

```bash
./scripts/update.sh
```

This runs `git pull origin main`, then `npm install` and `cargo build --release`. Re-run `./scripts/install-d1.sh` if you use the desktop launcher.

## Running the app (from repo root)

| Command | Description |
|--------|--------------|
| `./start` | Start the d1 Planning Hub (Electron app). |
| `./stop` | Stop the running Electron app. |
| `./fine` | Show status: app, watcher, index. |

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

## Systemd Integration

To keep the index updated automatically in the background:

```bash
# Copy the unit file if needed (see configs/d1-watcher.service)
systemctl --user enable --now d1-watcher.service
```

---

**Docs:** [docs/PLANNING.md](docs/PLANNING.md) · [docs/ROADMAP.md](docs/ROADMAP.md) · **[docs/TODO.md](docs/TODO.md)** (what’s left to do for full operation)
