---
title: Quick Start
group: Overview
order: 2
---

# Quick Start

Pick the path that fits your situation.

## New Mac? Bootstrap It

Open Terminal and run:

```
curl -fsSL https://openboot.dev/install.sh | bash
```

What happens next:

```
✓ Downloaded OpenBoot v0.4.0
✓ Xcode Command Line Tools ready
✓ Homebrew ready
🚀 Launching interactive installer...
```

The TUI opens with the `developer` preset pre-selected. Use **arrow keys** to navigate, **Space** to toggle packages, **Enter** to confirm. After installation, restart your terminal or run `source ~/.zshrc`.

Want a different starting point? Use `--preset`:

```
curl -fsSL https://openboot.dev/install.sh | bash -s -- --preset minimal
curl -fsSL https://openboot.dev/install.sh | bash -s -- --preset full
```

See [Presets](/docs/presets) for what's included in each.

## Already Set Up? Snapshot It

Capture your current Mac's dev environment and save it:

```
curl -fsSL https://openboot.dev/install.sh | bash -s -- snapshot
```

Or if `openboot` is already installed:

```
openboot snapshot
```

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
2. **Share the install URL** in your README or onboarding docs:

```
curl -fsSL https://openboot.dev/yourteam/frontend/install.sh | bash
```

3. **New team members** run one command and get your exact setup

See [For Teams](/docs/teams) for the complete workflow.

## What's Next

- [Presets](/docs/presets) — See what's in `minimal`, `developer`, and `full`
- [Custom Configs](/docs/custom-configs) — Build and share your own setup
- [CLI Commands](/docs/cli-reference) — Full command reference
