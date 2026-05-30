#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

echo ""
echo " ============================================"
echo "  MoneyMap v0.1.12 - Local Preview"
echo " ============================================"
echo ""

if [ ! -f "index.html" ]; then
  echo " [ERROR] index.html not found in the expected repo root."
  echo " Expected: $REPO_ROOT/index.html"
  read -r -p " Press Enter to exit..."
  exit 1
fi

PORT=8080
ALT_PORT=8081

if lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo " Port $PORT is busy, trying $ALT_PORT..."
  PORT=$ALT_PORT
fi

echo " Starting MoneyMap at http://127.0.0.1:$PORT"
echo ""
echo " Open this URL in your browser:"
echo " http://127.0.0.1:$PORT"
echo ""
echo " Press Ctrl+C to stop."
echo ""

if command -v python >/dev/null 2>&1; then
  python -m http.server "$PORT" --bind 127.0.0.1
elif command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1
else
  echo " [ERROR] Python not found. Install Python, then run this again."
  read -r -p " Press Enter to exit..."
  exit 1
fi
