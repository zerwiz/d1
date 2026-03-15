#!/bin/bash
# Watch data directory and rebuild RAG index on changes. Resolves project root from script location.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_ROOT/data"
BUILD_SCRIPT="$SCRIPT_DIR/rag.sh"

mkdir -p "$DATA_DIR"
while inotifywait -r -e modify,create,delete "$DATA_DIR"; do
    "$BUILD_SCRIPT" build
done
