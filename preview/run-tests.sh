#!/bin/sh
# Runs preview/test.html in headless Chrome and fails unless every test passes.
# Usage: CHROME=/path/to/chrome sh preview/run-tests.sh  (defaults to google-chrome)
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-google-chrome}"
PORT="${PORT:-8765}"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
# The server exits at once if the port is taken; don't test whatever else is listening there
kill -0 $SERVER 2>/dev/null || { echo "Port $PORT is busy; set PORT to a free one." >&2; exit 1; }
OUT=$("$CHROME" --headless --disable-gpu --no-sandbox --virtual-time-budget=20000 \
  --dump-dom "http://127.0.0.1:$PORT/preview/test.html")
# Print the summary and each result line
echo "$OUT" | sed -n 's/.*id="summary"[^>]*>\([^<]*\)<.*/\1/p'
echo "$OUT" | grep -o 'class="\(pass\|fail\)">[^<]*' | sed 's/class="[a-z]*">//'
echo "$OUT" | grep -q 'id="summary"[^>]*>PASS'
