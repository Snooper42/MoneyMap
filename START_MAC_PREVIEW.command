#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo " ============================================"
echo "  MoneyMap v0.1.10 - Local Preview"
echo " ============================================"
echo ""

if [ ! -f "index.html" ]; then
  echo " [ERROR] index.html not found. Make sure you run this"
  echo " from inside the MoneyMap_v0.1.10 folder."
  read -p " Press Enter to exit..."
  exit 1
fi

PORT=8080
ALT_PORT=8081

# Check if port 8080 is busy
if lsof -iTCP:$PORT -sTCP:LISTEN &>/dev/null 2>&1; then
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

# Try python3 first, then python
if command -v python3 &>/dev/null; then
  python3 -m http.server $PORT --bind 127.0.0.1
elif command -v python &>/dev/null; then
  python -m http.server $PORT --bind 127.0.0.1
else
  echo " [ERROR] Python not found. Please install from https://python.org"
  read -p " Press Enter to exit..."
  exit 1
fi
