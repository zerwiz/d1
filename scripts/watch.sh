#!/bin/bash
# Watch configured dirs (data/ + external folders) and rebuild RAG index on changes.
# Reads configs/watcher-dirs.txt (one path per line); falls back to data/ if missing.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
. "$SCRIPT_DIR/banner.sh" 2>/dev/null || true
d1_banner 2>/dev/null || true

CONFIG="$PROJECT_ROOT/configs/watcher-dirs.txt"
DATA_DIR="$PROJECT_ROOT/data"
BUILD_SCRIPT="$SCRIPT_DIR/rag.sh"

mkdir -p "$DATA_DIR"
mkdir -p "$(dirname "$CONFIG")"

# Build list of dirs to watch: config file if present, else data only
if [ -f "$CONFIG" ]; then
  dirs=()
  while IFS= read -r line; do
    line="${line%%#*}"
    line="$(echo "$line" | tr -d ' \t\r\n')"
    [ -n "$line" ] && [ -d "$line" ] && dirs+=("$line")
  done < "$CONFIG"
fi
if [ "${#dirs[@]}" -eq 0 ]; then
  dirs=("$DATA_DIR")
fi

echo "Watching: ${dirs[*]}"
export D1_PROJECT_ROOT="$PROJECT_ROOT"
while true; do
  inotifywait -r -e modify,create,delete "${dirs[@]}"
  "$BUILD_SCRIPT" build
done
