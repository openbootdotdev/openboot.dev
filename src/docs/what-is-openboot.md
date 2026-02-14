---
title: What is OpenBoot
description: Open-source CLI that sets up your entire macOS dev environment — packages, apps, shell, dotfiles, and preferences — in one command.
group: Overview
order: 1
---

# What is OpenBoot

Fresh Mac? Run one command and get everything installed—Git, Node, Docker, your shell config, dotfiles, macOS preferences. Then snapshot that setup and share it with your team.

OpenBoot is an open-source CLI that automates the boring part of setting up a new Mac. It installs Homebrew packages, GUI apps, configures your shell, links dotfiles, and applies developer-friendly macOS settings. All in one run.

## What It Does

**Packages & Apps** — Installs CLI tools (`node`, `go`, `docker`, `ripgrep`) and GUI apps (`VS Code`, `Chrome`, `Warp`) from Homebrew. Pick from presets or toggle individual packages in the TUI.

**Shell Configuration** — Sets up Oh-My-Zsh with plugins, a clean theme, and developer aliases. If you already have Oh-My-Zsh, it merges settings without overwriting your config.

**Dotfiles** — Clones your dotfiles repo and links it with GNU Stow. Your `.zshrc`, `.gitconfig`, and other configs follow you to any machine.

**macOS Preferences** — Applies developer-friendly settings: fast key repeat, Finder path bar visible, Dock auto-hide, screenshots saved as PNG, etc.

**Snapshot** — Run `openboot snapshot` to capture your current setup. Upload it to openboot.dev and share as a one-line install URL, or save locally as JSON.

## Installation

**Via Homebrew (recommended):**

```bash
brew tap openbootdotdev/tap
brew install openboot
openboot
```

**Or use the one-liner:**

```bash
curl -fsSL https://openboot.dev/install.sh | bash
```

The one-liner installs Xcode Command Line Tools and Homebrew if you don't have them yet, downloads the `openboot` binary, and launches the TUI. From there:

1. Pick a preset (`minimal`, `developer`, `full`) or customize package by package
2. Confirm and wait for Homebrew to install everything
3. Shell gets configured, dotfiles get linked (if you provided a repo URL), macOS preferences get applied
4. Restart your terminal and you're done

Already have a Mac set up the way you like? Run `openboot snapshot` to capture it and share the config.

## Three Ways to Use It

**Start from a preset** — Pick `minimal`, `developer`, or `full` in the TUI. Each one's a curated package list you can tweak before installing. See [Presets](/docs/presets) for what's in each.

**Create a custom config** — Build your own setup on the [dashboard](/dashboard). Share it as a one-line install URL with your team. See [Custom Configs](/docs/custom-configs).

**Snapshot your current Mac** — Run `openboot snapshot` to scan what's installed. Upload to openboot.dev or save locally as JSON. See [Snapshot](/docs/snapshot) for details.

## System Requirements

- **macOS 12 (Monterey)** or later
- **Apple Silicon** and **Intel** Macs supported
- Internet connection
- Admin privileges (you'll be prompted when needed)
