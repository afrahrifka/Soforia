#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$PROJECT_DIR"
mkdir -p .runtime
if ! command -v systemd-run >/dev/null 2>&1 || ! systemctl --user show-environment >/dev/null 2>&1; then
  echo 'User systemd tidak tersedia. Jalankan ./start.sh di terminal dan biarkan terminal terbuka.' >&2
  exit 1
fi
if systemctl --user is-active --quiet main-bareng.service; then
  SERVICE_PID=$(systemctl --user show main-bareng.service --property=MainPID --value)
  if [ -r "/proc/$SERVICE_PID/cmdline" ] && tr '\000' ' ' < "/proc/$SERVICE_PID/cmdline" | grep -Fq "$PROJECT_DIR/dist/server.mjs"; then
    echo 'Main Bareng sudah aktif.'
    cat .runtime/server.log
    exit 0
  fi
  echo 'Nama layanan main-bareng sudah digunakan proses lain; tidak diubah.' >&2
  exit 1
fi
: > .runtime/server.log
# Transient unit milik aplikasi ini saja; tidak mengaktifkan autostart saat boot.
systemd-run --user --unit=main-bareng --collect --property="WorkingDirectory=$PROJECT_DIR" --property=Restart=on-failure --property="StandardOutput=append:$PROJECT_DIR/.runtime/server.log" --property="StandardError=append:$PROJECT_DIR/.runtime/server.log" "$PROJECT_DIR/start.sh" "$@"
echo main-bareng.service > .runtime/managed-service
sleep 1
if ! systemctl --user is-active --quiet main-bareng.service; then cat .runtime/server.log; exit 1; fi
systemctl --user show main-bareng.service --property=MainPID --value > .runtime/server.pid
cat .runtime/server.log
