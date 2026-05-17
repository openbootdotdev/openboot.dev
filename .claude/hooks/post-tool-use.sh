#!/bin/bash
#
# PostToolUse hook — fires after every Edit / Write / MultiEdit.
#
# For .ts / .svelte edits: runs `eslint` on the touched file so Claude
# gets immediate feedback if the edit introduced a lint error. ESLint
# is fast (~500ms on a single file warm) and catches the typical AI
# slip-ups: unused imports, `as any`, `@ts-ignore`, `console.log`.
#
# Exit code contract (per Claude Code hooks):
#   0  → success, silent
#   2  → block: stderr is fed back to Claude as feedback to self-correct
#
# Warnings DO NOT block — only errors do. Promote a rule from warn to
# error in eslint.config.js when its existing call sites are cleaned up.

set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$project_dir"

input=$(cat)
file_path=$(printf '%s' "$input" | node -e "
let d=''; process.stdin.on('data', c => d+=c); process.stdin.on('end', () => {
  try { const j = JSON.parse(d); process.stdout.write(j.tool_input?.file_path || ''); }
  catch { process.stdout.write(''); }
});" 2>/dev/null || true)

[ -z "$file_path" ] && exit 0

# Skip non-source files.
case "$file_path" in
	*.ts|*.svelte|*.js) ;;
	*) exit 0 ;;
esac

# Normalise to a path relative to the project root. Edits outside the
# project (e.g. ~/.claude/...) are ignored.
case "$file_path" in
	"$project_dir"/*) rel_path="${file_path#"$project_dir"/}" ;;
	/*) exit 0 ;;
	*) rel_path="$file_path" ;;
esac

# Skip directories that ESLint already ignores.
case "$rel_path" in
	.svelte-kit/*|build/*|node_modules/*|coverage/*|.wrangler/*) exit 0 ;;
esac

# Skip files outside src/ — config files, scripts, etc. don't need the
# strict treatment and would only slow the agent down.
case "$rel_path" in
	src/*) ;;
	*) exit 0 ;;
esac

[ -f "$project_dir/$rel_path" ] || exit 0

# Run eslint on just this file. --no-warn-ignored prevents a warning when
# the file is excluded by config.
if ! out=$(npx eslint --no-warn-ignored "$rel_path" 2>&1); then
	printf '[post-tool-use] eslint failed for %s:\n%s\n' "$rel_path" "$out" >&2
	exit 2
fi

exit 0
