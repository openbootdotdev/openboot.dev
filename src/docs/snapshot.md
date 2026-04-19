---
title: Snapshot
description: Capture your Mac's packages, preferences, and shell config, then share it as a one-line install URL.
group: Features
order: 4
---

# Snapshot

Capture your current Mac's dev environment and turn it into a shareable config — without building anything from scratch.

```
openboot snapshot
```

Don't have `openboot` yet? Run the installer with the `snapshot` subcommand:

```
curl -fsSL https://openboot.dev/install.sh | bash -s -- snapshot
```

## What it captures

| Category | What's scanned | How |
|----------|----------------|-----|
| **Homebrew formulae** | Top-level CLI tools (not dependencies) | `brew leaves` |
| **Homebrew casks** | Installed GUI apps | `brew list --cask` |
| **Homebrew taps** | Third-party repositories | `brew tap` |
| **NPM globals** | Globally installed npm packages | `npm list -g` |
| **macOS preferences** | Whitelisted developer settings | Curated list |
| **Shell config** | Oh-My-Zsh theme and plugins | `.zshrc` parsing |
| **Git config** | user.name, user.email, editor, default branch | `~/.gitconfig` |
| **Dev tools** | Go, Node, Python, Rust, Java, Ruby, Docker | Version detection |

> Only whitelisted data is captured. No SSH keys, API tokens, `.env` files, or credentials — ever.

## How it works

**1. Scan.** OpenBoot scans your system with real-time progress:

```
✓ Homebrew Formulae    28 found
✓ Homebrew Casks       12 found
✓ macOS Preferences     9 found
✓ Shell Environment     scanned
✓ Git Config            scanned
```

**2. Review (TTY only).** A full-screen TUI editor lets you customize what's included:

- Tabs: Formulae, Casks, NPM Packages, macOS Preferences
- **Space** to toggle items on/off
- **`/`** to search, **`a`** to select all in a category
- Taps, Shell, Git, and Dev Tools are shown as read-only

**3. Choose a destination.** Either via flag or the interactive menu.

## Destinations

Flags decide where the snapshot goes. Without flags, behavior depends on whether stdout is a TTY.

| Command | Result |
|---------|--------|
| `openboot snapshot` (TTY) | Interactive editor, then a menu to save locally / publish / both |
| `openboot snapshot` (piped) | JSON to stdout |
| `openboot snapshot --local` | Save to `~/.openboot/snapshot.json` |
| `openboot snapshot --publish` | Upload to openboot.dev |
| `openboot snapshot --local --publish` | Save **and** upload |
| `openboot snapshot --json` | JSON to stdout (explicit) |

### Piping

Since a piped stdout auto-switches to JSON, you can script around snapshots without extra flags:

```
openboot snapshot | jq '.packages.formulae'
openboot snapshot > my-setup.json
```

### Publishing

`--publish` uploads directly, no interactive menu:

```
openboot snapshot --publish
```

- If the machine is already synced to a config (from a previous install), `--publish` updates that config in place — no prompts for name/description/visibility.
- Otherwise you're asked for a name and visibility, then a new config is created.

Target an existing config by slug:

```
openboot snapshot --publish --slug my-config
```

After upload, you get a one-line install command:

```
curl -fsSL openboot.dev/yourname/my-setup | bash
```

## Restoring from a snapshot

Use `--import` to apply a snapshot to the current Mac:

```
openboot snapshot --import ~/.openboot/snapshot.json
openboot snapshot --import https://example.com/snapshot.json
openboot snapshot --import my-setup.json --dry-run
```

Before installing, a review editor lets you deselect anything you don't want. If the snapshot is partial (some capture steps failed), you'll be warned.

| Category | What's applied |
|----------|----------------|
| Homebrew formulae | `brew install` |
| Homebrew casks | `brew install --cask` |
| Homebrew taps | `brew tap` |
| NPM globals | `npm install -g` |
| Git config | `git config --global` for name/email — skipped if both are already set |
| Shell config | Oh-My-Zsh theme and plugins written to `.zshrc` — only if Oh-My-Zsh was captured |
| macOS preferences | `defaults write` for each captured preference |

## Flags

| Flag | What it does |
|------|-------------|
| `--local` | Save to `~/.openboot/snapshot.json` |
| `--publish` | Upload to openboot.dev |
| `--slug <slug>` | Target an existing config by slug (with `--publish`) |
| `--json` | Output JSON to stdout |
| `--dry-run` | Preview without saving, uploading, or installing |
| `--import <path>` | Restore from a local file or URL |

## Privacy & safety

Snapshots are designed to be safe to share:

- **Paths sanitized** — home directory references replaced with `~/`
- **Whitelisted preferences only** — no arbitrary system data is read
- **No secrets captured** — SSH keys, tokens, credentials never included
- **Full control** — you review and deselect anything before uploading

See [Config Options](/docs/config-options) for the full list of macOS preferences that can be captured.
