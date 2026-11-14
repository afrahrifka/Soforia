#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$PROJECT_DIR"
if [ ! -f dist/server.mjs ]; then
  echo 'Build belum ada. Untuk pengembangan, jalankan npm ci && npm run build.' >&2
  exit 1
fi
if [ -x runtime/bin/node ]; then
  NODE_BIN="$PROJECT_DIR/runtime/bin/node"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN=$(command -v node)
else
  echo 'Node.js belum tersedia. Gunakan paket offline dengan runtime bawaan.' >&2
  exit 1
fi
exec "$NODE_BIN" "$PROJECT_DIR/dist/server.mjs" "$@"
