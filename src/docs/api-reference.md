---
title: API Reference
description: REST API for configs, package search, Brewfile parsing, and authentication. All endpoints at openboot.dev.
group: Reference
order: 14
---

# API Reference

OpenBoot provides a REST API for programmatic access to configs, package search, and utilities. All endpoints are hosted at `https://openboot.dev`.

## Base URL

```
https://openboot.dev
```

## Authentication

Most write endpoints and dashboard-style read endpoints require authentication. Two mechanisms are supported:

- **Browser session** — set automatically after OAuth login (httpOnly `session` cookie).
- **CLI token** — sent via the `Authorization` header:

  ```
  Authorization: Bearer obt_xxxxxxxxxxxxxxxx
  ```

  Get a token by running `openboot login` — it's saved to `~/.openboot/auth.json` and starts with the `obt_` prefix.

---

## Configs

### List User Configs

Get all configs for the authenticated user.

```
GET /api/configs
```

**Auth required:** Yes

**Response:**

```json
{
  "username": "alex",
  "configs": [
    {
      "id": "cfg_abc123",
      "slug": "my-setup",
      "name": "My Dev Setup",
      "description": "Personal development environment",
      "base_preset": "developer",
      "packages": [{ "name": "node", "type": "formula" }],
      "snapshot": null,
      "snapshot_at": null,
      "visibility": "unlisted",
      "alias": null,
      "install_count": 12,
      "updated_at": "2024-02-10T14:20:00Z"
    }
  ]
}
```

`packages` and `snapshot` are returned as parsed JSON (not strings). For the full row (including `custom_script`, `dotfiles_repo`, etc.), use `GET /api/configs/:slug`.

### Get Config (Dashboard)

Get one of the authenticated user's configs by slug, with installation URL. This is the dashboard endpoint — for the CLI-flattened shape, see [`GET /:username/:slug/config`](#get-config-cli) further down.

```
GET /api/configs/:slug
```

**Auth required:** Yes (returns 401 otherwise). Only returns configs owned by the caller; other users' configs return 404 regardless of visibility.

**Response:**

```json
{
  "config": {
    "id": "cfg_abc123",
    "slug": "my-setup",
    "name": "My Dev Setup",
    "description": "Personal development environment",
    "base_preset": "developer",
    "packages": [
      { "name": "node", "type": "formula" }
    ],
    "custom_script": "mkdir -p ~/projects",
    "dotfiles_repo": "https://github.com/user/dotfiles.git",
    "visibility": "unlisted",
    "alias": "mine",
    "snapshot": { "...": "parsed snapshot or null" },
    "macos_prefs": [
      { "domain": "com.apple.dock", "key": "tilesize", "value": "48", "type": "int" }
    ]
  },
  "install_url": "https://openboot.dev/mine"
}
```

### Create Config

Create a new config.

```
POST /api/configs
```

**Auth required:** Yes

**Request body:**

```json
{
  "name": "My Setup",
  "description": "Dev environment",
  "base_preset": "developer",
  "packages": [
    { "name": "node", "type": "formula" }
  ],
  "custom_script": "",
  "dotfiles_repo": "",
  "visibility": "unlisted",
  "alias": "mine"
}
```

**Response:** `201 Created`

```json
{
  "id": "cfg_abc123",
  "slug": "my-setup",
  "alias": "mine",
  "install_url": "https://openboot.dev/mine"
}
```

Constraints: name ≤ 100 chars; description ≤ 500 chars; alias 2–20 chars (lowercase alphanumeric + hyphens, reserved words rejected); max 500 packages; max 20 configs per user.

### Update Config

Update an existing config. All fields are optional — only the fields you send are changed.

```
PUT /api/configs/:slug
```

**Auth required:** Yes (must own the config)

**Request body:** Same shape as create. Setting `alias` to `""` or `null` removes the alias.

**Response:**

```json
{
  "success": true,
  "slug": "my-setup",
  "alias": "mine",
  "install_url": "https://openboot.dev/mine"
}
```

Renaming via `name` regenerates the slug — the new slug is returned.

### Delete Config

Delete a config.

```
DELETE /api/configs/:slug
```

**Auth required:** Yes (must own the config)

**Response:** `200 OK`

```json
{ "success": true }
```

### Create or Update Config from Snapshot

Upload a snapshot captured by `openboot snapshot`. Creates a new config, or updates an existing one when `config_slug` is provided. `POST` and `PUT` both route here.

```
POST /api/configs/from-snapshot
PUT  /api/configs/from-snapshot
```

**Auth required:** Yes

**Payload size limit:** 1 MB

**Request body:**

```json
{
  "name": "My Mac Setup",
  "description": "Captured 2026-05-17",
  "visibility": "unlisted",
  "config_slug": "my-mac-setup",
  "message": "added pnpm",
  "snapshot": {
    "matched_preset": "developer",
    "packages": {
      "formulae": ["node", "go"],
      "casks": ["visual-studio-code"],
      "npm": ["typescript"],
      "taps": ["homebrew/cask-fonts"]
    },
    "macos_prefs": [
      { "domain": "com.apple.dock", "key": "tilesize", "value": "48", "type": "int" }
    ],
    "shell": { "...": "..." },
    "git": { "...": "..." }
  }
}
```

- `config_slug` is optional; when present, the snapshot updates that existing config and records a revision with `message`.
- `snapshot.packages` must be an object with `formulae`, `casks`, `npm`, `taps` arrays.

**Response:** the created or updated config row, with `packages` and `snapshot` parsed. Status is `201 Created` for a new config or `200 OK` for an update.

```json
{
  "id": "cfg_abc123",
  "slug": "my-mac-setup",
  "name": "My Mac Setup",
  "packages": [{ "name": "node", "type": "formula" }],
  "snapshot": { "...": "the snapshot you uploaded" },
  "visibility": "unlisted"
}
```

---

## Config Endpoints (Public / CLI)

### Get Config (CLI)

Returns a flattened, CLI-friendly shape used by `openboot install`. Different fields than `GET /api/configs/:slug`.

```
GET /:username/:slug/config
```

**Auth required:** Only for `private` configs (Bearer token belonging to the owner). Public and unlisted configs are open.

**Response:**

```json
{
  "username": "alex",
  "slug": "my-setup",
  "name": "My Dev Setup",
  "preset": "developer",
  "packages": [{ "name": "node", "desc": "JavaScript runtime" }],
  "casks":    [{ "name": "visual-studio-code", "desc": "Code editor" }],
  "taps":     ["homebrew/cask-fonts"],
  "npm":      [{ "name": "typescript", "desc": "..." }],
  "dotfiles_repo": "",
  "post_install": ["mkdir -p ~/projects"],
  "macos_prefs": [
    { "domain": "com.apple.dock", "key": "tilesize", "value": "48", "type": "int" }
  ]
}
```

`post_install` is the `custom_script` split into trimmed non-empty lines.

### Get Install Script

Get the shell install script for a config. The CLI's `install.sh` curls this URL.

```
GET /:username/:slug/install
```

**Auth required:** Only for `private` configs. Send a Bearer token belonging to the owner; otherwise the endpoint returns `403 Config is private` as plain text. (The page route `/:username/:slug` returns 404 for non-owners of a private config — there is no interactive auth prompt.)

**Response:** Shell script, `Content-Type: text/plain; charset=utf-8`.

```bash
#!/bin/bash
# OpenBoot install script for username/slug
# ...
```

---

## Package Catalog

### List All Packages

Returns the complete package catalog with metadata. Used by the CLI to fetch package descriptions and installer types. Cached `1h` client / `24h` CDN.

```
GET /api/packages
```

**Auth required:** No

**Response:**

```json
{
  "packages": [
    {
      "name": "git",
      "desc": "Distributed version control system",
      "category": "essential",
      "type": "cli",
      "installer": "formula"
    },
    {
      "name": "visual-studio-code",
      "desc": "Code editor with extensions and debugging",
      "category": "essential",
      "type": "gui",
      "installer": "cask"
    },
    {
      "name": "typescript",
      "desc": "Typed superset of JavaScript",
      "category": "essential",
      "type": "language",
      "installer": "npm"
    }
  ]
}
```

**Fields:**
- `name` — Package identifier
- `desc` — Human-readable description
- `category` — `essential`, `development`, `productivity`, or `optional`
- `type` — Package kind: `cli`, `gui`, `language`, `devops`, or `database`
- `installer` — Install method: `formula` (Homebrew), `cask` (Homebrew Cask), or `npm`

---

## Package Search

### Search Homebrew Packages

Search for Homebrew formulae and casks. Results are limited to 30.

```
GET /api/homebrew/search?q=<query>
```

**Auth required:** No

**Query parameters:**
- `q` — Search query (min 2 chars)

**Response:**

```json
{
  "results": [
    { "name": "node",               "desc": "JavaScript runtime",     "type": "formula" },
    { "name": "visual-studio-code", "desc": "Code editor",            "type": "cask" }
  ]
}
```

When the query is too short or rate-limited, the response is `{ "results": [], "error": "..." }`.

### Search NPM Packages

Search for npm packages (proxies the npm registry, up to 30 results).

```
GET /api/npm/search?q=<query>
```

**Auth required:** No

**Query parameters:**
- `q` — Search query (min 2 chars)

**Response:**

```json
{
  "results": [
    { "name": "typescript", "desc": "TypeScript language", "type": "npm" }
  ]
}
```

---

## Utilities

### Parse Brewfile

Parse a Brewfile and extract package lists. Used by the dashboard's Brewfile import.

```
POST /api/brewfile/parse
```

**Auth required:** No

**Request body:** JSON

```json
{
  "content": "brew \"node\"\nbrew \"go\"\ncask \"visual-studio-code\""
}
```

Max content length: 50 KB.

**Response:**

```json
{
  "packages": ["node", "go", "visual-studio-code"],
  "formulas": ["node", "go"],
  "casks":    ["visual-studio-code"],
  "taps":     []
}
```

`packages` is the combined `formulas + casks` list for convenience. Note the field is `formulas`, not `formulae`.

---

## Authentication

### Get Current User

Get the authenticated user's information.

```
GET /api/user
```

**Auth required:** Yes

**Response:**

```json
{
  "user": {
    "id": "usr_abc123",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar_url": "https://avatars.githubusercontent.com/u/123?v=4"
  }
}
```

---

## Rate Limits

Rate limits are enforced in-memory per Cloudflare Worker isolate (not globally consistent — see `src/lib/server/rate-limit.ts`).

| Endpoint Type | Limit |
|---------------|-------|
| Config reads (`/api/configs`, `/api/configs/:slug`) | 30 requests per minute |
| Config writes (POST/PUT/DELETE configs, snapshot upload) | 30 requests per minute |
| Search (`/api/homebrew/search`, `/api/npm/search`, `/api/brewfile/parse`) | 30 requests per minute |
| Auth login | 10 requests per minute |
| CLI device flow (start / approve / poll) | 5–20 requests per minute |

When the limit is exceeded, the response is `429 Too Many Requests` with body `{ "error": "Rate limit exceeded" }` and a `Retry-After` header (seconds). No `X-RateLimit-*` headers are returned.

---

## Visibility Modes

Configs have three visibility levels:

| Visibility | Listing | Install URL | API Read |
|------------|---------|-------------|----------|
| **public** | Listed on `/explore` and your profile | Anyone can install | Anyone (via `/:username/:slug/config`) |
| **unlisted** | Not listed publicly | Anyone with the link can install | Anyone with the link |
| **private** | Owner only | Requires owner's Bearer token (403 otherwise) | Requires owner's Bearer token |

For private configs, run `openboot login` first to authenticate before installing.

---

## Error Responses

All errors return JSON with an `error` field, except plain-text install endpoints which return text:

```json
{ "error": "Config not found" }
```

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing or invalid auth) |
| 403 | Forbidden (no permission, e.g. private config) |
| 404 | Not Found |
| 409 | Conflict (slug or alias already taken) |
| 413 | Payload Too Large (snapshot > 1 MB) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Examples

### Create a Config

```bash
TOKEN=$(jq -r '.token' ~/.openboot/auth.json)

curl -X POST https://openboot.dev/api/configs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Setup",
    "base_preset": "developer",
    "packages": [
      {"name": "node",                "type": "formula"},
      {"name": "visual-studio-code",  "type": "cask"}
    ]
  }'
```

### Search Packages

```bash
curl "https://openboot.dev/api/homebrew/search?q=docker"
```

### Get Config JSON (CLI shape)

```bash
curl https://openboot.dev/johndoe/my-setup/config
```

---

See also: [CLI Reference](/docs/cli-reference) for the `openboot` command-line tool.
