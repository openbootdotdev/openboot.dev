---
title: Config Options
description: Full config schema — packages, custom scripts, dotfiles repo, visibility, aliases, and the 26 macOS preferences whitelist.
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
  "packages": [
    { "name": "node", "type": "formula" },
    { "name": "pnpm", "type": "formula" },
    { "name": "ripgrep", "type": "formula" },
    { "name": "visual-studio-code", "type": "cask" },
    { "name": "arc", "type": "cask" },
    { "name": "typescript", "type": "npm" },
    { "name": "homebrew/cask-fonts", "type": "tap" }
  ],
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

The tools and apps to install. Stored as an array of package objects, each with a `name` and `type`.

- **`formula`** — CLI tools installed via `brew install`
- **`cask`** — GUI apps installed via `brew install --cask`
- **`npm`** — Global npm packages installed via `npm install -g`
- **`tap`** — Third-party Homebrew repositories added via `brew tap`

Each entry is an object: `{ "name": "package-name", "type": "formula" | "cask" | "npm" | "tap" }`. Names must match Homebrew or npm package names exactly. Taps are added before formulae and casks are installed.

### `custom_script`

Shell commands that run after all packages are installed. Use this for project-specific setup like cloning repos, generating SSH keys, or configuring services.

- **Type:** string (newline-separated commands)
- **Required:** no
- **Runs as:** `bash` (errors are logged but don't stop the install)

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

Short URL alias for easy sharing. If set, this alias becomes the primary way to install the config — for example, `openboot install my-setup` instead of `openboot install username/slug`. The alias also works as a short URL: `openboot.dev/my-setup`.

When a user runs `openboot install <word>`, the CLI checks aliases first before falling back to `username/default`.

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
  - `"private"` — only you can access. Run `openboot login` first, then `openboot install yourname/slug`

## Export

You can export any config as a JSON file from the dashboard. Click the **Export** button on a config card to download a `.json` file containing all config data (name, packages, custom script, dotfiles repo, snapshot, visibility, and alias).

## macOS Preferences Whitelist

These are the 26 system settings that OpenBoot can configure. Only these are captured by `openboot snapshot` and applied during install. In the dashboard, preferences are grouped into collapsible accordion sections by category.

### Dock

| Setting | Description | Default |
|---------|-------------|---------|
| Auto-hide Dock | Automatically hide and show the Dock | on |
| Auto-hide delay (s) | Delay before Dock appears on hover — 0 for instant | 0 |
| Icon size | Dock icon size in pixels | 48 |
| Show recent apps | Show recently used apps in a separate Dock section | off |
| Position on screen | Which edge the Dock appears on (bottom, left, right) | bottom |
| Minimize animation | Visual effect when minimizing windows (genie or scale) | genie |
| Show only active apps | Hide non-running apps from the Dock | off |
| Animate app launches | Bounce icons when launching an app | on |

### Finder

| Setting | Description | Default |
|---------|-------------|---------|
| Default view style | How files display in new windows (icon, list, column, gallery) | list |
| New window opens | Default location for new Finder windows | Home folder |
| Default search scope | Where Finder searches by default (This Mac, current folder) | Current folder |
| Show path bar | Full folder path at bottom of windows | on |
| Show status bar | Item count and disk space at bottom of windows | on |
| Show hidden files | Show files and folders starting with a dot | off |
| Always show file extensions | Show extensions for all files | on |
| Show full path in title bar | Display POSIX path in window title | off |

### Trackpad

| Setting | Description | Default |
|---------|-------------|---------|
| Tap to click | Tap the trackpad to click instead of pressing down | on |
| Natural scrolling | Scroll content in the direction your fingers move | on |
| Three-finger drag | Drag windows and items using three fingers | off |

### Desktop

| Setting | Description | Default |
|---------|-------------|---------|
| Click desktop to show it | Click wallpaper to hide all windows | off |

### Keyboard

| Setting | Description | Default |
|---------|-------------|---------|
| Key repeat rate | How fast keys repeat when held — lower = faster | 2 |
| Delay until key repeat | How long before a held key starts repeating | 15 |
| Press and hold for accents | Show accent menu when holding a key (disable for faster repeat) | off |

### Screenshots

| Setting | Description | Default |
|---------|-------------|---------|
| Screenshot format | File format for screenshots (PNG, JPEG, PDF, TIFF) | PNG |
| Disable window shadows | Remove drop shadows from window screenshots | on |

### Menu Bar

| Setting | Description | Default |
|---------|-------------|---------|
| Show Sound in menu bar | Always show volume control in the menu bar | on |
