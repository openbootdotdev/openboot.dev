#!/bin/bash
#
# Stop hook — fires when Claude finishes its turn.
#
# If any .ts / .svelte file in the working tree differs from HEAD, run
# the cheap end-of-turn sensors:
#   - svelte-check (`npm run check`)  — TypeScript across .ts and .svelte
#   - vitest run src/archtest/         — architecture invariants
#
# Skips the full unit suite — that's pre-push's job. Goal: <15s warm.
#
# Exit codes:
#   0  → allow stop
#   2  → block stop; stderr is fed back to Claude so it can self-correct
#
# Skip via OPENBOOT_DEV_SKIP_STOP_HOOK=1 if iterating.

set -uo pipefail

[ "${OPENBOOT_DEV_SKIP_STOP_HOOK:-}" = "1" ] && exit 0

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Cheap gate: only fire if any tracked or untracked .ts/.svelte file is
# dirty. Skip otherwise — most turns don't touch source.
dirty=$(git status --porcelain 2>/dev/null | grep -E '\.(ts|svelte)$' | head -1 || true)
[ -z "$dirty" ] && exit 0

echo "[stop] running end-of-turn sensors..." >&2

if ! check_out=$(npm run --silent check 2>&1); then
	printf '[stop] svelte-check failed:\n%s\n' "$check_out" >&2
	exit 2
fi

if ! arch_out=$(npx vitest run src/archtest/ 2>&1); then
	printf '[stop] archtest failed:\n%s\n' "$arch_out" >&2
	exit 2
fi

exit 0
