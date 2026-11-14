#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$PROJECT_DIR"
mkdir -p .runtime
if command -v systemd-run >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1; then
  ./deploy-local.sh "$@"
  ./open-console.sh || true
  exit 0
fi
if [ -f .runtime/server.pid ]; then
  TASK_PID=$(cat .runtime/server.pid)
  case "$TASK_PID" in ''|*[!0-9]*) TASK_PID=0;; esac
  if [ "$TASK_PID" -gt 1 ] && kill -0 "$TASK_PID" 2>/dev/null; then
    echo 'Launcher mencatat server aktif. Lihat .runtime/server.log; gunakan ./stop.sh untuk berhenti.'
    exit 0
  fi
fi
nohup ./start.sh "$@" > .runtime/server.log 2>&1 < /dev/null &
TASK_PID=$!
echo "$TASK_PID" > .runtime/server.pid
sleep 1
if ! kill -0 "$TASK_PID" 2>/dev/null; then cat .runtime/server.log; rm -f .runtime/server.pid; exit 1; fi
cat .runtime/server.log
./open-console.sh || true
