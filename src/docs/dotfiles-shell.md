---
title: Dotfiles & Shell
description: Automatic Oh-My-Zsh setup, dotfiles linking via Makefile or GNU Stow, and developer-friendly macOS preferences.
group: Features
order: 6
---

# Dotfiles & Shell

OpenBoot configures your shell environment and can link your dotfiles — so your personal setup follows you to any Mac.

## Shell Configuration

OpenBoot sets up **Zsh** with **Oh-My-Zsh** automatically:

- **Plugins**: git, zsh-autosuggestions, zsh-syntax-highlighting
- **Theme**: A clean, informative prompt
- **Aliases**: Common shortcuts for developer workflows

External plugins referenced in `.zshrc` (such as `zsh-autosuggestions` and `zsh-syntax-highlighting`) are cloned automatically during install and snapshot restore — no manual `git clone` needed.

If you already have Oh-My-Zsh installed, OpenBoot merges its plugin recommendations without overwriting your existing config.

After installation, restart your terminal or run `source ~/.zshrc` to pick up the new configuration.

### Skipping Shell Setup

If you manage your shell config yourself:

```
openboot install --shell skip
```

## Dotfiles

If you keep your config files in a Git repo (`.zshrc`, `.gitconfig`, `.vimrc`, etc.), OpenBoot can clone and link them automatically.

### How It Works

1. Set a **dotfiles repo URL** in your config (via the dashboard or config JSON)
2. During install, OpenBoot clones the repo to `~/.dotfiles`
3. Files are symlinked into your home directory — OpenBoot detects the linking method automatically

### Linking Methods

OpenBoot tries three methods in order, using the first one that applies:

| Priority | Condition | What happens |
|----------|-----------|-------------|
| 1 | `Makefile` with an `install:` target | Runs `make install` in `~/.dotfiles` |
| 2 | Top-level subdirectories (stow packages) | Links each package with [GNU Stow](https://www.gnu.org/software/stow/) |
| 3 | Flat file structure | Symlinks files directly into `$HOME` |

This lets your dotfiles repo own its own deployment logic — directory pre-creation, custom stow flags, or any other setup — without requiring OpenBoot to know repo-specific details.

### Dotfiles Modes

Control how OpenBoot handles dotfiles with the `--dotfiles` flag:

| Mode | What it does |
|------|-------------|
| `clone` | Clone the repo to `~/.dotfiles` |
| `link` | Clone and link using the detected method above |
| `skip` | Don't touch dotfiles |

```
openboot install --dotfiles link
openboot install --dotfiles skip
```

### Setting Up Your Dotfiles Repo

**Option A — Makefile (recommended for custom setups)**

Add a `Makefile` with an `install:` target. OpenBoot runs `make install`, so your repo controls everything:

```makefile
install:
	stow -v --target="$(HOME)" git zsh vim
```

**Option B — Stow packages**

Structure your repo so each top-level directory is a stow package. OpenBoot calls `stow` on each one automatically:

```
~/.dotfiles/
├── git/
│   └── .gitconfig
├── zsh/
│   └── .zshrc
└── vim/
    └── .vimrc
```

Each top-level directory is a "package." When stowed, the contents are symlinked one level up — so `git/.gitconfig` becomes `~/.gitconfig`.

OpenBoot provides a [starter dotfiles template](https://github.com/openbootdotdev/dotfiles) you can fork and customize.

## macOS Preferences

OpenBoot applies a curated set of developer-friendly macOS settings. These are all reversible system preferences — nothing destructive.

### What Gets Configured

**System** — Show all file extensions, always-visible scrollbars, disable auto-correct/auto-capitalization, key repeat rate and delay

**Dock** — Auto-hide, icon size, show recent apps, minimize animation

**Finder** — View style, new window location, search scope, path/status bar, hidden files, file extensions, POSIX title, .DS_Store suppression, desktop icon visibility, and more

**Trackpad** — Tap to click (wired + Bluetooth), three-finger drag

**Keyboard** — Use F1–F12 as standard function keys

**Screenshots** — Save location, file format (PNG/JPEG/PDF/TIFF), disable window shadows

**Mission Control** — Auto-rearrange Spaces, group windows by app, hot corners (all four)

**Menu Bar** — Per-icon visibility (Sound, Bluetooth, Wi-Fi, Battery, AirDrop, Display, Focus, Now Playing, Screen Mirroring); Sound always-show mode

**Security** — Require password after sleep, no grace period delay

**Desktop & Stage Manager** — Click wallpaper to show desktop (Stage Manager interaction mode)

### Skipping macOS Preferences

If you prefer your current settings:

```
openboot install --macos skip
```

See [Config Options](/docs/config-options) for the complete list of macOS preferences you can configure.
