# AGENTS.md

Canonical instructions for coding agents working on this repository. Keep shared
project knowledge here rather than in tool-specific configuration.

## Agent compatibility

- Codex loads this `AGENTS.md` directly.
- Claude Code loads [CLAUDE.md](CLAUDE.md), which imports this file with
  `@AGENTS.md`.
- Canonical project skills live in [`.agents/skills/`](.agents/skills/).
  [`.claude/skills/`](.claude/skills/) contains relative `SKILL.md` symlinks so
  Claude Code and agents that follow the open Agent Skills layout use the same
  instructions.
- Quality enforcement is agent-independent: use the Git hooks, `npm run
  validate`, and CI. Do not add tool-specific lifecycle hooks for checks that
  belong in those shared gates.

## Read first

- **[docs/HARNESS.md](docs/HARNESS.md)** — where repository controls live and
  how to encode a recurring issue as a mechanical check.
- **[README.md](README.md)** — product-facing setup and usage.

## Overview

Web dashboard and install API for OpenBoot, a CLI that bootstraps developer
machines. The app uses SvelteKit 5 on Cloudflare Workers with D1 (SQLite). It
serves configuration pages, curl-compatible install scripts, a dashboard,
OAuth login, and Markdown documentation.

The Go CLI lives at [openbootdotdev/openboot](https://github.com/openbootdotdev/openboot).

## Commands

```bash
npm run dev                # Local development server
npm run build              # Production build
npm run check              # svelte-kit sync + svelte-check
npm run lint               # ESLint
npm run validate           # lint + check + tests + build (the harness gate)
npm test                   # All Vitest suites
npx vitest run src/lib/server/auth.test.ts
npx vitest run -t "test name"
npm run test:coverage
npm run install:hooks      # Install shared Git pre-commit/pre-push hooks

# Database
wrangler d1 migrations apply openboot --local
wrangler d1 migrations apply openboot --remote
```

Local development requires `.dev.vars` containing `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.

## Architecture

**Stack:** SvelteKit 5 (Svelte 5 runes), TypeScript, Cloudflare Workers, D1,
mdsvex, Shiki, and Fuse.js.

`src/hooks.server.ts` intercepts requests, resolves short aliases such as
`/dev` to `/user/slug`, serves install scripts to curl/wget clients, and applies
security headers.

| Path | Purpose |
|---|---|
| `src/hooks.server.ts` | Alias resolution, curl detection, security headers |
| `src/lib/server/` | Server-only auth, DB helpers, install scripts, rate limiting, validation |
| `src/lib/stores/` | Client-side auth and theme stores |
| `src/lib/presets.ts` | Package presets |
| `src/lib/package-metadata.ts` | Source of truth for package metadata; served at `/api/packages` |
| `src/routes/api/` | REST endpoints (`+server.ts`) |
| `src/routes/[username]/[slug]/` | Config page, install endpoint, config JSON, OG image |
| `src/docs/` | mdsvex documentation |
| `migrations/` | Sequential D1 migrations (`0001_*.sql`) |

### Auth

1. OAuth: `/api/auth/login` -> provider -> `/api/auth/callback/{github,google}`
   -> JWT in the httpOnly `session` cookie.
2. Session: `getCurrentUser(request, cookies, db, secret)` verifies the JWT.
3. CLI device flow: `/api/auth/cli/start` -> approval at `/cli-auth` -> polling
   at `/api/auth/cli/poll` -> `obt_`-prefixed API token.

### Database

D1 is used directly with parameterized SQL; there is no ORM. The tables are
`users`, `configs`, `config_revisions`, `api_tokens`, and `cli_auth_codes`.
`configs.packages` stores a JSON array of `{name, type}` objects and read paths
enrich each entry from `package-metadata.ts`. Visibility is `public`,
`unlisted`, or `private`.

D1 cannot `ALTER TABLE DROP COLUMN`; remove columns with a new table and a data
migration.

### Install scripts

`src/lib/server/install-script.ts` provides `generateInstallScript()` for
public configs and `generatePrivateInstallScript()` for private configs that
require CLI authentication.

## Conventions

- Write code, comments, documentation, and commits in English.
- Use Svelte 5 runes (`$state`, `$derived`, `$props()`), not legacy `$:`.
- Return API data with `json({...})` and appropriate status codes. Return
  errors as `json({ error: '...' }, { status: N })`.
- Use Conventional Commits: `type(scope): subject`.
- Put reusable D1 queries in `src/lib/server/db/`; endpoint-local access may
  stay in `+server.ts`. Always bind query parameters.
- Do not use `as any`, `@ts-ignore`, or `@ts-nocheck`; model the type instead.
- Use `slugify()` from `$lib/server/auth` for lowercase alphanumeric/hyphen
  slugs.
- Treat the in-memory sliding-window rate limiter as per-Worker-isolate, not
  globally consistent.

## Project invariants

New violations fail `npm run validate`.

| Invariant | Enforced by |
|---|---|
| D1 access (`.prepare` / `.exec` / `.batch`) stays in `+server.ts` or server-only helpers | `src/archtest/db-access.test.ts` |
| No `process.env` in `src/**`; Workers use `platform.env` | ESLint + `src/archtest/env.test.ts` |
| No `console.log` in server code; use `console.error` for real errors | `src/archtest/server-console.test.ts` |
| No `@ts-ignore` / `@ts-nocheck` | ESLint `@typescript-eslint/ban-ts-comment` |
| No `eval` / `new Function` | ESLint `no-eval` / `no-implied-eval` |
| Commit subjects use Conventional Commits | `.github/workflows/conventional-commits.yml` |

When an architecture test fails, move accidental violations into an allowed
path. If the boundary is genuinely too narrow, update the test's allow-list and
explain why in the commit. The test is the audit trail; there is no baseline
file.

## Verification

Before committing, run:

```bash
npm run lint
npm run check
npx vitest run
```

Run `npm run validate` for the full gate. Install the shared Git hooks once with
`npm run install:hooks`; pre-commit checks the staged diff and pre-push runs the
full validation suite.

## CI/CD

Pull requests run CI without deploying. A push to `main` runs CI and then the
deployment workflow. Deployment applies D1 migrations before deploying and
finishes with health and contract checks.

## Actions that require confirmation

- Force-pushing `main`.
- Amending commits that have already been pushed.
- Hard-resetting away uncommitted work.
- Writing to production D1 with `wrangler d1 execute --remote`.
- Running `wrangler deploy` directly; CI deploys from `main`.
- Modifying production OAuth secrets or rotating JWTs.

Repository reads/writes, `npm run *`, local Wrangler commands, and Vitest are
otherwise safe without confirmation.

## Skills

- `ship-pr` — use the shared skill for the canonical push -> PR -> CI -> review
  -> triage -> squash-merge -> cleanup flow. Never use `--auto`; merge directly
  when the PR is clean, and escalate only decisions that need product or team
  input.
