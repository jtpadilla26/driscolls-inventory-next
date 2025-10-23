#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_PATH="${1:-node_modules.tar.gz}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

if [[ ! -f "$ARCHIVE_PATH" ]]; then
  echo "[offline-bootstrap] expected dependency archive '$ARCHIVE_PATH' in the project root." >&2
  echo "[offline-bootstrap] create it by running 'npm ci' on a machine with registry access then" >&2
  echo "[offline-bootstrap] archiving the generated node_modules directory:" >&2
  echo "    tar -czf node_modules.tar.gz node_modules" >&2
  exit 1
fi

if [[ -d node_modules ]]; then
  echo "[offline-bootstrap] removing existing node_modules directory"
  rm -rf node_modules
fi

mkdir -p node_modules

echo "[offline-bootstrap] extracting $(basename "$ARCHIVE_PATH")"
tar -xzf "$ARCHIVE_PATH"

if [[ ! -d node_modules ]]; then
  echo "[offline-bootstrap] archive did not unpack a node_modules directory" >&2
  exit 1
fi

echo "[offline-bootstrap] dependencies restored from archive"
