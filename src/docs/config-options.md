---
title: Config Options
group: Reference
order: 10
---

# Config Options

Every OpenBoot config — whether created from a preset, a snapshot, or the dashboard — follows the same structure. Here's what each field does.

## Full Example

```json
{
  "name": "frontend-team",
  "description": "Standard setup for our frontend developers",
  "base_preset": "developer",
  "packages": {
    "formulae": ["node", "pnpm", "ripgrep", "fd", "bat", "gh", "jq"],
    "casks": ["visual-studio-code", "arc", "figma", "warp", "raycast"],
    "npm": ["typescript", "tsx", "eslint", "prettier"]
  },
  "custom_script": "mkdir -p ~/projects\ngit clone git@github.com:yourorg/main-repo.git ~/projects/main-repo",
  "dotfiles_repo": "https://github.com/yourorg/team-dotfiles.git",
  "snapshot": null,
  "alias": "fe",
  "visibility": "unlisted"
}
```

## Fields

### `name`

Display name for the config. Used as the page title and in the dashboard.

- **Type:** string
- **Required:** yes
- **Example:** `"frontend-team"`

### `description`

Optional description shown on the config page.

- **Type:** string
- **Required:** no
- **Example:** `"Standard setup for our frontend developers"`

### `base_preset`

Which preset to start from. The preset's packages are included unless individually removed.

- **Type:** string
- **Options:** `"minimal"`, `"developer"`, `"full"`
- **Required:** no
- **Default:** none (empty config)

### `packages`

The tools and apps to install.

- **`formulae`** — CLI tools installed via `brew install`
- **`casks`** — GUI apps installed via `brew install --cask`
- **`npm`** — Global npm packages installed via `npm install -g`

All three are arrays of package name strings. Names must match Homebrew or npm package names exactly.

### `custom_script`

Shell commands that run after all packages are installed. Use this for project-specific setup like cloning repos, generating SSH keys, or configuring services.

- **Type:** string (newline-separated commands)
- **Required:** no
- **Runs as:** `bash -e` (stops on first error)

```
mkdir -p ~/projects
git clone git@github.com:yourorg/api.git ~/projects/api
ssh-keygen -t ed25519 -C "dev@yourcompany.com" -f ~/.ssh/id_ed25519 -N ""
```

### `dotfiles_repo`

Git URL to a dotfiles repository. OpenBoot clones it to `~/.dotfiles` and optionally symlinks with [GNU Stow](https://www.gnu.org/software/stow/).

- **Type:** string (Git URL)
- **Required:** no
- **Example:** `"https://github.com/yourname/dotfiles.git"`

See [Dotfiles & Shell](/docs/dotfiles-shell) for setup details.

### `snapshot`

Snapshot data attached to this config (auto-populated when creating from `openboot snapshot`). Contains the raw scan results — packages, preferences, shell config, git settings, dev tool versions.

- **Type:** object or null
- **Required:** no
- **Usually:** managed automatically, not edited by hand

### `alias`

Short URL alias for easy sharing. If set, the config is accessible at `openboot.dev/install?alias=<alias>`.

- **Type:** string
- **Required:** no
- **Must be:** unique across all configs

### `visibility`

Controls who can see and install this config.

- **Type:** string
- **Default:** `"unlisted"`
- **Options:**
  - `"public"` — listed on your profile, install URL works for everyone
  - `"unlisted"` — not listed on your profile, but install URL still works if shared
  - `"private"` — only you can see it, install URL returns 403 for others

## macOS Preferences Whitelist

These are the 23 system settings that OpenBoot can configure. Only these are captured by `openboot snapshot` and applied during install.

### Global

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Show all file extensions | Files show `.txt`, `.js`, etc. in Finder | on |
| Always show scrollbars | No auto-hiding scrollbars | on |
| Disable auto-correct | No automatic text correction | on |
| Disable auto-capitalization | No automatic capitalization | on |
| Fast key repeat | Faster character repeat when holding a key | on |
| Short key repeat delay | Shorter delay before repeat starts | on |

### Finder

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Show path bar | Full path shown at bottom of Finder | on |
| Show status bar | Item count and disk space at bottom | on |
| Default to list view | Finder opens in list view | on |
| No extension change warning | No alert when renaming file extensions | on |
| Show hidden files | Dotfiles and hidden folders visible | on |

### Dock

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Keep Dock visible | Dock does not auto-hide | on |
| Hide recent applications | No "recent apps" section in Dock | on |
| Icon size | Dock icon size in pixels | 48 |
| Scale minimize effect | Use scale animation instead of genie | on |

### Screenshots

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Save location | Where screenshots are saved | `~/Screenshots` |
| PNG format | Save as PNG instead of other formats | on |
| Disable shadow | No drop shadow on window screenshots | on |

### Safari

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Developer menu | Show Develop menu in menu bar | on |
| WebKit developer extras | Enable Web Inspector and other dev tools | on |

### TextEdit

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Plain text mode | Default to plain text, not rich text | on |
| UTF-8 encoding | Use UTF-8 for plain text files | on |

### Time Machine

| Setting | Description | Default Value |
|---------|-------------|---------------|
| Don't prompt for new disks | No "use this disk for backup?" popups | on |
