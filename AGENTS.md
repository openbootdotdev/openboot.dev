# AGENTS.md

Canonical pointer for AI coding agents working on this repo. If you're a
human, you probably want [README.md](README.md) or [CLAUDE.md](CLAUDE.md).

## Read first

- **[CLAUDE.md](CLAUDE.md)** — project conventions, stack overview,
  request flow, where-to-look table. Treat as authoritative.
- **[docs/HARNESS.md](docs/HARNESS.md)** — the steering meta-doc: when a
  class of issue recurs, which file do you edit to prevent it next time.

## Project invariants (the things that must not drift)

These are enforced mechanically. New violations fail `npm run validate`
or the `.claude/hooks/stop.sh` end-of-turn check.

| Invariant | Enforced by |
|---|---|
| D1 access (`.prepare` / `.exec` / `.batch`) only in `+server.ts` or `src/lib/server/db/` | `src/archtest/db-access.test.ts` |
| No `process.env` in `src/**` — Cloudflare Workers uses `platform.env` | `eslint` `no-restricted-globals` + `src/archtest/env.test.ts` |
| No `console.log` in `src/lib/server/**` — use `console.error` for real errors | `src/archtest/server-console.test.ts` |
| No `@ts-ignore` / `@ts-nocheck` | `eslint` `@typescript-eslint/ban-ts-comment` |
| No `eval` / `new Function` | `eslint` `no-eval` / `no-implied-eval` |
| Commit subjects follow Conventional Commits | `.github/workflows/conventional-commits.yml` |

The full convention list lives in CLAUDE.md → "Conventions".

## Run before committing

```bash
npm run lint        # eslint, ~2s warm
npm run check       # svelte-check, ~10s
npx vitest run      # unit tests, ~1s
```

Or the umbrella:

```bash
npm run validate    # lint + check + test + build, ~30s
```

Install the git hooks once with `npm run install:hooks` and the
pre-commit (lint diff) + pre-push (full validate) run automatically.

## When archtest fails

The failure message names the violating file and the rule. Two options:

1. **You added a violation by accident** — move the call into an allowed
   path (e.g. DB access into `src/lib/server/db/` or a `+server.ts`).
2. **The allowed-paths list is genuinely too narrow** — edit the
   `allowedPaths` array in the test, and explain in your commit message
   why the new path is justified. There is no baseline file; the test
   itself is the audit trail.

## Tools you may NOT use without asking

- `git push --force` against `main`.
- `git commit --amend` on commits already pushed.
- `git reset --hard` discarding uncommitted work.
- `wrangler d1 execute --remote ...` against production D1 (read-only is
  fine; writes are not).
- `wrangler deploy` directly — CI deploys on push to `main`.
- Anything that modifies production OAuth secrets or rotates JWTs.

Everything else (Edit/Write/Read in repo, `npm run *`, `wrangler ...
--local`, vitest) is safe to run without confirmation.

## Skills

Project-specific skills live under [`.claude/skills/`](.claude/skills/):

- `ship-pr` — canonical post-edit flow: push → `gh pr create` → wait
  for CI → review diff → triage (self-fix small / escalate decisions /
  merge directly when clean) → `gh pr merge --squash` → local cleanup.
  Use this instead of calling `gh pr create` / `gh pr merge` directly.
  **Do not use `--auto`** — it skips the review gate.
  **Do not ask for confirmation on a clean merge** — the loop closes
  itself when nothing requires a decision.
