#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--" ]]; then
  shift
fi

python3 -m http.server 4173 --directory out --bind 127.0.0.1 >/tmp/stackscope-e2e-server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT

for _ in {1..30}; do
  if curl --noproxy '*' --fail --silent --show-error http://127.0.0.1:4173/ >/dev/null; then
    pnpm exec playwright test "$@"
    exit $?
  fi
  sleep 0.2
done

cat /tmp/stackscope-e2e-server.log >&2
echo "Static test server did not become ready" >&2
exit 1
