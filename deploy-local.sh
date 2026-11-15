#!/bin/sh
# Kompatibilitas nama launcher lama; berjalan lokal tanpa unit systemd.
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$PROJECT_DIR/play.sh" "$@"
