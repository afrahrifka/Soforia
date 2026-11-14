#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$PROJECT_DIR"
OPERATOR_URL=${1:-$(sed -n 's/^  Layar laptop : //p' .runtime/server.log | tail -n 1)}
case "$OPERATOR_URL" in http://127.0.0.1:*/console) ;; *) echo 'URL layar lokal belum tersedia. Jalankan ./play.sh dahulu.' >&2; exit 1;; esac
if [ -z "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
  echo "Sesi grafis tidak tersedia. Buka $OPERATOR_URL pada laptop; jalankan ./open-console.sh dari desktop untuk fullscreen." >&2
  exit 1
fi
if [ "${MAIN_BARENG_KIOSK_CHILD:-0}" != 1 ] && command -v systemd-run >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1; then
  if systemctl --user is-active --quiet main-bareng-screen.service; then
    echo 'Layar fullscreen Main Bareng sudah terbuka.'
    exit 0
  fi
  exec systemd-run --user --unit=main-bareng-screen --collect --setenv=MAIN_BARENG_KIOSK_CHILD=1 --setenv="DISPLAY=${DISPLAY:-}" --setenv="WAYLAND_DISPLAY=${WAYLAND_DISPLAY:-}" --setenv="XAUTHORITY=${XAUTHORITY:-}" "$PROJECT_DIR/open-console.sh" "$OPERATOR_URL"
fi
BROWSER_BIN=${MAIN_BARENG_BROWSER:-}
if [ -z "$BROWSER_BIN" ]; then
  for CANDIDATE in chromium chromium-browser google-chrome google-chrome-stable; do
    if command -v "$CANDIDATE" >/dev/null 2>&1; then BROWSER_BIN=$(command -v "$CANDIDATE"); break; fi
  done
fi
if [ -z "$BROWSER_BIN" ]; then echo 'Chromium/Chrome diperlukan untuk fullscreen otomatis. Install sekali, lalu jalankan ./open-console.sh.' >&2; exit 1; fi
mkdir -p .runtime/kiosk-profile
exec "$BROWSER_BIN" --kiosk --start-fullscreen --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --disable-sync --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required --user-data-dir="$PROJECT_DIR/.runtime/kiosk-profile" "$OPERATOR_URL"
