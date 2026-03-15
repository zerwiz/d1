# Integration: d1 and llamacpp-droid

This document describes how **d1** uses **llamacpp-droid** as the AI engine: who runs what, and how RAG retrieval connects to the LLM.

---

## 1. Roles

| Component | Role |
|-----------|------|
| **llamacpp-droid** | Desktop app that runs and manages **llama.cpp** containers (Docker/Podman). It starts the **llama.cpp HTTP server** (e.g. on port 8080), streams logs, and can run swap presets and monitor GPU/processes. The droid does **not** host d1’s code; it only runs the LLM server. |
| **d1** | Holds the **RAG** pipeline: subject/title index, retrieve-by-query, file watcher. When an AI answer is needed, d1 (or a small client) sends **retrieved context + user query** to the same llama.cpp server the droid is running. |

So: **droid = AI engine (run the LLM server)**; **d1 = RAG (index + retrieve) + caller of that server**.

---

## 2. Flow

1. **You run the LLM server** via llamacpp-droid: start a container (e.g. `llamacpp`) so the llama.cpp HTTP server is up (e.g. `http://localhost:8080`).
2. **d1 builds and maintains** the subject/title index over your data (e.g. `data/`) and can run the file watcher so the index stays up to date.
3. **On a user query** (e.g. from a future d1 UI, CLI, or Cursor):
   - d1 **retrieves** relevant documents (RAG: lookup by subject/title, load only those files).
   - d1 (or a thin bridge) **calls the llama.cpp server** with the retrieved text as context and the user query (e.g. POST to `/v1/chat/completions`), same idea as the droid’s `rag:query`.
4. The **llama.cpp server** returns the completion; d1 (or the client) shows it to the user.

No duplicate LLM stack: one server (managed by the droid), one RAG (d1).

---

## 3. Endpoints and config

- **llama.cpp HTTP server** (run by the droid) typically exposes:
  - **`/v1/chat/completions`** — OpenAI-compatible chat completions; send retrieved context in the messages (e.g. system or user message).
  - **`/health`** — health check (droid’s Monitor tab uses this).
- **d1** should allow configuring the **server URL** (e.g. `http://localhost:8080`) and optionally the container name for reference; no need for d1 to run Docker itself.

---

## 4. References

- **llamacpp-droid repo**: [https://github.com/zerwiz/llamacpp-droid](https://github.com/zerwiz/llamacpp-droid)
- **llamacpp-droid behavior**: Root scripts (`ldroid`, `install.sh`, `update.sh`, `start.sh`, `stop.sh`), Electron app (main process runs Docker/Podman, find-gguf, monitor; preload exposes `logViewer`, `docker`, `findGguf`, `monitor`, and **`rag`** for query). The app’s `rag:query` IPC POSTs to the same llama.cpp server; d1’s integration mirrors that idea (retrieve in d1, then POST context + query).
- **d1 RAG**: [RAG_PLANNING.md](./RAG_PLANNING.md), [RAG_RETRIEVE_OPTIONS.md](./RAG_RETRIEVE_OPTIONS.md).

---

*Keep this file updated when the d1 ↔ droid flow or endpoints change.*
