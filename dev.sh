#!/usr/bin/env bash
# Run the whole stack locally (no Docker needed).
#   ./dev.sh   -> backend on :8000, frontend on :5173, Ctrl-C stops both.
set -euo pipefail
cd "$(dirname "$0")"

# bootstrap backend venv if missing
if [ ! -d .venv ]; then
  echo "[setup] creating Python venv + installing backend deps..."
  python3 -m venv .venv
  .venv/bin/pip install -q --upgrade pip
  .venv/bin/pip install -q -r backend/requirements.txt
fi

# bootstrap frontend deps if missing
if [ ! -d frontend/node_modules ]; then
  echo "[setup] installing frontend deps..."
  npm --prefix frontend install
fi

# free the ports in case something is lingering
for p in 8000 5173; do
  pids=$(lsof -ti:"$p" 2>/dev/null || true)
  [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
done

.venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
npm --prefix frontend run dev -- --host --port 5173 &
FRONTEND_PID=$!

trap 'echo; echo "stopping..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' EXIT INT TERM

echo ""
echo "  Backend   ->  http://localhost:8000   (/health, /demo, /verify)"
echo "  Frontend  ->  http://localhost:5173   <- open this"
echo "  (Ctrl-C stops both)"
echo ""
wait
