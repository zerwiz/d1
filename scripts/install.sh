#!/bin/bash
# First-time install: check deps, build UI and Rust indexer, optionally install desktop launcher.
# Run from repo root or from scripts/. Does not clone the repo (assumes you already have it).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
UI_DIR="$PROJECT_ROOT/systems/d1-chat-ui"
RUST_DIR="$PROJECT_ROOT/systems/rust_indexer"
. "$SCRIPT_DIR/banner.sh" 2>/dev/null || true

cd "$PROJECT_ROOT"
d1_banner 2>/dev/null || true
echo "Project root: $PROJECT_ROOT"
echo ""

# By default install everything (launcher, watcher, CLI). Use --no-* to skip.
INSTALL_LAUNCHER=true
INSTALL_WATCHER=true
INSTALL_CLI=true
for arg in "$@"; do
  if [ "$arg" = "--no-launcher" ]; then INSTALL_LAUNCHER=false; fi
  if [ "$arg" = "--no-watcher" ]; then INSTALL_WATCHER=false; fi
  if [ "$arg" = "--no-cli" ]; then INSTALL_CLI=false; fi
  # Legacy: still support explicit opt-in
  if [ "$arg" = "--launcher" ]; then INSTALL_LAUNCHER=true; fi
  if [ "$arg" = "--watcher" ]; then INSTALL_WATCHER=true; fi
  if [ "$arg" = "--cli" ]; then INSTALL_CLI=true; fi
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

# Initial index only if not already present
INDEX_DIR="${RAG_INDEX_DIR:-$PROJECT_ROOT/systems/rag/tantivy_index}"
if [ -d "$INDEX_DIR" ] && ls "$INDEX_DIR" 2>/dev/null | grep -q .; then
  echo "--- Index already present, skipping initial build ---"
else
  echo "--- Building index (optional) ---"
  "$SCRIPT_DIR/rag.sh" build 2>/dev/null || true
fi

if [ "$INSTALL_LAUNCHER" = true ]; then
  echo "--- Installing desktop launcher ---"
  "$SCRIPT_DIR/install-d1.sh"
fi

if [ "$INSTALL_WATCHER" = true ]; then
  echo "--- Installing systemd watcher unit ---"
  "$SCRIPT_DIR/install-watcher.sh"
fi

if [ "$INSTALL_CLI" = true ]; then
  echo "--- Installing d1 CLI to PATH ---"
  "$SCRIPT_DIR/install-d1-cli.sh"
fi

echo ""
echo "Install complete. Installed: UI + Rust indexer + index"
[ "$INSTALL_LAUNCHER" = true ] && echo "  + desktop launcher (app menu + taskbar icon)"
[ "$INSTALL_WATCHER" = true ] && echo "  + systemd watcher unit"
[ "$INSTALL_CLI" = true ] && echo "  + d1 CLI (d1 start, d1 stop, ...)"
echo ""
echo "Next steps:"
echo "  Start from application menu: open Show Applications, search 'd1 Planning Hub', click to run"
echo "  Or from terminal:  d1 start   (or: ./start)"
echo "  Enable watcher: systemctl --user enable --now d1-watcher.service"
echo "  Update later: d1 update   (or: ./scripts/update.sh)"
d1_pause_at_end 2>/dev/null || true
