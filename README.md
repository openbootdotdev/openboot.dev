# openboot.dev

Web dashboard and install API for [OpenBoot](https://github.com/openbootdotdev/openboot).

[![Deploy](https://github.com/openbootdotdev/openboot.dev/actions/workflows/deploy.yml/badge.svg)](https://github.com/openbootdotdev/openboot.dev/actions/workflows/deploy.yml)

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

**Tag-based releases** — production deploys only happen when you create a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers:
1. Tests + build
2. Database migrations
3. Deployment to openboot.dev

Push to `main` only runs CI (tests + build), no deployment.

See [RELEASE.md](./RELEASE.md) for full release process.

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

D1 (SQLite). Two tables: `users` and `configs`. See `migrations/` for schema. Key fields:

- `configs.packages` — JSON array of {name, type, desc}
- `configs.snapshot` — JSON object from CLI `openboot snapshot`
- `configs.visibility` — `public` | `unlisted` | `private`
- `configs.alias` — short URL (e.g., `openboot.dev/dev` → redirects)

## Related

- [openboot](https://github.com/openbootdotdev/openboot) — CLI tool (Go)
- [dotfiles](https://github.com/openbootdotdev/dotfiles) — Dotfiles template

## License

MIT
