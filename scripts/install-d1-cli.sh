#!/usr/bin/env bash
# Install d1 CLI to PATH so you can run 'd1 start', 'd1 stop', etc. from anywhere.
# Symlinks the repo's 'd1' script to ~/.local/bin/d1 (or $D1_CLI_BIN).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
D1_ROOT="$(dirname "$SCRIPT_DIR")"
D1_SCRIPT="$D1_ROOT/d1"
BIN_DIR="${D1_CLI_BIN_DIR:-$HOME/.local/bin}"
LINK_PATH="$BIN_DIR/d1"

# Resolve real paths for comparison
D1_SCRIPT_REAL="$(readlink -f "$D1_SCRIPT" 2>/dev/null || realpath "$D1_SCRIPT" 2>/dev/null || echo "$D1_SCRIPT")"
if [ -L "$LINK_PATH" ] 2>/dev/null; then
  LINK_TARGET="$(readlink -f "$LINK_PATH" 2>/dev/null || realpath "$LINK_PATH" 2>/dev/null)"
  if [ -n "$LINK_TARGET" ] && [ "$LINK_TARGET" = "$D1_SCRIPT_REAL" ]; then
    echo "d1 CLI already installed and points to this project."
    exit 0
  fi
fi

mkdir -p "$BIN_DIR"
ln -sf "$D1_SCRIPT" "$LINK_PATH"
echo "Installed: $LINK_PATH -> $D1_SCRIPT"
echo "Run from anywhere: d1 start | d1 stop | d1 status | d1 build | d1 chat \"question\" | d1 help"
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  echo "Add to PATH if needed: export PATH=\"$BIN_DIR:\$PATH\" (e.g. in ~/.bashrc)"
fi
