---
title: Quick Start
description: Install OpenBoot via Homebrew or the one-line installer and set up your Mac in minutes.
group: Overview
order: 2
---

# Quick Start

## Installation

### One command

```bash
curl -fsSL https://openboot.dev/install.sh | bash
```

Installs Xcode Command Line Tools and Homebrew if they're missing, downloads OpenBoot via Homebrew, and launches the TUI.

### Already have Homebrew?

```bash
brew install openbootdotdev/tap/openboot
openboot
```

The interactive TUI opens and you pick what to install.

## First run

```bash
openboot
```

The TUI opens with the `developer` preset selected. **Arrow keys** navigate, **Space** toggles packages, **Enter** confirms. Homebrew starts installing — usually 10–30 minutes depending on what you picked.

When it finishes, restart your terminal or run:

```bash
source ~/.zshrc
```

Want a different preset? Pass it with `-p`:

```bash
openboot install -p minimal  # CLI essentials only
openboot install -p full     # everything
```

See [Presets](/docs/presets) for what's in each one.

## Running again later

Just type `openboot`. If the machine is already synced to a config (or a preset), OpenBoot fetches the latest version, shows what's missing, and asks to apply it. Nothing gets uninstalled — `install` only adds.

```
→ Syncing with @alice/dev-setup (last synced 2 days ago)

+ visual-studio-code  (cask)
+ tableplus           (cask)

Apply 2 change(s) from @alice/dev-setup? [Y/n]
```

## Snapshot your current setup

Already have a Mac configured the way you like? Capture it:

```bash
openboot snapshot
```

Don't have OpenBoot installed yet? `curl -fsSL https://openboot.dev/install.sh | bash -s -- snapshot`.

This scans your Homebrew packages, macOS preferences, shell config (Oh-My-Zsh theme + plugins), and git identity. A TUI editor opens showing everything found. Review it, remove anything you don't want to share, then save locally or publish to openboot.dev.

Publishing gives you a one-line install command:

```bash
curl -fsSL openboot.dev/yourname/my-setup | bash
```

Anyone can run that to get your exact setup — no tools to install first. See [Snapshot](/docs/snapshot) for details.

## Share a config with your team

1. Create a config on the [dashboard](/dashboard) — pick a preset, add/remove packages, add a post-install script if needed
2. Share the install command in your onboarding docs:

```bash
curl -fsSL openboot.dev/yourteam/frontend | bash
```

3. New hires run that and get your exact setup

See [For Teams](/docs/teams) for more.

## Next steps

- [Presets](/docs/presets) — what's in `minimal`, `developer`, and `full`
- [Custom Configs](/docs/custom-configs) — build and share your own
- [CLI Commands](/docs/cli-reference) — the full command surface
