---
title: Quick Start
description: Install OpenBoot via Homebrew or the one-line installer and set up your Mac in minutes.
group: Overview
order: 2
---

# Quick Start

## Installation

### One Command

```bash
curl -fsSL https://openboot.dev/install.sh | bash
```

It installs Xcode Command Line Tools and Homebrew if you don't have them, downloads OpenBoot, and launches the TUI. Everything in one go.

### Already Have Homebrew?

```bash
brew install openbootdotdev/tap/openboot
openboot
```

The interactive TUI opens and you pick what to install.

## First Run

After installing, just run:

```bash
openboot
```

The TUI opens with the `developer` preset selected. **Arrow keys** navigate, **Space** toggles packages, **Enter** confirms your selection. 

Homebrew starts installing everything. This takes 10-30 minutes depending on what you picked. After it finishes, restart your terminal or run:

```bash
source ~/.zshrc
```

Want a different preset? Pass it with `--preset`:

```bash
openboot --preset minimal  # Bare essentials
openboot --preset full     # Everything
```

See [Presets](/docs/presets) for what's in each one.

## Snapshot Your Current Setup

Already have a Mac configured the way you like? Capture it:

```bash
openboot snapshot
```

(Don't have OpenBoot installed yet? Run: `curl -fsSL https://openboot.dev/install.sh | bash -s -- snapshot`)

This scans your Homebrew packages, macOS preferences, shell config, and git settings. A TUI editor opens showing everything it found. Review it, remove anything you don't want to share, then upload or save locally.

After uploading, you get a shareable install command:

```bash
curl -fsSL openboot.dev/yourname/my-setup | bash
```

Anyone can run that and get your exact setup — no tools to install first. See [Snapshot](/docs/snapshot) for details.

## Share a Config with Your Team

Setting up a standard environment for your team:

1. Create a config on the [dashboard](/dashboard) — pick a preset, add/remove packages, add custom scripts if needed
2. Share the install command in your onboarding docs:

```bash
curl -fsSL openboot.dev/yourteam/frontend | bash
```

3. New hires run that and get your exact setup

See [For Teams](/docs/teams) for more.

## Next Steps

- [Presets](/docs/presets) — What's in `minimal`, `developer`, and `full`
- [Custom Configs](/docs/custom-configs) — Build and share your own
- [CLI Reference](/docs/cli-reference) — Full command list
