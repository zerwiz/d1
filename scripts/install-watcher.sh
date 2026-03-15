#!/usr/bin/env bash
# Install d1 file-watcher systemd user unit with project path substituted.
# Run from repo root or scripts/. Creates ~/.config/systemd/user/d1-watcher.service.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIGS_DIR="$PROJECT_ROOT/configs"
TEMPLATE="$CONFIGS_DIR/d1-watcher.service"
SYSTEMD_USER_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT_DEST="$SYSTEMD_USER_DIR/d1-watcher.service"

# Skip if already installed for this project
if [ -f "$UNIT_DEST" ] && grep -qF "$PROJECT_ROOT" "$UNIT_DEST" 2>/dev/null; then
  echo "Systemd watcher unit already installed for this project."
  exit 0
fi

mkdir -p "$SYSTEMD_USER_DIR"
sed "s|@D1_PROJECT_ROOT@|$PROJECT_ROOT|g" "$TEMPLATE" > "$UNIT_DEST"
echo "Installed: $UNIT_DEST"
if command -v systemctl >/dev/null 2>&1; then
  systemctl --user daemon-reload
  echo "Run: systemctl --user enable --now d1-watcher.service"
fi
