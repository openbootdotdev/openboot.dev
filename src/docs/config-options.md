---
title: Config Options
description: Full config schema — packages, custom scripts, dotfiles repo, visibility, aliases, and the macOS preferences whitelist.
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
- **Default:** `"developer"`

### `packages`

The tools and apps to install. Stored as an array of package objects, each with a `name` and `type`.

- **`formula`** — CLI tools installed via `brew install`
- **`cask`** — GUI apps installed via `brew install --cask`
- **`npm`** — Global npm packages installed via `npm install -g`
- **`tap`** — Third-party Homebrew repositories added via `brew tap`

Each entry is an object: `{ "name": "package-name", "type": "formula" | "cask" | "npm" | "tap" }`. Names must match Homebrew or npm package names exactly. Taps are added before formulae and casks are installed.

**Limits:** max 500 packages per config; name max 200 characters (alphanumeric, `.`, `_`, `-`, `@`, `/`).

### `custom_script`

Shell commands that run after all packages are installed. Use this for project-specific setup like cloning repos, generating SSH keys, or configuring services.

- **Type:** string (newline-separated commands)
- **Required:** no
- **Max length:** 10,000 characters
- **Runs as:** `bash` (errors are logged but don't stop the install)

```
mkdir -p ~/projects
git clone git@github.com:yourorg/api.git ~/projects/api
ssh-keygen -t ed25519 -C "dev@yourcompany.com" -f ~/.ssh/id_ed25519 -N ""
```

### `dotfiles_repo`

Git URL to a dotfiles repository. OpenBoot clones it to `~/.dotfiles` and optionally symlinks with [GNU Stow](https://www.gnu.org/software/stow/).

- **Type:** string (HTTPS Git URL)
- **Required:** no
- **Max length:** 500 characters
- **Must:** start with `https://`. `ssh://` and `git@` URLs are rejected.
- **Example:** `"https://github.com/yourname/dotfiles.git"`

See [Dotfiles & Shell](/docs/dotfiles-shell) for setup details.

### `snapshot`

Snapshot data attached to this config (auto-populated when creating from `openboot snapshot`). Contains the raw scan results — packages, preferences, shell config, git settings, dev tool versions.

- **Type:** object or null
- **Required:** no
- **Usually:** managed automatically, not edited by hand

Each entry in `snapshot.macos_prefs[]` has the shape `{ domain, key, value, type?, host? }`. `host` selects the `defaults` scope: `""` (default) writes to the main domain, `"currentHost"` writes via `defaults -currentHost` (required for keys under `~/Library/Preferences/ByHost/`).

### `alias`

Short URL alias for easy sharing. If set, this alias becomes the primary way to install the config — for example, `openboot install my-setup` instead of `openboot install username/slug`. The alias also works as a short URL: `openboot.dev/my-setup`.

When a user runs `openboot install <word>`, the CLI checks aliases first before falling back to `username/default`.

- **Type:** string
- **Required:** no
- **Length:** 2–20 characters (after cleaning)
- **Allowed characters:** lowercase letters, digits, hyphens. Other characters are stripped automatically.
- **Must be:** unique across all configs
- **Reserved:** `api`, `install`, `dashboard`, `login`, `docs`, `cli-auth`, `explore`

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

These are the system settings that OpenBoot can configure. Only these are captured by `openboot snapshot` and applied during install. In the dashboard, preferences are grouped into collapsible accordion sections by category.

### System

| Setting | Description | Default |
|---------|-------------|---------|
| Show all file extensions | Show extensions for all files | on |
| Always show scrollbars | Always visible, not just on scroll | Always |
| Disable auto-correct | Turn off automatic spelling correction | off |
| Disable auto-capitalization | Turn off automatic capitalization | off |
| Fast key repeat rate | How fast keys repeat when held — lower = faster (KeyRepeat) | 2 |
| Short delay until key repeat | How long before a held key starts repeating (InitialKeyRepeat) | 15 |

### Finder

| Setting | Description | Default |
|---------|-------------|---------|
| Show path bar | Full folder path at bottom of windows | on |
| Show status bar | Item count and disk space at bottom of windows | on |
| Show sidebar | Show sidebar in Finder windows | on |
| Show tab bar | Show tab bar in Finder windows | on |
| Show preview pane | Show preview pane in Finder windows | off |
| Default view style | How files display in new windows (Nlsv=list, icnv=icon, clmv=column, glyv=gallery) | list |
| Show hidden files | Show files and folders starting with a dot | on |
| Show full POSIX path in title | Display full path in window title bar | on |
| No extension change warning | Suppress the warning when changing a file extension | on |
| Default search scope | Where Finder searches by default (SCcf=current folder, SCev=This Mac) | Current folder |
| Keep folders on top (name sort) | Folders sorted before files when sorting by name | on |
| Keep folders on top (Desktop) | Folders sorted before files on the Desktop | on |
| Don't warn before emptying Trash | Skip confirmation dialog when emptying Trash | on |
| Remove Trash items after 30 days | Auto-purge items in Trash older than 30 days | on |
| Allow quitting Finder (⌘Q) | Enable Quit menu item for Finder | on |
| New window target | Default location for new Finder windows (PfHm=Home, PfDe=Desktop, PfDo=Documents, PfLo=custom path) | Home |
| New window custom path | Custom path when target is PfLo | — |
| Show external drives on Desktop | Show mounted external hard drives on Desktop | on |
| Show internal hard drives on Desktop | Show internal drives on Desktop | off |
| Show servers on Desktop | Show mounted network servers on Desktop | off |
| Show removable media on Desktop | Show USB drives etc. on Desktop | on |
| Show recent tags in sidebar | Show recent tags in Finder sidebar | on |
| No .DS_Store on network volumes | Suppress .DS_Store files on network shares | on |
| No .DS_Store on USB volumes | Suppress .DS_Store files on USB drives | on |

### Dock

| Setting | Description | Default |
|---------|-------------|---------|
| Auto-hide Dock | Automatically hide and show the Dock | off |
| Show recent apps | Show recently used apps in a separate Dock section | off |
| Icon size | Dock icon size in pixels | 48 |
| Minimize animation | Visual effect when minimizing windows (scale or genie) | scale |

### Screenshots

| Setting | Description | Default |
|---------|-------------|---------|
| Screenshot save location | Folder where screenshots are saved | ~/Screenshots |
| Screenshot format | File format for screenshots (png, jpg, pdf, tiff) | png |
| Disable window shadows | Remove drop shadows from window screenshots | on |

### Trackpad

| Setting | Description | Default |
|---------|-------------|---------|
| Tap to click (wired) | Tap the trackpad to click instead of pressing down | on |
| Tap to click (Bluetooth) | Same setting for Bluetooth trackpads | on |
| Three-finger drag | Drag windows and items using three fingers | on |

### Keyboard

| Setting | Description | Default |
|---------|-------------|---------|
| Use F1–F12 as standard function keys | Fn key not required to use function keys | on |

### Mission Control

| Setting | Description | Default |
|---------|-------------|---------|
| Don't auto-rearrange Spaces | Keep Spaces order fixed instead of reordering by recent use | on |
| Group windows by application | Group windows by app in Mission Control | on |
| Top-left hot corner | Action when cursor hits top-left corner (0 = disabled) | 0 |
| Top-right hot corner | Action when cursor hits top-right corner (0 = disabled) | 0 |
| Bottom-left hot corner | Action when cursor hits bottom-left corner (0 = disabled) | 0 |
| Bottom-right hot corner | Action when cursor hits bottom-right corner (0 = disabled) | 0 |
| Top-left hot corner modifier | Modifier key for top-left corner (0 = none) | 0 |
| Top-right hot corner modifier | Modifier key for top-right corner (0 = none) | 0 |
| Bottom-left hot corner modifier | Modifier key for bottom-left corner (0 = none) | 0 |
| Bottom-right hot corner modifier | Modifier key for bottom-right corner (0 = none) | 0 |

### Menu Bar

| Setting | Description | Default |
|---------|-------------|---------|
| Show Sound in menu bar | Show/hide Sound icon | on |
| Show Bluetooth in menu bar | Show/hide Bluetooth icon | on |
| Show Wi-Fi in menu bar | Show/hide Wi-Fi icon | on |
| Show Battery in menu bar | Show/hide Battery icon | on |
| Hide AirDrop from menu bar | Hide AirDrop icon | on |
| Hide Display from menu bar | Hide Display icon | on |
| Hide Focus Modes from menu bar | Hide Focus Modes icon | on |
| Hide Now Playing from menu bar | Hide Now Playing icon | on |
| Hide Screen Mirroring from menu bar | Hide Screen Mirroring icon | on |
| Sound always-show mode | 3-way dropdown: 18 = Always Show, 2 = Show When Active, 8 = Don't Show (written to ByHost scope on Sequoia) | 18 (Always Show) |

### Security

| Setting | Description | Default |
|---------|-------------|---------|
| Require password after sleep | Ask for password after sleep or screen saver begins | on |
| No password delay | Require password immediately (no grace period) | on |

### Desktop & Stage Manager

| Setting | Description | Default |
|---------|-------------|---------|
| Click wallpaper to show desktop | `false` = only reveals desktop while Stage Manager is active (Sonoma+ default); `true` = always reveals desktop (pre-Sonoma) | off |
