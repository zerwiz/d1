# Documentation

Purpose, structure, and usage of project documentation.

## Purpose

- **High-level planning**: Architecture, systems overview, integration notes.
- **Per-system planning**: Detailed design and roadmap for each major system (e.g. RAG).

## Structure

| File | Purpose |
|------|--------|
| [PLANNING.md](./PLANNING.md) | Central high-level system planning; AI engine (llamacpp-droid), systems list, timelines. |
| [ROADMAP.md](./ROADMAP.md) | Planning Hub architecture, Phase 1–4 roadmap, component overview. |
| [TODO.md](./TODO.md) | What’s done and what’s left for the project to work fully; actionable remaining tasks. |
| [INTEGRATION_LLAMACPP_DROID.md](./INTEGRATION_LLAMACPP_DROID.md) | How d1 uses llamacpp-droid as the AI engine: RAG retrieval → llama.cpp server. |
| [RAG_PLANNING.md](./RAG_PLANNING.md) | RAG system: subject/title index, on-demand retrieval, file watcher, phases. **Primary RAG design.** |
| [RAG_RETRIEVE_OPTIONS.md](./RAG_RETRIEVE_OPTIONS.md) | Phase 2 retrieve-by-query: Option A (add to indexer) vs Option B (standalone script + CLI). |

**Apps:** [systems/d1-chat-ui/README.md](../systems/d1-chat-ui/README.md) — Electron chat UI (RAG + llamacpp-droid).

**Archive** (not active context for AI): [archive/RAG_RUST_TANTIVY.md](./archive/RAG_RUST_TANTIVY.md) – optional Rust + Tantivy path; kept for reference only.

## Usage

- Start with `PLANNING.md` for overview and links to system-specific docs.
- Use `RAG_PLANNING.md` when implementing or changing the RAG (drop-in files, index, retrieval, watcher). The **primary implementation path** is the minimal Python JSON indexer described there and in `RAG_RETRIEVE_OPTIONS.md`.

Keep these files updated when architecture or system design changes.
