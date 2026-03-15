#!/bin/bash
# Update d1: pull from GitHub main (if git repo), then reinstall UI deps and rebuild Rust.
# Run from repo root or from scripts/.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
UI_DIR="$PROJECT_ROOT/systems/d1-chat-ui"
RUST_DIR="$PROJECT_ROOT/systems/rust_indexer"

cd "$PROJECT_ROOT"

echo "=== d1 Planning Hub — Update ==="
echo "Project root: $PROJECT_ROOT"
echo ""

# Pull from origin main if this is a git repo
if [ -d ".git" ]; then
  echo "--- Git pull (origin main) ---"
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [ -n "$branch" ]; then
    git fetch origin main 2>/dev/null || true
    git pull origin main 2>/dev/null || { git pull 2>/dev/null || true; }
    echo "Pulled latest (tracking main). Current branch: $branch"
  else
    echo "Not a git repo or no branch; skipping pull."
  fi
  echo ""
else
  echo "Not a git repository; skipping pull."
  echo ""
fi

# UI
echo "--- Updating UI dependencies ---"
cd "$UI_DIR"
npm install
cd "$PROJECT_ROOT"

# Rust
echo "--- Rebuilding Rust indexer ---"
cd "$RUST_DIR"
cargo build --release
cd "$PROJECT_ROOT"

echo ""
echo "Update complete. Rebuild index if needed: ./scripts/rag.sh build"
echo "If you use the desktop launcher, re-run: ./scripts/install-d1.sh"
