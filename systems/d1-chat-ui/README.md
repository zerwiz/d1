# d1 Planning Hub (Chat UI)

Electron desktop app for **d1**: chat with your docs and run planning sessions. Uses the d1 RAG index (Rust) to find relevant files and sends context + your query to the **llama.cpp server** run by [llamacpp-droid](https://github.com/zerwiz/llamacpp-droid).

## Prerequisites

- **Node.js** 18+
- **d1** project with RAG index built (`scripts/rag.sh build`) and some `.md` files in `data/`
- **llamacpp-droid** running a container (e.g. on port 8080). Start the server via the droid before using the chat.

## Run

From the d1 repo root:

```bash
cd systems/d1-chat-ui
npm install
npm start
```

Or from repo root:

```bash
npm start --prefix systems/d1-chat-ui
```

## Flow

1. You type a question or planning request in the chat.
2. The app runs `scripts/rag.sh chat "<your query>"`.
3. The Rust indexer finds matching document paths; the Python bridge reads those files and POSTs context + query to the llama.cpp server (default `http://localhost:8080/v1/chat/completions`).
4. The AI response is shown in the chat.

## Global indexing (external folders & exclusions)

- **Add folder to index:** Use “Add folder to index” to pick directories anywhere on disk. They are stored in `localStorage` (`d1-folders`) and passed as `RAG_SCAN_DIRS` when rebuilding the index.
- **Exclusions:** Use “Add exclusion” to pick folders (e.g. `node_modules`, `.git`, private dirs) that the indexer will skip. Stored in `localStorage` (`d1-excludes`) and passed as `RAG_EXCLUDE_DIRS`.
- **Rebuild index:** “Rebuild index” runs `scripts/rag.sh build` with the current scan and exclude lists so the Rust index includes all selected folders and skips excluded ones. If no external folders are set, the project `data/` directory is used.

## Config

- **Server URL**: Set `D1_LLM_URL` (e.g. `http://localhost:8080`) if your llama.cpp server is not on the default. The Python script in `scripts/chat.py` reads this env var.

## Structure

| File       | Role |
|-----------|------|
| `main.js` | Electron main process; runs `scripts/rag.sh chat <query>` via spawn, exposes `chat:send` IPC. |
| `preload.js` | Exposes `window.api.sendChat(query)` to the renderer. |
| `index.html` | Chat layout and input. |
| `renderer.js` | Sends user message to main, appends AI response to chat. |
