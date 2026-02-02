# openboot.dev

> Website and API for [OpenBoot](https://github.com/openbootdotdev/openboot)

[![Deploy](https://github.com/openbootdotdev/openboot.dev/actions/workflows/deploy.yml/badge.svg)](https://github.com/openbootdotdev/openboot.dev/actions/workflows/deploy.yml)

## Overview

This repository contains the website and API for OpenBoot:

- **Landing page** at [openboot.dev](https://openboot.dev)
- **Dashboard** for creating custom configurations
- **Install script generator** for custom configs
- **API** for config storage and retrieval

## Tech Stack

- **Framework**: [SvelteKit 5](https://svelte.dev/) with TypeScript
- **Styling**: CSS Variables (dark/light theme)
- **Auth**: GitHub OAuth
- **Database**: Cloudflare D1 (SQLite)
- **Hosting**: Cloudflare Workers

## Development

### Prerequisites

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Cloudflare account (for D1 database)

### Setup

```bash
# Install dependencies
npm install

# Create local D1 database
wrangler d1 create openboot-local

# Run migrations
wrangler d1 execute openboot-local --local --file=migrations/0001_init.sql
wrangler d1 execute openboot-local --local --file=migrations/0002_add_alias.sql
wrangler d1 execute openboot-local --local --file=migrations/0003_add_dotfiles_repo.sql

# Start dev server
npm run dev
```

### Environment Variables

Create a `.dev.vars` file:

```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Deployment

Deployment is automatic on push to `main` via GitHub Actions.

Manual deploy:

```bash
npm run build
wrangler deploy
```

### Required Secrets

Set these in GitHub repository settings:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /install` | Default install script |
| `GET /:alias` | Install script for alias (e.g., `/fullstackjam`) |
| `GET /:username/:slug/install` | Install script for config |
| `GET /:username/:slug/config` | Config JSON |
| `GET /api/user` | Current user info |
| `GET /api/configs` | List user's configs |

## Database Schema

```sql
-- users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TEXT
);

-- configs
CREATE TABLE configs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  slug TEXT,
  name TEXT,
  packages TEXT,        -- JSON array
  custom_script TEXT,
  dotfiles_repo TEXT,
  alias TEXT UNIQUE,
  is_public INTEGER,
  created_at TEXT,
  updated_at TEXT
);
```

## Project Structure

```
openbootdotdev/
├── openboot        # CLI tool (Go)
├── openboot.dev    # This repo - Website (SvelteKit)
└── dotfiles        # Dotfiles template
```

## Related

- [openboot](https://github.com/openbootdotdev/openboot) - CLI tool
- [dotfiles](https://github.com/openbootdotdev/dotfiles) - Dotfiles template

## License

MIT
