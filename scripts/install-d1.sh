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

# Icon line: only set if file exists (optional)
if [ -f "$ICON_PATH" ]; then
  ICON_LINE="Icon=$ICON_PATH"
else
  ICON_LINE="Icon=utilities-terminal"
fi

cat << EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=d1 Planning Hub
Comment=AI-powered project planning and document RAG with local LLM
Exec=sh -c "cd \"$UI_DIR\" && npm start"
$ICON_LINE
Terminal=false
Type=Application
Categories=Development;Office;TextEditor;
Keywords=AI;RAG;Planning;documents;llama;
EOF

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" 2>/dev/null || true
fi

echo "Installation complete."
echo "Launcher: $DESKTOP_FILE"
echo "You can find 'd1 Planning Hub' in your application menu (Show Applications)."
echo "To add an icon: place a 256x256 PNG at $UI_DIR/icon.png and run this script again."
