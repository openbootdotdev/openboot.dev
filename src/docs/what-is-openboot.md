---
title: What is OpenBoot
group: Overview
order: 1
---

# What is OpenBoot

One command. Your Mac is ready to code.

OpenBoot is an open-source CLI that sets up your entire macOS development environment — Homebrew packages, GUI apps, shell config, dotfiles, and macOS preferences — in minutes instead of hours.

## What You Get

- **Packages & Apps** — Install CLI tools (`node`, `go`, `docker`, `ripgrep`...) and GUI apps (`VS Code`, `Chrome`, `Warp`...) from Homebrew, all at once
- **Shell Configuration** — Oh-My-Zsh with plugins, a clean theme, and useful aliases, configured automatically
- **Dotfiles** — Clone and link your dotfiles repo so your personal config follows you to any machine
- **macOS Preferences** — Developer-friendly system settings (fast key repeat, Finder path bar, Dock autohide...) applied in one pass
- **Snapshot** — Capture your current Mac's setup and turn it into a shareable config URL

## How It Works

```
curl -fsSL https://openboot.dev/install.sh | bash
```

This one command:

1. Downloads the `openboot` binary
2. Installs Xcode Command Line Tools and Homebrew (if needed)
3. Launches an interactive TUI where you pick your packages
4. Installs everything, configures your shell, and applies macOS preferences

Already have your Mac set up? Run `openboot snapshot` to capture what you have and share it.

## Three Ways to Use It

**Start from a preset** — Choose `minimal`, `developer`, or `full`. Each is a curated package set you can customize in the TUI before installing. [Learn more](/docs/presets)

**Create a custom config** — Build your own setup on the dashboard, then share it as a one-line install URL. Great for teams. [Learn more](/docs/custom-configs)

**Snapshot your existing Mac** — Scan your installed packages, shell config, and preferences. Upload to openboot.dev or save locally. [Learn more](/docs/snapshot)

## System Requirements

- **macOS 12 (Monterey)** or later
- **Apple Silicon** and **Intel** Macs supported
- Internet connection
- Admin privileges (you'll be prompted when needed)
