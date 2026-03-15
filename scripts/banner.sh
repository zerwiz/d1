# Shared d1 banner. Source this and call d1_banner.
# Usage: . "$SCRIPT_DIR/banner.sh" 2>/dev/null; d1_banner
d1_banner() {
  echo ""
  echo "    ╔═══════════════════════════════╗"
  echo "    ║                               ║"
  echo "    ║         ██████╗  ██╗          ║"
  echo "    ║         ██╔══██╗ ██║          ║"
  echo "    ║         ██║  ██║ ██║          ║"
  echo "    ║         ██║  ██║ ██║          ║"
  echo "    ║         ██████╔╝ ██║          ║"
  echo "    ║         ╚═════╝  ╚═╝          ║"
  echo "    ║           d 1                 ║"
  echo "    ║                               ║"
  echo "    ╚═══════════════════════════════╝"
  echo ""
}

# Pause at end so user can read output (only when stdin is a terminal).
d1_pause_at_end() {
  [ -t 0 ] && read -r -p "Press Enter to continue..." _ || true
}
