#!/bin/bash
# RAG indexer: build, query, or chat. Uses dynamic project root and env vars.
D1_PROJECT_ROOT="${D1_PROJECT_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
export RAG_INDEX_DIR="${RAG_INDEX_DIR:-$D1_PROJECT_ROOT/systems/rag/tantivy_index}"
export RAG_DATA_DIR="${RAG_DATA_DIR:-$D1_PROJECT_ROOT/data}"
PROJECT_DIR="$D1_PROJECT_ROOT/systems/rust_indexer"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$1" == "build" ]; then
    cargo run --manifest-path "$PROJECT_DIR/Cargo.toml" --release
elif [ "$1" == "query" ]; then
    if [ -z "$2" ]; then
        echo "Usage: $0 query <search_term>"
        exit 1
    fi
    cargo run --manifest-path "$PROJECT_DIR/Cargo.toml" --release --bin query -- "$2"
elif [ "$1" == "chat" ]; then
    if [ -z "$2" ]; then
        echo "Usage: $0 chat <query>"
        exit 1
    fi
    query="$2"
    echo "Searching index for: $query" >&2
    # Query outputs one JSON object per line (path + content per chunk)
    chunks_out=$(cargo run --quiet --manifest-path "$PROJECT_DIR/Cargo.toml" --release --bin query -- "$query" 2>/dev/null)
    echo "D1_PATHS_START"
    echo "$chunks_out"
    echo "D1_PATHS_END"
    if [ -z "$chunks_out" ]; then
        echo "No matching chunks found. Sending query without context." >&2
    else
        echo "Sending chunks to llamacpp-droid..." >&2
    fi
    readarray -t chunks_arr <<< "$chunks_out"
    python3 "$SCRIPT_DIR/chat.py" "$query" "${chunks_arr[@]}"
else
    echo "Usage: $0 {build|query <term>|chat <query>}"
    exit 1
fi
