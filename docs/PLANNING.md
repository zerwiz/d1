# High-Level System Planning

## Overview

This document tracks high-level architecture, timelines, and integration notes for the d1 project.

## AI Engine

**llamacpp-droid** ([github.com/zerwiz/llamacpp-droid](https://github.com/zerwiz/llamacpp-droid)) is the **AI engine** for d1. The droid is a desktop app (Electron) that runs and manages llama.cpp containers (Docker/Podman) and streams their logs. d1 does **not** run its own LLM server; it uses the **llama.cpp HTTP server** that you start and manage via llamacpp-droid. RAG in d1 retrieves relevant documents; when an LLM response is needed, d1 (or a thin client) sends the retrieved context + user query to that server (e.g. `/v1/chat/completions`). See [INTEGRATION_LLAMACPP_DROID.md](./INTEGRATION_LLAMACPP_DROID.md) for flow and endpoints.

## Systems

| System | Purpose | Status | Doc |
|--------|---------|--------|-----|
| **RAG (Retrieval-Augmented Generation)** | Drop-in file store with subject/title index; AI finds where to go, then loads only needed pages. Feeds into the droid’s llama.cpp server for completions. | In progress | [RAG_PLANNING.md](./RAG_PLANNING.md) |
| **d1-chat-ui** | Electron chat interface: ask about your docs and run planning sessions. Calls `scripts/rag.sh chat` (Rust index + Python bridge → llama.cpp server). | In progress | [systems/d1-chat-ui/README.md](../systems/d1-chat-ui/README.md) |

## Integration Notes

- RAG will live under `/systems/` (e.g. `rag-service` or dedicated module).
- Data directory for user-dropped files and index output will be configurable (e.g. `/data` or project-specific path).
- **LLM/completions**: Use the llama.cpp server run by llamacpp-droid (same server the droid uses for its RAG/chat). Configure server URL (e.g. `http://localhost:8080`) in d1 when calling the API.

## Timelines & Roadmap

- **RAG**: See [RAG_PLANNING.md](./RAG_PLANNING.md) for phases and milestones.
- **Full roadmap**: See [ROADMAP.md](./ROADMAP.md) for architecture, Phase 1–4, and component overview.

---

*Keep this file updated when adding systems or changing architecture.*
