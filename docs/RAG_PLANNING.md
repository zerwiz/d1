# RAG System – Planning Document

## 1. Goal

- **Single drop-in system**: Drop all files (focus on markdown) into one place.
- **Lightweight indexing**: The *indexing* of files should be ~50–100 lines of code; no heavy stack (e.g. no Elasticsearch for this scope).
- **Index by subject and title only**: Index is a small map (subject/title → file path). No full-content or large chunks in the index.
- **Load on demand**: System uses the index to find *where* to go; it only reads and pulls the full pages/documents it needs. If more context is needed, it retrieves additional documents.

## 2. Core Principles (from conversation)

- **Index only subject/title** – not full text or big chunks.
- **Only pull the pages you need** – open files by path when a query matches.
- **If the system needs more, it retrieves** – support multi-step retrieval (e.g. first match by subject, then load that file; optionally load more files if needed).

## 3. Index Design

The *indexing* of files (building this map) should stay lightweight: ~50–100 LOC, no heavy stack.

- **Format**: Simple JSON (or equivalent) map.
- **Keys**: Subject (and/or title), e.g. derived from first `# Heading` in each markdown file.
- **Values**: Absolute (or relative) file path to the document.
- **Optional**: Short description (e.g. first few lines) for better matching, without storing full content.

Example:

```json
{
  "Project Architecture": "/path/to/data/architecture.md",
  "API Endpoints": "/path/to/data/api.md"
}
```

## 4. Retrieval Flow

1. **Query** → Look up in the **subject/title index** (in memory or from a small index file).
2. **Match** → Get the file path(s) for matching subject/title (and description if used).
3. **Load** → Read **only** those file(s) from disk and return content (e.g. to an LLM or caller).
4. **Need more?** → Run another retrieval (e.g. different query or broader match) and load additional pages as needed.
5. **LLM (optional)** → Send retrieved context + user query to the **llama.cpp server** run by [llamacpp-droid](https://github.com/zerwiz/llamacpp-droid) (e.g. POST `/v1/chat/completions`). See [INTEGRATION_LLAMACPP_DROID.md](./INTEGRATION_LLAMACPP_DROID.md).

No full-document or large-chunk storage in the index; the index is only a “map” to where to read from.

## 5. File Watcher / Drive Indexing

- **Requirement**: System must be able to “read the drive” and index files (at least from a configured data directory).
- **Mechanism**: Use a file watcher (e.g. Linux `inotify` via `inotify-tools`) on the data directory.
- **On event** (create/modify/delete): Re-run the indexer (e.g. `build_subject_index()`) so the index stays up to date.
- **Optional**: Run the watcher as a permanent background service (e.g. systemd unit or background script).

## 6. Build vs. Open Source

**Decision: build the RAG in Cursor (custom solution).**

- **Total control**: Architecture and folder structure match d1’s rules; no external product’s layout.
- **Zero bloat**: Only subject/title indexing and on-demand load; no Docker, vector DBs, or heavy ML stacks.
- **Fits the spec**: Pre-made tools (Khoj, AnythingLLM, txtai, etc.) add UIs, containers, or semantic chunking we don’t need for the minimal drop-in goal.
- **When to reconsider**: If we later need complex file types (PDF, spreadsheets), advanced chunking, or a ready-made web UI, we can evaluate Khoj, AnythingLLM, or txtai as a separate track.

## 7. Technology Choices (from conversation)

- **Custom script (Python)** – acceptable for the indexer; keep indexing logic ~50–100 LOC.
- **Alternatives considered**:
  - **txtai** – semantic search, local; good if we later want vectors.
  - **LlamaIndex** – file retrieval, markdown reader; more features than needed for minimal version.
  - **Khoj** – local markdown indexing; useful if we want a full app.
  - **Whoosh** – full-text search in Python; possible if we need richer text search later.
  - **Elasticsearch** – rejected for this scope (heavy, overkill for one folder of markdown).

**Decision**: Start with a **minimal custom implementation** (subject/title index + on-demand file load). Revisit txtai/LlamaIndex if we add semantic or chunk-based retrieval later.

## 8. Repo Placement (per project rules)

- **Code**: Under `/systems/` (e.g. `rag-service/` or `systems/rag/`) with its own README.
- **Data**: Configurable directory (e.g. `data/` next to the service or under `/configs` or env-defined).
- **Scripts**: Indexer and watcher can live in the RAG service folder; optional symlink or wrapper in `/scripts` (e.g. `scripts/index-rag.sh`, `scripts/watch-rag.sh`) for convenience.
- **Config**: Paths (data dir, index file) in env or small config (e.g. in `/configs` or `boot`).

## 9. Deliverables / Phases

| Phase | Deliverable | Notes |
|-------|-------------|--------|
| **1** | Subject/title index builder | Scan data dir, extract subject (e.g. first `#` line), write index JSON. **~50–100 LOC; no heavy stack.** |
| **2** | Retrieve-by-query function | Load index, match query to subject/title (and description if present), return paths; then load full content only for those paths. |
| **3** | CLI or minimal API | e.g. `python rag.py build`, `python rag.py query "search term"` or equivalent. |
| **4** | File watcher script | inotify on data dir → run indexer on change; document dependency `inotify-tools`. |
| **5** | (Optional) Service setup | Document or script to run watcher as background/service. |
| **6** | (Later) LLM integration | Optional: call LLM API with retrieved text (as in Gemini suggestion). |

## 10. Out of Scope (for minimal version)

- Full-text or vector index of entire document body.
- Elasticsearch or other heavy search engines.
- Storing large chunks in the index.

## 11. Success Criteria

- User can drop markdown files into one directory.
- Index is built and updated (manually or via watcher) with subject/title (and optional short description) only.
- A query uses the index to find relevant paths, then only those files are read and returned.
- Indexing logic (build index from files) stays ~50–100 lines; watcher and retrieval glue can be extra.

---

*Keep this document updated when changing RAG design or adding phases.*
