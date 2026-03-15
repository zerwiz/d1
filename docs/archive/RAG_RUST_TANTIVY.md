# RAG: Rust Indexer with Tantivy (Optional Path)

**Archived.** The primary RAG path for d1 is the minimal Python JSON indexer; see [RAG_PLANNING.md](../RAG_PLANNING.md) and [RAG_RETRIEVE_OPTIONS.md](../RAG_RETRIEVE_OPTIONS.md). This doc is kept for reference only.

This document describes an **alternative, optimized** indexing path using **Rust** and **Tantivy**: a single binary, fast, low-memory indexer suitable for feeding a local model without heavy infrastructure.

**Tradeoff vs. minimal plan ([RAG_PLANNING.md](../RAG_PLANNING.md))**: This approach uses a full-text search engine (Tantivy) and more code than the ~50–100 LOC JSON indexer. Use it when you want maximum speed, a single deployable binary, and optional vector embeddings (e.g. FastEmbed) later.

---

## Why Rust + Tantivy

- **Single binary** – compiles to one executable; no Python/runtime on the server.
- **Fast, minimal memory** – good for indexing large sets of markdown files.
- **Fits local-model pipelines** – no heavy infra; can run next to a local LLM.

---

## Recommended Rust Tools

| Tool | Purpose |
|------|--------|
| **Tantivy** | Full-text search engine (Lucene-style). Handles subject/title indexing and querying. [GitHub](https://github.com/quickwit-oss/tantivy) |
| **FastEmbed** (optional) | Vector embeddings locally; no GPU or heavy ML stack. For chunking markdown and feeding a local model. [GitHub](https://github.com/Anush008/fastembed-rs) |

---

## Project Setup

Create the Rust project under your systems directory. Use project root from env (e.g. `D1_PROJECT_ROOT`) so paths are portable:

```bash
# From repo root; or set D1_PROJECT_ROOT to the path of the d1 repo
cargo new systems/rust_indexer
```

**`Cargo.toml`** – dependencies:

```toml
[package]
name = "rust_indexer"
version = "0.1.0"
edition = "2021"

[dependencies]
tantivy = "0.22.0"
walkdir = "2.4.0"
```

Create the Tantivy index directory and binary location (run from project root or set `D1_PROJECT_ROOT`):

```bash
mkdir -p systems/rag/tantivy_index
mkdir -p systems/rust_indexer/src/bin
```

---

## Indexing (Phase 1)

Core indexing logic in `src/main.rs`: walk the data directory, index each `.md` file with **title** (e.g. filename or first `#` line) and **path** (stored for retrieval).

**Note:** The sample below uses **filename** as title. To align with [RAG_PLANNING.md](../RAG_PLANNING.md) (subject = first `# ` line), replace the title with the first line that starts with `# `, or add a small helper that reads the first few lines.

```rust
use tantivy::schema::{Schema, TEXT, STORED};
use tantivy::{doc, Index};
use walkdir::WalkDir;
use std::fs;
use std::path::Path;

fn main() -> tantivy::Result<()> {
    let mut schema_builder = Schema::builder();
    let title = schema_builder.add_text_field("title", TEXT | STORED);
    let path = schema_builder.add_text_field("path", STORED);
    let schema = schema_builder.build();

    let root = std::env::var("D1_PROJECT_ROOT").unwrap_or_else(|_| ".".into());
    let index_path = Path::new(&root).join("systems/rag/tantivy_index");
    fs::create_dir_all(&index_path)?;
    let index = Index::create_in_dir(&index_path, schema.clone())?;

    let mut index_writer = index.writer(50_000_000)?;
    let data_dir = Path::new(&root).join("data");

    for entry in WalkDir::new(&data_dir).into_iter().filter_map(|e| e.ok()) {
        if entry.path().extension().map_or(false, |ext| ext == "md") {
            let file_path = entry.path().to_string_lossy().to_string();
            let file_name = entry.file_name().to_string_lossy().to_string();

            index_writer.add_document(doc!(
                title => file_name,
                path => file_path
            ))?;
        }
    }

    index_writer.commit()?;
    Ok(())
}
```

Run to build the index:

```bash
cargo run --release
```

---

## Querying the Index (Phase 2)

Query the Tantivy index: parse the query against the **title** field, get top matches, then output the stored **path** for each hit. The caller can then read only those files—*only pull the pages you need*.

Create the query binary (separate from the indexer so you can run indexer and searcher independently):

```bash
touch systems/rust_indexer/src/bin/query.rs
```

**`src/bin/query.rs`** (search term from command line):

```rust
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::Index;
use std::env;
use std::path::Path;

fn main() -> tantivy::Result<()> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: query <search_term>");
        std::process::exit(1);
    }

    let query_string = &args[1];

    let root = std::env::var("D1_PROJECT_ROOT").unwrap_or_else(|_| ".".into());
    let index_path = Path::new(&root).join("systems/rag/tantivy_index");
    let index = Index::open_in_dir(&index_path)?;

    let schema = index.schema();
    let title = schema.get_field("title").unwrap();
    let path_field = schema.get_field("path").unwrap();

    let reader = index.reader()?;
    let searcher = reader.searcher();

    let query_parser = QueryParser::for_index(&index, vec![title]);
    let query = query_parser.parse_query(query_string)?;

    let top_docs = searcher.search(&query, &TopDocs::with_limit(5))?;

    for (_score, doc_address) in top_docs {
        let retrieved_doc = searcher.doc(doc_address)?;
        let file_path = retrieved_doc.get_first(path_field).unwrap().as_text().unwrap();
        println!("{}", file_path);
    }

    Ok(())
}
```

Run the query from project root (pass search term as argument; set `D1_PROJECT_ROOT` if not in repo root):

```bash
cargo run --manifest-path systems/rust_indexer/Cargo.toml --bin query "architecture"
```

---

## Shell script: build and query (automation)

Single script to run the indexer or the query binary from the project root.

Create the scripts directory and script file (from repo root):

```bash
mkdir -p scripts
touch scripts/rag.sh
chmod +x scripts/rag.sh
```

**`scripts/rag.sh`** (uses `D1_PROJECT_ROOT`; default is script’s repo root):

```bash
#!/bin/bash
D1_PROJECT_ROOT="${D1_PROJECT_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
PROJECT_DIR="$D1_PROJECT_ROOT/systems/rust_indexer"

if [ "$1" == "build" ]; then
    cargo run --manifest-path "$PROJECT_DIR/Cargo.toml"
elif [ "$1" == "query" ]; then
    if [ -z "$2" ]; then
        echo "Please provide a search term."
        exit 1
    fi
    cargo run --manifest-path "$PROJECT_DIR/Cargo.toml" --bin query "$2"
else
    echo "Usage: $0 {build|query <term>}"
    exit 1
fi
```

**Usage (from repo root or with `D1_PROJECT_ROOT` set):**

```bash
# Index all markdown files (build)
scripts/rag.sh build

# Search the index
scripts/rag.sh query "architecture"
```

---

## File watcher script (Phase 4)

Monitor the data directory and rebuild the index when files change (create, modify, delete). Requires **inotify-tools** on your system.

Install (if needed):

```bash
# Debian/Ubuntu
sudo apt-get install inotify-tools
```

Create and make executable (from repo root):

```bash
touch scripts/watch.sh
chmod +x scripts/watch.sh
```

**`scripts/watch.sh`** (uses `D1_PROJECT_ROOT`; default is script’s repo root):

```bash
#!/bin/bash
D1_PROJECT_ROOT="${D1_PROJECT_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
DATA_DIR="${DATA_DIR:-$D1_PROJECT_ROOT/data}"
BUILD_SCRIPT="$D1_PROJECT_ROOT/scripts/rag.sh build"
while inotifywait -r -e modify,create,delete "$DATA_DIR"; do
    $BUILD_SCRIPT
done
```

Run manually from repo root (foreground):

```bash
scripts/watch.sh
```

---

## systemd user service (Phase 5)

Run the watcher as a **user** service so it starts in the background and survives logouts. It will restart automatically if it exits.

Create the user service directory and unit file. Use `D1_PROJECT_ROOT` in the unit (e.g. set in `Environment=` or run from repo):

```bash
mkdir -p ~/.config/systemd/user
touch ~/.config/systemd/user/d1-watcher.service
```

**`~/.config/systemd/user/d1-watcher.service`** (set `D1_PROJECT_ROOT` to your d1 repo path):

```ini
[Unit]
Description=d1 RAG File Watcher
After=network.target

[Service]
Type=simple
Environment=D1_PROJECT_ROOT=/path/to/your/d1
ExecStart=/path/to/your/d1/scripts/watch.sh
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
```

Reload, enable, and start:

```bash
systemctl --user daemon-reload
systemctl --user enable d1-watcher.service
systemctl --user start d1-watcher.service
```

Check status:

```bash
systemctl --user status d1-watcher.service
```

Use `stop` / `disable` to turn the watcher off.

---

## Optional: Title from first `# ` line

To match the RAG plan (subject = first `# ` line in the file), replace the filename-based title with a helper:

```rust
fn extract_title(path: &Path) -> String {
    if let Ok(s) = fs::read_to_string(path) {
        for line in s.lines() {
            let t = line.trim();
            if t.starts_with("# ") {
                return t.trim_start_matches("# ").trim().to_string();
            }
        }
    }
    path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_string()
}
```

Then when indexing, use `title => extract_title(entry.path())` instead of `title => file_name`.

---

## Summary

| Step | Command / file |
|------|-----------------|
| Create project | `cargo new .../systems/rust_indexer` |
| Index (build) | `rag.sh build` or `cargo run --manifest-path .../Cargo.toml` |
| Query (retrieve) | `rag.sh query "term"` or `cargo run --manifest-path .../Cargo.toml --bin query "term"` |
| Watcher (manual) | `watch.sh` (run in foreground); requires `inotify-tools` |
| Watcher (service) | `systemctl --user enable --now d1-watcher.service`; status: `systemctl --user status d1-watcher.service` |

The query binary loads only the **paths** of matching documents from the index and prints them; the caller can then read only those files—no full scan, no heavy stack beyond Tantivy.

For the minimal, ~50–100 LOC indexer (JSON + Python), see [RAG_PLANNING.md](../RAG_PLANNING.md) and [RAG_RETRIEVE_OPTIONS.md](../RAG_RETRIEVE_OPTIONS.md).
