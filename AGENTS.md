# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-12
**Commit:** e66675e
**Branch:** main

## OVERVIEW

Web dashboard and install API for OpenBoot. SvelteKit 5 + Cloudflare Workers + D1 (SQLite).
Serves config pages, install API, dashboard UI, OAuth login, and docs.

## STRUCTURE

```
openboot.dev/
├── src/
│   ├── app.d.ts                  # Platform env types (DB, secrets)
│   ├── app.html                  # HTML shell
│   ├── hooks.server.ts           # Request interceptor: alias resolution, curl detection, security headers
│   ├── docs/                     # Markdown docs (mdsvex), 12 pages
│   ├── lib/
│   │   ├── components/           # ThemeToggle, Button, SearchModal
│   │   ├── server/               # auth.ts, install-script.ts, rate-limit.ts, validation.ts
│   │   ├── stores/               # auth.ts, theme.ts (Svelte stores)
│   │   └── presets.ts            # Preset package definitions
│   └── routes/
│       ├── +page.svelte          # Landing page
│       ├── dashboard/            # Authenticated config management UI
│       ├── login/                # OAuth login page
│       ├── cli-auth/             # CLI OAuth approval flow
│       ├── docs/                 # Docs layout + per-page routing
│       ├── install/              # /install.sh redirect
│       ├── [username]/[slug]/    # Config page, install endpoint, config JSON, OG image
│       └── api/
│           ├── auth/             # OAuth callbacks (GitHub, Google), CLI auth (start/poll/approve), logout
│           ├── configs/          # CRUD: GET/POST list, [slug] GET/PUT/DELETE, from-snapshot
│           ├── user/             # Current user info
│           ├── homebrew/search/  # Homebrew package search proxy
│           ├── npm/search/       # NPM package search proxy
│           └── brewfile/parse/   # Brewfile import parser
├── migrations/                   # D1 SQL migrations (0001-0006)
├── wrangler.toml                 # Cloudflare Workers config, D1 binding
└── .github/workflows/deploy.yml  # CI/CD
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `src/routes/api/` | SvelteKit `+server.ts` convention |
| Change install script | `src/lib/server/install-script.ts` | Shell script template generator |
| Update auth logic | `src/lib/server/auth.ts` | JWT verify, getCurrentUser, slugify, generateId |
| Add validation rules | `src/lib/server/validation.ts` | Custom script + dotfiles repo validation |
| Change rate limits | `src/lib/server/rate-limit.ts` | In-memory rate limiter |
| Edit curl/alias routing | `src/hooks.server.ts` | Alias → config lookup, user-agent detection |
| Change config visibility | `src/routes/api/configs/` + server routes | `visibility` field: public/unlisted/private |
| Add docs page | `src/docs/` | Markdown with frontmatter (title, group, order) |
| Add DB column | `migrations/` | Sequential `0007_*.sql`, auto-applied by CI |
| Change presets | `src/lib/presets.ts` | Package lists for minimal/developer/full |
| Modify landing page | `src/routes/+page.svelte` | Single-file component |
| Update dashboard | `src/routes/dashboard/+page.svelte` | Config CRUD UI |

## DB SCHEMA

D1 (SQLite). Key table:

```sql
configs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  slug TEXT,
  name TEXT,
  description TEXT,
  base_preset TEXT,
  packages TEXT,          -- JSON array of {name, type, desc}
  custom_script TEXT,
  dotfiles_repo TEXT,
  snapshot TEXT,           -- JSON object from CLI snapshot
  alias TEXT UNIQUE,
  visibility TEXT DEFAULT 'unlisted',  -- 'public' | 'unlisted' | 'private'
  install_count INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
)
```

Visibility rules:
- **public**: listed on profile, install URL works, config page viewable
- **unlisted**: NOT listed, install URL works, config page viewable
- **private**: owner-only, install URL returns 403

## REQUEST FLOW

```
curl openboot.dev/alias        → hooks.server.ts → alias lookup → install script
curl openboot.dev/user/slug    → hooks.server.ts → two-segment curl detection → install script
browser openboot.dev/alias     → hooks.server.ts → redirect to /user/slug
browser openboot.dev/user/slug → [username]/[slug]/+page.server.ts → config page
```

## CONVENTIONS

- **Auth**: JWT in httpOnly cookie (`openboot_token`). `getCurrentUser()` from `$lib/server/auth`
- **API responses**: Always `json({...})` with appropriate status codes
- **Rate limiting**: In-memory, per user ID. CONFIG_READ and CONFIG_WRITE limits
- **Input validation**: Server-side in route handlers. Visibility must be `public|unlisted|private`
- **Security headers**: Applied globally in `hooks.server.ts` (CSP, HSTS, X-Frame-Options)
- **Slug generation**: `slugify()` from `$lib/server/auth` — lowercase, alphanumeric + hyphens
- **Error handling**: Return `json({ error: '...' }, { status: N })`, never throw in API routes
- **Svelte 5**: Uses `$state`, `$derived`, `$props()` runes (not legacy `$:` reactive)

## ANTI-PATTERNS

- No `as any` or `@ts-ignore` — type properly
- No direct DB access outside `+server.ts` files — always through API routes
- No client-side secrets — all OAuth secrets in platform env
- No raw SQL without parameterized bindings — always `.bind()`
- No `is_public` — replaced by `visibility` field (migration 0006)

## COMMANDS

```bash
npm run dev                    # Local dev server
npm run build                  # Production build
npm run preview                # Preview production build
npm run check                  # Type checking
npx wrangler d1 migrations apply openboot --local   # Apply migrations locally
npx wrangler d1 migrations apply openboot --remote   # Apply migrations to prod
npx wrangler dev                                      # Dev with D1 binding
```

## CI/CD

Push-to-main auto-deploy via `.github/workflows/deploy.yml`:

1. `npm install` → `npm run build`
2. `wrangler d1 migrations apply openboot --remote` (runs pending migrations)
3. `wrangler deploy` (via cloudflare/wrangler-action)

Migrations run **before** deploy — safe for schema changes that new code depends on.

## NOTES

- **Cloudflare D1**: SQLite-compatible. No ALTER TABLE DROP COLUMN. Plan column removals carefully.
- **OG images**: Generated server-side with `@cf-wasm/resvg` SVG→PNG at `[username]/[slug]/og`
- **Docs**: Markdown in `src/docs/`, preprocessed by mdsvex, syntax highlighted by shiki.
- **CLI integration**: CLI calls `/api/configs/from-snapshot` to upload snapshots. Only reads `slug` from response.
- **OAuth**: GitHub + Google. Callbacks at `/api/auth/callback/{github,google}`.
- **CLI auth**: Polling flow — CLI calls `/api/auth/cli/start`, user approves at `/cli-auth`, CLI polls `/api/auth/cli/poll`.
