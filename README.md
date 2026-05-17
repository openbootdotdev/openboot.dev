# openboot.dev

Web dashboard and install API for [OpenBoot](https://github.com/openbootdotdev/openboot).

[![CI](https://github.com/openbootdotdev/openboot.dev/actions/workflows/ci.yml/badge.svg)](https://github.com/openbootdotdev/openboot.dev/actions/workflows/ci.yml)
[![CD](https://github.com/openbootdotdev/openboot.dev/actions/workflows/deploy.yml/badge.svg)](https://github.com/openbootdotdev/openboot.dev/actions/workflows/deploy.yml)

**Live at [openboot.dev](https://openboot.dev)**

This repo handles the web interface for managing configs, serving install scripts, and storing snapshots. The CLI lives at [openbootdotdev/openboot](https://github.com/openbootdotdev/openboot).

## What's in Here

- Landing page + docs (SvelteKit + mdsvex)
- Dashboard for creating and editing configs
- Install script generator (the URL you curl from)
- Brewfile import parser
- Package search proxies (Homebrew, NPM)
- OAuth login (GitHub, Google) + CLI device auth flow
- Snapshot upload API (CLI posts your machine state here)

## Stack

SvelteKit 5 + TypeScript, Cloudflare Workers + D1 (SQLite), GitHub/Google OAuth.

## Running Locally

```bash
npm install
wrangler d1 migrations apply openboot --local  # Sets up DB
npm run dev
```

Create `.dev.vars` with your OAuth credentials:

```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Deployment

Push to `main` runs CI (`ci.yml`: type check + tests + build + contract validation). On success, CD (`deploy.yml`) fires via `workflow_run` and ships to [openboot.dev](https://openboot.dev) (D1 migrations + wrangler deploy + health check + smoke test). PRs run CI only. See [docs/HARNESS.md](./docs/HARNESS.md) for the full pipeline.

Secrets needed: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Key Endpoints

**Install scripts** (what the CLI curls):
- `GET /:alias` — Short alias redirect or install script (curl-detected)
- `GET /:username/:slug/install` — Config install script
- `GET /:username/:slug/config` — Config JSON for CLI

**Configs** (CRUD for dashboard):
- `GET/POST /api/configs` — List/create
- `GET/PUT/DELETE /api/configs/:slug` — Read/update/delete
- `POST /api/configs/from-snapshot` — CLI snapshot upload

**Auth**:
- OAuth callbacks at `/api/auth/callback/{github,google}`
- CLI device flow: `/api/auth/cli/{start,approve,poll}`

**Utilities**:
- `POST /api/brewfile/parse` — Brewfile → package list
- `GET /api/homebrew/search?q=...` — Search Homebrew
- `GET /api/npm/search?q=...` — Search NPM

## Database

D1 (SQLite). Tables: `users`, `configs`, `config_revisions`, `api_tokens`, `cli_auth_codes`. See `migrations/` for schema. Key fields on `configs`:

- `configs.packages` — JSON array of {name, type, desc}
- `configs.snapshot` — JSON object from CLI `openboot snapshot`
- `configs.visibility` — `public` | `unlisted` | `private`
- `configs.alias` — short URL (e.g., `openboot.dev/dev` → redirects)

## Related

- [openboot](https://github.com/openbootdotdev/openboot) — CLI tool (Go)
- [dotfiles](https://github.com/openbootdotdev/dotfiles) — Dotfiles template

## License

MIT
