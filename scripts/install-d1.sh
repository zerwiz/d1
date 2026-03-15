#!/bin/bash
# Install d1 Planning Hub desktop launcher (user-specific).
# Puts "d1 Planning Hub" in Show Applications; paths are resolved at install time.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
UI_DIR="$PROJECT_ROOT/systems/d1-chat-ui"
ICON_PATH="$UI_DIR/icon.png"
APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
DESKTOP_FILE="$APPS_DIR/d1-planning-hub.desktop"

mkdir -p "$APPS_DIR"
# Always overwrite so launcher stays current (icon, StartupWMClass for taskbar)

# Icon line: only set if file exists (optional)
if [ -f "$ICON_PATH" ]; then
  ICON_LINE="Icon=$ICON_PATH"
else
  ICON_LINE="Icon=utilities-terminal"
fi

# Run electron directly (no shell) so no terminal window appears
ELECTRON_BIN="$UI_DIR/node_modules/.bin/electron"
cat << EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Name=d1 Planning Hub
Comment=AI-powered project planning and document RAG with local LLM
Exec=$ELECTRON_BIN .
Path=$UI_DIR
$ICON_LINE
Terminal=false
Type=Application
Categories=Development;Office;TextEditor;Utility;
Keywords=AI;RAG;Planning;documents;llama;
StartupNotify=true
StartupWMClass=d1-planning-hub
EOF

# So the application menu picks it up (required on some systems)
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" 2>/dev/null || true
fi
# KDE / XDG
if command -v kbuildsycoca5 >/dev/null 2>&1; then
  kbuildsycoca5 2>/dev/null || true
fi

echo "Installation complete."
echo "Launcher: $DESKTOP_FILE"
echo ""
echo "  Run from application menu: open 'Show Applications' (or your app grid)"
echo "  and search for 'd1 Planning Hub' — click to start."
if [ -f "$ICON_PATH" ]; then
  echo "Icon set for app menu and taskbar: $ICON_PATH"
else
  echo "To add a taskbar/menu icon: place a 256x256 PNG at $UI_DIR/icon.png and run this script again."
fi
