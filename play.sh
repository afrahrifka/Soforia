#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$PROJECT_DIR"
mkdir -p .runtime
if [ -f .runtime/server.pid ]; then
  TASK_PID=$(cat .runtime/server.pid)
  case "$TASK_PID" in ''|*[!0-9]*) TASK_PID=0;; esac
  if [ "$TASK_PID" -gt 1 ] && kill -0 "$TASK_PID" 2>/dev/null; then
    if [ -r /proc/$TASK_PID/cmdline ] && tr '\000' '\n' < /proc/$TASK_PID/cmdline | grep -Fxq "$PROJECT_DIR/dist/server.mjs"; then
      echo 'Server folder ini sudah aktif.'
      ./open-console.sh || true
      exit 0
    fi
  fi
fi
# Pilih pasangan port kosong hanya jika pengguna tidak menentukan port.
EXPLICIT_PORT=0
for ARG in "$@"; do case "$ARG" in --port|--port=*|--operator-port|--operator-port=*) EXPLICIT_PORT=1;; esac; done
if [ "$EXPLICIT_PORT" = 0 ]; then
  if [ -x runtime/bin/node ]; then TASK_NODE=./runtime/bin/node; else TASK_NODE=node; fi
  TASK_PORT=$("$TASK_NODE" scripts/free-port.mjs)
  set -- "$@" --port "$TASK_PORT" --operator-port "$((TASK_PORT + 1))"
  if [ "$TASK_PORT" != 3210 ]; then echo "Port bawaan sedang dipakai; folder ini menggunakan $TASK_PORT/$((TASK_PORT + 1))."; fi
fi
TASK_DETACH=
if command -v setsid >/dev/null 2>&1; then TASK_DETACH=setsid; fi
$TASK_DETACH nohup ./start.sh "$@" > .runtime/server.log 2>&1 < /dev/null &
TASK_PID=$!
echo "$TASK_PID" > .runtime/server.pid
sleep 1
if ! kill -0 "$TASK_PID" 2>/dev/null; then cat .runtime/server.log; rm -f .runtime/server.pid; exit 1; fi
cat .runtime/server.log
./open-console.sh || true
