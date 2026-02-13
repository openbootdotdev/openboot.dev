---
title: Quick Start
description: Install OpenBoot via Homebrew or the one-line installer and set up your Mac in minutes.
group: Overview
order: 2
---

# Quick Start

Pick the path that fits your situation.

## Installation

### Homebrew (Recommended)

If you already have Homebrew installed:

```bash
brew tap openbootdotdev/tap
brew install openboot
```

Then run `openboot` to start the interactive setup.

### One-Line Installer

If you don't have Homebrew yet, or prefer the all-in-one installer:

```bash
curl -fsSL https://openboot.dev/install.sh | bash
```

This installer will:
- Install Xcode Command Line Tools (if needed)
- Install Homebrew (if needed)
- Download and run OpenBoot

## New Mac? Bootstrap It

After installing OpenBoot using either method above, run:

```bash
openboot
```

What happens next:

```
🚀 Launching interactive installer...
```

The TUI opens with the `developer` preset pre-selected. Use **arrow keys** to navigate, **Space** to toggle packages, **Enter** to confirm. After installation, restart your terminal or run `source ~/.zshrc`.

Want a different starting point? Use `--preset`:

```bash
openboot --preset minimal
openboot --preset full
```

See [Presets](/docs/presets) for what's included in each.

## Already Set Up? Snapshot It

Capture your current Mac's dev environment and save it:

```bash
openboot snapshot
```

(Or if you haven't installed OpenBoot yet, use the one-line installer: `curl -fsSL https://openboot.dev/install.sh | bash -s -- snapshot`)

Snapshot scans your Homebrew packages, macOS preferences, shell config, and git settings. You'll review everything in a TUI editor before uploading or saving locally.

```
✓ Homebrew Formulae    28 found
✓ Homebrew Casks       12 found
✓ macOS Preferences     9 found
✓ Shell Environment     scanned
✓ Git Config            scanned
🎯 Launching editor...
```

After uploading, you get a shareable URL:

```
curl -fsSL https://openboot.dev/yourname/my-setup/install.sh | bash
```

See [Snapshot](/docs/snapshot) for the full walkthrough.

## Team Setup? Share a Config

If you're setting up a team's standard environment:

1. **Create a config** on the [dashboard](/dashboard) — pick a base preset, add/remove packages, set up custom scripts
2. **Share installation instructions** in your README or onboarding docs:

```bash
brew tap openbootdotdev/tap && brew install openboot
openboot --user yourteam/frontend
```

Or use the one-line installer as an alternative:

```bash
curl -fsSL https://openboot.dev/yourteam/frontend/install.sh | bash
```

3. **New team members** run the commands and get your exact setup

See [For Teams](/docs/teams) for the complete workflow.

## What's Next

- [Presets](/docs/presets) — See what's in `minimal`, `developer`, and `full`
- [Custom Configs](/docs/custom-configs) — Build and share your own setup
- [CLI Commands](/docs/cli-reference) — Full command reference
