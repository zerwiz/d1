#!/bin/bash
# First-time install: check deps, build UI and Rust indexer, optionally install desktop launcher.
# Run from repo root or from scripts/. Does not clone the repo (assumes you already have it).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
UI_DIR="$PROJECT_ROOT/systems/d1-chat-ui"
RUST_DIR="$PROJECT_ROOT/systems/rust_indexer"

cd "$PROJECT_ROOT"

echo "=== d1 Planning Hub — Install ==="
echo "Project root: $PROJECT_ROOT"
echo ""

# Optional: skip launcher install unless --launcher
INSTALL_LAUNCHER=false
for arg in "$@"; do
  if [ "$arg" = "--launcher" ]; then
    INSTALL_LAUNCHER=true
    break
  fi
done

# Prerequisites (warn only; still try to build)
missing=""
command -v cargo >/dev/null 2>&1 || missing="$missing cargo (Rust)"
command -v node  >/dev/null 2>&1 || missing="$missing node"
command -v npm   >/dev/null 2>&1 || missing="$missing npm"
command -v python3 >/dev/null 2>&1 || missing="$missing python3"
if [ -n "$missing" ]; then
  echo "Warning: missing recommended tools:$missing"
  echo "Install Rust, Node.js, and Python 3 for full functionality."
  echo ""
fi
if ! command -v inotifywait >/dev/null 2>&1; then
  echo "Optional: install inotify-tools for file watcher (e.g. sudo apt install inotify-tools)"
  echo ""
fi

# UI
echo "--- Installing UI dependencies ---"
mkdir -p "$UI_DIR"
cd "$UI_DIR"
npm install
cd "$PROJECT_ROOT"

# Rust
echo "--- Building Rust indexer ---"
cd "$RUST_DIR"
cargo build --release
cd "$PROJECT_ROOT"

# Initial index (optional, may be empty)
echo "--- Building index (optional) ---"
"$SCRIPT_DIR/rag.sh" build 2>/dev/null || true

if [ "$INSTALL_LAUNCHER" = true ]; then
  echo "--- Installing desktop launcher ---"
  "$SCRIPT_DIR/install-d1.sh"
fi

echo ""
echo "Install complete. Next steps:"
echo "  Run UI:    cd $UI_DIR && npm start"
echo "  Or from root: ./scripts/rag.sh build && ./scripts/rag.sh chat \"your question\""
echo "  Add launcher to app menu: $SCRIPT_DIR/install.sh --launcher"
echo "  Update project: $SCRIPT_DIR/update.sh"
