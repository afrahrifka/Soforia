#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PID_FILE="$PROJECT_DIR/.runtime/server.pid"
if command -v systemctl >/dev/null 2>&1; then systemctl --user stop main-bareng-screen.service >/dev/null 2>&1 || true; fi
if [ -f "$PROJECT_DIR/.runtime/managed-service" ] && command -v systemctl >/dev/null 2>&1; then
  SERVICE_PID=$(systemctl --user show main-bareng.service --property=MainPID --value 2>/dev/null || true)
  if [ -n "$SERVICE_PID" ] && [ -r "/proc/$SERVICE_PID/cmdline" ] && tr '\000' ' ' < "/proc/$SERVICE_PID/cmdline" | grep -Fq "$PROJECT_DIR/dist/server.mjs"; then
    systemctl --user stop main-bareng.service
    rm -f "$PID_FILE" "$PROJECT_DIR/.runtime/managed-service"
    echo 'Main Bareng dihentikan.'
    exit 0
  fi
fi
if [ ! -f "$PID_FILE" ]; then echo 'Tidak ada server yang dicatat launcher.'; exit 0; fi
TASK_PID=$(cat "$PID_FILE")
case "$TASK_PID" in ''|*[!0-9]*) echo 'PID tidak valid.' >&2; exit 1;; esac
if kill -0 "$TASK_PID" 2>/dev/null; then
  if [ -r "/proc/$TASK_PID/cmdline" ] && tr '\000' ' ' < "/proc/$TASK_PID/cmdline" | grep -Fq "$PROJECT_DIR/dist/server.mjs"; then
    kill "$TASK_PID"
    echo 'Main Bareng dihentikan.'
  else
    echo 'PID sudah dipakai proses lain. Tidak dihentikan.' >&2
  fi
else echo 'Server sudah berhenti.'; fi
rm -f "$PID_FILE"
