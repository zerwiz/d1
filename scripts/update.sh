#!/bin/bash
# Update d1: pull from GitHub main (if git repo), then reinstall UI deps and rebuild Rust.
# Run from repo root or from scripts/.

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

# Refresh launcher, systemd unit, and CLI so they point to updated code
echo "--- Refreshing launcher, watcher unit, and CLI ---"
"$SCRIPT_DIR/install-d1.sh" 2>/dev/null || true
"$SCRIPT_DIR/install-watcher.sh" 2>/dev/null || true
"$SCRIPT_DIR/install-d1-cli.sh" 2>/dev/null || true

echo ""
echo "Update complete. Launcher, watcher unit, and d1 CLI have been refreshed."
echo "Rebuild index if needed: d1 build   or   ./scripts/rag.sh build"
d1_pause_at_end 2>/dev/null || true
