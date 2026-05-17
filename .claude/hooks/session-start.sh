#!/bin/bash
# SessionStart hook — warm caches so the first svelte-check / vitest in
# the session is fast and offline-safe. Only runs on Claude Code remote;
# local dev machines are expected to already have a working node_modules.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
	exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

echo "[openboot.dev session-start] Node version: $(node --version)"

if [ ! -d node_modules ]; then
	echo "[openboot.dev session-start] Installing deps..."
	npm install --legacy-peer-deps --no-audit --no-fund
fi

# Generates .svelte-kit/types/* so svelte-check / vitest don't fail on
# the first cold reference to $types or $app/* aliases.
echo "[openboot.dev session-start] svelte-kit sync..."
npx svelte-kit sync >/dev/null

echo "[openboot.dev session-start] Done."
