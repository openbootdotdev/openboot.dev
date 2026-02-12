---
title: Snapshot
group: Features
order: 4
---

# Snapshot

Capture your current Mac's dev environment and turn it into a shareable config — without building anything from scratch.

```
openboot snapshot
```

Or if you don't have `openboot` yet:

```
curl -fsSL https://openboot.dev/install.sh | bash -s -- snapshot
```

## What It Captures

| Category | What's Scanned | How |
|----------|---------------|-----|
| **Homebrew Formulae** | Top-level CLI tools (not dependencies) | `brew leaves` |
| **Homebrew Casks** | All installed GUI apps | `brew list --cask` |
| **Homebrew Taps** | Third-party repositories | `brew tap` |
| **NPM Global Packages** | Globally installed npm packages | `npm list -g` |
| **macOS Preferences** | 23 whitelisted developer settings | Curated list |
| **Shell Config** | Oh-My-Zsh plugins, theme, aliases | `.zshrc` parsing |
| **Git Config** | user.name, user.email, editor, default branch | `~/.gitconfig` |
| **Dev Tools** | Go, Node.js, Python, Rust, Java, Ruby, Docker | Version detection |

> Only whitelisted data is captured. No SSH keys, API tokens, `.env` files, or credentials — ever.

## How It Works

**Step 1 — Scan.** OpenBoot scans your system with real-time progress:

```
✓ Homebrew Formulae    28 found
✓ Homebrew Casks       12 found
✓ macOS Preferences     9 found
✓ Shell Environment     scanned
✓ Git Config            scanned
```

**Step 2 — Review.** A full-screen TUI editor lets you customize what's included:

- **Tabs**: Formulae, Casks, NPM Packages, macOS Preferences
- **Space** to toggle individual items on/off
- **`/`** to search, **`a`** to select all in a category
- Taps, Shell, Git, and Dev Tools are shown as a read-only summary

**Step 3 — Save.** Choose where it goes:

- **Upload to openboot.dev** — get a shareable install URL
- **Save locally** — stored at `~/.openboot/snapshot.json`

If you upload, you'll authenticate via browser (like `gh auth login`), name your config, and get a one-line install command:

```
curl -fsSL https://openboot.dev/yourname/my-setup/install.sh | bash
```

## Flags

| Flag | What it does |
|------|-------------|
| `--dry-run` | Preview what would be captured, without saving or uploading |
| `--json` | Output snapshot as JSON to stdout — great for piping to `jq` |
| `--local` | Save to `~/.openboot/snapshot.json` instead of uploading |
| `--import <path>` | Restore from a local file or URL |

## Privacy & Safety

Snapshots are designed to be safe to share:

- **Paths sanitized** — home directory references replaced with `~/`
- **Whitelisted preferences only** — no arbitrary system data is read
- **No secrets captured** — SSH keys, tokens, credentials are never included
- **Full control** — you review and deselect anything before uploading

See [Config Options](/docs/config-options) for the full list of macOS preferences that can be captured.
