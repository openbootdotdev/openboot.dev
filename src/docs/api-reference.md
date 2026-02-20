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

Some endpoints require authentication. Include your auth token in the `Authorization` header:

```
Authorization: Bearer YOUR_TOKEN
```

Get your token by running `openboot login` — it's saved to `~/.openboot/auth.json`.

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
[
  {
    "id": "cfg_abc123",
    "slug": "my-setup",
    "name": "My Dev Setup",
    "description": "Personal development environment",
    "visibility": "unlisted",
    "install_count": 12,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-02-10T14:20:00Z"
  }
]
```

### Get Config

Get a specific config by username and slug. Public and unlisted configs are accessible without auth. Private configs require authentication and ownership.

```
GET /api/configs/:slug
```

**Auth required:** Only for private configs

**Response:**

```json
{
  "id": "cfg_abc123",
  "slug": "my-setup",
  "name": "My Dev Setup",
  "description": "Personal development environment",
  "base_preset": "developer",
  "packages": [
    { "name": "node", "type": "formula" },
    { "name": "visual-studio-code", "type": "cask" }
  ],
  "custom_script": "mkdir -p ~/projects",
  "dotfiles_repo": "https://github.com/user/dotfiles.git",
  "visibility": "unlisted"
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
  "visibility": "unlisted"
}
```

**Response:**

```json
{
  "id": "cfg_abc123",
  "slug": "my-setup"
}
```

### Update Config

Update an existing config.

```
PUT /api/configs/:slug
```

**Auth required:** Yes (must own the config)

**Request body:** Same as create (all fields optional)

**Response:** Updated config object

### Delete Config

Delete a config.

```
DELETE /api/configs/:slug
```

**Auth required:** Yes (must own the config)

**Response:** `204 No Content`

### Create Config from Snapshot

Upload a snapshot captured by `openboot snapshot` to create a config.

```
POST /api/configs/from-snapshot
```

**Auth required:** Yes

**Request body:**

```json
{
  "name": "My Mac Setup",
  "snapshot": {
    "packages": {
      "formulae": ["node", "go"],
      "casks": ["visual-studio-code"],
      "npm": ["typescript"]
    },
    "macos_prefs": [...],
    "shell": {...},
    "git": {...}
  }
}
```

**Response:**

```json
{
  "slug": "my-mac-setup"
}
```

---

## Config Pages

### Get Config JSON

Get the full config data for a username/slug combination.

```
GET /:username/:slug/config
```

**Auth required:** Only for private configs

**Response:** Config object (same as `GET /api/configs/:slug`)

### Get Install Script

Get the shell install script for a config.

```
GET /:username/:slug/install
```

**Auth required:** Only for private configs (redirects to browser auth flow if unauthenticated)

**Response:** Shell script (`Content-Type: text/x-shellscript`)

```bash
#!/bin/bash
# OpenBoot install script for username/slug
# ...
```

---

## Package Search

### Search Homebrew Packages

Search for Homebrew formulae and casks.

```
GET /api/homebrew/search?q=<query>
```

**Auth required:** No

**Query parameters:**
- `q` — Search query

**Response:**

```json
{
  "formulae": [
    { "name": "node", "desc": "JavaScript runtime" }
  ],
  "casks": [
    { "name": "visual-studio-code", "desc": "Code editor" }
  ]
}
```

### Search NPM Packages

Search for npm packages.

```
GET /api/npm/search?q=<query>
```

**Auth required:** No

**Query parameters:**
- `q` — Search query

**Response:**

```json
{
  "packages": [
    { "name": "typescript", "description": "TypeScript language" }
  ]
}
```

---

## Utilities

### Parse Brewfile

Parse a Brewfile and extract package lists.

```
POST /api/brewfile/parse
```

**Auth required:** No

**Request body:**

```
brew "node"
brew "go"
cask "visual-studio-code"
```

**Response:**

```json
{
  "formulae": ["node", "go"],
  "casks": ["visual-studio-code"],
  "taps": []
}
```

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
  "id": "usr_abc123",
  "username": "johndoe",
  "email": "john@example.com",
  "avatar_url": "https://...",
  "oauth_provider": "github"
}
```

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Config reads | 60 requests per minute |
| Config writes | 20 requests per minute |
| Package search | 30 requests per minute |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

---

## Visibility Modes

Configs have three visibility levels that control access:

| Visibility | Config Page | Install URL | API Access |
|------------|-------------|-------------|------------|
| **public** | Anyone can view | Anyone can install | Anyone can read |
| **unlisted** | Anyone with link can view | Anyone can install | Anyone can read |
| **private** | Owner only | Requires auth | Owner only |

For private configs, run `openboot login` first to authenticate before installing.

---

## Error Responses

All errors return JSON with an `error` field:

```json
{
  "error": "Config not found"
}
```

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing or invalid auth token) |
| 403 | Forbidden (no permission to access resource) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Examples

### Create a Config

```bash
TOKEN=$(cat ~/.openboot/auth.json | jq -r '.token')

curl -X POST https://openboot.dev/api/configs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Setup",
    "base_preset": "developer",
    "packages": [
      {"name": "node", "type": "formula"},
      {"name": "visual-studio-code", "type": "cask"}
    ]
  }'
```

### Search Packages

```bash
curl "https://openboot.dev/api/homebrew/search?q=docker"
```

### Get Config JSON

```bash
curl https://openboot.dev/johndoe/my-setup/config
```

---

See also: [CLI Reference](/docs/cli-reference) for the `openboot` command-line tool.
