# openboot.dev

> Website, dashboard, and API for [OpenBoot](https://github.com/openbootdotdev/openboot) — one-line macOS dev environment setup.

[![Deploy](https://github.com/openbootdotdev/openboot.dev/actions/workflows/deploy.yml/badge.svg)](https://github.com/openbootdotdev/openboot.dev/actions/workflows/deploy.yml)

**Live at [openboot.dev](https://openboot.dev)**

## What This Repo Does

- **Landing page** — product overview, presets, install commands
- **Dashboard** — create, edit, duplicate, and share custom configs
- **Install API** — serves configs for the OpenBoot CLI
- **Brewfile import** — parse and convert Brewfiles into OpenBoot configs
- **Homebrew search** — live package search from the dashboard
- **CLI auth** — device flow for authenticating the CLI via browser
- **Snapshot API** — receive and store machine snapshots from the CLI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [SvelteKit 5](https://svelte.dev/) + TypeScript |
| Styling | CSS variables (dark/light theme) |
| Auth | GitHub & Google OAuth |
| Database | Cloudflare D1 (SQLite) |
| Hosting | Cloudflare Workers + Pages |

## Development

```bash
npm install

# Apply all migrations automatically
wrangler d1 migrations apply openboot --local

npm run dev
```

Create a `.dev.vars` file:

```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Deployment

Automatic on push to `main` via GitHub Actions.

```bash
npm run build
wrangler deploy
```

GitHub repository secrets required: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## API Endpoints

### Install Scripts

| Endpoint | Description |
|----------|-------------|
| `GET /install` | Default install script |
| `GET /:alias` | Install script for short alias |
| `GET /:username/:slug/install` | Install script for specific config |
| `GET /:username/:slug/config` | Config JSON for CLI consumption |

### Auth

| Endpoint | Description |
|----------|-------------|
| `GET /api/auth/login` | GitHub/Google OAuth login redirect |
| `GET /api/auth/callback/github` | GitHub OAuth callback |
| `GET /api/auth/callback/google` | Google OAuth callback |
| `GET /api/auth/logout` | Clear session |
| `POST /api/auth/cli/start` | Start CLI device auth flow |
| `POST /api/auth/cli/approve` | Approve CLI auth request |
| `GET /api/auth/cli/poll` | Poll CLI auth status |

### Configs

| Endpoint | Description |
|----------|-------------|
| `GET /api/user` | Current user info |
| `GET /api/configs` | List user's configs |
| `POST /api/configs` | Create config |
| `GET /api/configs/:slug` | Get config by slug |
| `PUT /api/configs/:slug` | Update config |
| `DELETE /api/configs/:slug` | Delete config |
| `POST /api/configs/from-snapshot` | Create config from CLI snapshot |

### Utilities

| Endpoint | Description |
|----------|-------------|
| `POST /api/brewfile/parse` | Parse Brewfile content into packages |
| `GET /api/homebrew/search?q=` | Search Homebrew packages |
| `GET /api/npm/search?q=` | Search NPM packages |

## Database Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TEXT
);

CREATE TABLE configs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  slug TEXT,
  name TEXT,
  description TEXT,
  base_preset TEXT,
  packages TEXT,
  custom_script TEXT,
  dotfiles_repo TEXT,
  snapshot TEXT,
  alias TEXT UNIQUE,
  visibility TEXT DEFAULT 'unlisted',
  install_count INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);
```

## Related

- [openboot](https://github.com/openbootdotdev/openboot) — CLI tool (Go)
- [dotfiles](https://github.com/openbootdotdev/dotfiles) — Dotfiles template

## License

MIT
