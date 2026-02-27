# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Web dashboard and install API for OpenBoot — a CLI tool that bootstraps developer machines. SvelteKit 5 on Cloudflare Workers with D1 (SQLite). Serves config pages, install scripts (curl-able), dashboard UI, OAuth login, and markdown docs.

The CLI lives at [openbootdotdev/openboot](https://github.com/openbootdotdev/openboot) (Go).

## Commands

```bash
npm run dev                # Local dev server
npm run build              # Production build
npm run check              # Type checking (svelte-kit sync + svelte-check)
npm test                   # Run all tests (vitest)
npx vitest run src/lib/server/auth.test.ts           # Run a single test file
npx vitest run -t "test name"                        # Run test by name
npm run test:coverage      # Tests with coverage report

# Database
wrangler d1 migrations apply openboot --local   # Apply migrations locally
wrangler d1 migrations apply openboot --remote  # Apply migrations to production
```

Local dev requires `.dev.vars` with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Architecture

**Stack**: SvelteKit 5 (Svelte 5 runes) + TypeScript, Cloudflare Workers + D1 (SQLite), mdsvex for docs, shiki for syntax highlighting, fuse.js for doc search.

### Request Flow

`hooks.server.ts` intercepts all requests — it resolves aliases (short URLs like `/dev` → `/user/slug`), detects curl/wget user-agents to serve install scripts instead of HTML, and applies security headers globally (CSP, HSTS, X-Frame-Options).

### Key Directories

| Path | Purpose |
|------|---------|
| `src/hooks.server.ts` | Alias resolution, curl detection, security headers |
| `src/lib/server/` | Server-only: `auth.ts` (JWT + OAuth), `install-script.ts`, `rate-limit.ts`, `validation.ts` |
| `src/lib/stores/` | Svelte stores: `auth.ts` (user state), `theme.ts` (light/dark) |
| `src/lib/presets.ts` | Package presets (minimal, developer, full) |
| `src/lib/package-metadata.ts` | Descriptions for 100+ packages |
| `src/routes/api/` | REST API endpoints (`+server.ts` convention) |
| `src/routes/[username]/[slug]/` | Config page, install endpoint, config JSON, OG image |
| `src/docs/` | Markdown docs (mdsvex preprocessed) |
| `migrations/` | D1 SQL migrations (sequential `0001_*.sql` format) |

### Auth System

Three auth flows:
1. **OAuth** (GitHub + Google): `/api/auth/login` → provider → `/api/auth/callback/{github,google}` → JWT in httpOnly `session` cookie
2. **Session**: `getCurrentUser(request, cookies, db, secret)` from `$lib/server/auth` verifies JWT
3. **CLI device flow**: `/api/auth/cli/start` → user approves at `/cli-auth` → CLI polls `/api/auth/cli/poll` → gets `obt_` prefixed API token

### Database

D1 (SQLite), no ORM — direct parameterized SQL via `env.DB.prepare(sql).bind(...)`. Four tables: `users`, `configs`, `api_tokens`, `cli_auth_codes`. The `configs.packages` field is a JSON array of `{name, type, desc}`. Config visibility: `public` (discoverable), `unlisted` (accessible but not listed), `private` (owner-only, 403 on install).

**D1 limitation**: No `ALTER TABLE DROP COLUMN`. Plan column removals via new table + data migration.

### Install Script Generation

`src/lib/server/install-script.ts` generates bash scripts: `generateInstallScript()` for public configs (installs packages, runs custom script, clones dotfiles), `generatePrivateInstallScript()` for private configs (requires CLI auth first).

## Conventions

- **Language**: All code, comments, docs, and commits in English
- **Svelte 5 runes**: Use `$state`, `$derived`, `$props()` — not legacy `$:` syntax
- **API responses**: Always `json({...})` with appropriate status codes. Errors: `json({ error: '...' }, { status: N })`
- **Commits**: Conventional Commits format: `type(scope): subject` (enforced by CI)
- **DB access**: Only in `+server.ts` files, always with parameterized `.bind()` queries
- **No `as any` or `@ts-ignore`** — type properly
- **Rate limiting**: In-memory sliding window per Worker isolate (not globally consistent)
- **Slug generation**: `slugify()` from `$lib/server/auth` — lowercase, alphanumeric + hyphens

## CI/CD

Tag-based releases. Push to `main` runs CI only (tests + build). Push a version tag (`v*`) triggers deployment:

```bash
git tag v1.2.3
git push origin v1.2.3
```

Deploy workflow: test → build → D1 migrations → wrangler deploy. Migrations run before deploy — safe for schema changes that new code depends on.

## Testing

Vitest with happy-dom. Test files: `src/**/*.{test,spec}.{js,ts}`. Setup: `src/lib/test/setup.ts`. Fixtures and DB mocks in `src/lib/test/`.
