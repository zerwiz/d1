# RAG Phase 2: Retrieve-by-Query – Implementation Options

This document describes two ways to implement the retrieve-by-query function (Phase 2). Both load the index, match the query against titles, and read **only** the matching files.

---

## Option A: Add to `indexer.py` (single module)

Keep index build and retrieve in one file. Call `retrieve()` from other code (e.g. API, CLI, or LLM pipeline).

### Add this function to `indexer.py`

```python
def retrieve(query: str, index_path: str, data_dir: str) -> list[str]:
    """Load index, match query to titles, return full content of matching files only."""
    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)
    results = []
    q = query.lower()
    for title, path in index.items():
        if q in title.lower():
            with open(path, 'r', encoding='utf-8') as f:
                results.append(f.read())
    return results
```

### Usage from code

```python
from indexer import build_index, retrieve

# Build index (e.g. on startup or via watcher)
build_index('/path/to/data', '/path/to/rag/index.json')

# Retrieve only matching pages
pages = retrieve("architecture", "/path/to/rag/index.json", "/path/to/data")
for doc in pages:
    print(doc)
```

### When to use

- You want one module for both indexing and retrieval.
- You call `retrieve()` from another script, service, or API.
- You don’t need a dedicated CLI for retrieval.

---

## Option B: Standalone `retrieve.py` (separate script + CLI)

Use a separate script so you can run retrieval from the command line. Indexer stays focused on building the index.

### Create `retrieve.py` in the same `systems/rag` folder

```python
"""Phase 2: Retrieve by query – load only matching pages from index."""
import json
import os
import sys

ROOT = os.environ.get('D1_PROJECT_ROOT', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
INDEX_FILE = os.environ.get('RAG_INDEX', os.path.join(ROOT, 'systems', 'rag', 'index.json'))

def retrieve(query: str) -> list[str]:
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        index = json.load(f)
    results = []
    q = query.lower()
    for title, path in index.items():
        if q in title.lower():
            with open(path, 'r', encoding='utf-8') as f:
                results.append(f.read())
    return results

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 retrieve.py <query>")
        sys.exit(1)
    for doc in retrieve(sys.argv[1]):
        print(doc)
        print("---")
```

### Usage from shell

```bash
# From project root (set D1_PROJECT_ROOT if not running from repo root)
# Build index first
python3 systems/rag/indexer.py

# Query by term (only matching files are read)
python3 systems/rag/retrieve.py "architecture"
python3 systems/rag/retrieve.py "API"
```

### When to use

- You want a small CLI for ad-hoc queries.
- You prefer to keep indexer and retriever in separate files.
- You might reuse `retrieve.py` in scripts or automation.

---

## Comparison

| Aspect | Option A (in indexer.py) | Option B (retrieve.py) |
|--------|---------------------------|-------------------------|
| **Files** | One module | Two modules |
| **CLI** | No built-in; you add one if needed | Yes: `python3 retrieve.py <query>` |
| **Import** | `from indexer import retrieve` | `from retrieve import retrieve` or run as script |
| **Paths** | Passed as arguments | Hardcoded in script (can be moved to env/config) |
| **Best for** | Libraries, APIs, embedded use | Quick queries, scripting, clarity of roles |

---

## Optional: Configurable paths

For either option, you can read paths from environment variables instead of hardcoding:

```python
import os

ROOT = os.environ.get('D1_PROJECT_ROOT', '.')
INDEX_FILE = os.environ.get('RAG_INDEX', os.path.join(ROOT, 'systems', 'rag', 'index.json'))
DATA_DIR = os.environ.get('RAG_DATA', os.path.join(ROOT, 'data'))
```

Then set `RAG_INDEX` and `RAG_DATA` in your environment or in a config (e.g. in `/configs` or `boot`).

---

*See [RAG_PLANNING.md](./RAG_PLANNING.md) for full RAG design and phases.*
