---
title: Environment Variables
description: All environment variables for the install script and CLI — version pinning, install directory, Git identity, and more.
group: Reference
order: 12
---

# Environment Variables

All environment variables that control the install script and the `openboot` CLI.

## Install Script Variables

These are used when running the `curl | bash` install command. The install script installs OpenBoot via Homebrew (`brew install openbootdotdev/tap/openboot`).

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENBOOT_VERSION` | Install a specific version instead of latest | Latest release |
| `OPENBOOT_DRY_RUN` | Set to `true` to preview without changes | — |

### Examples

Preview the install script without making changes:

```
OPENBOOT_DRY_RUN=true curl -fsSL https://openboot.dev/install.sh | bash
```

## CLI Variables

These are used by the `openboot` binary at runtime.

| Variable | Description |
|----------|-------------|
| `OPENBOOT_GIT_NAME` | Git user name — **only read in `--silent` mode** (required if Git isn't configured) |
| `OPENBOOT_GIT_EMAIL` | Git user email — **only read in `--silent` mode** (required if Git isn't configured) |
| `OPENBOOT_PRESET` | Default preset to use (overridden by `--preset` flag) |
| `OPENBOOT_USER` | Default remote config to use (overridden by `--user` flag) |
| `OPENBOOT_DOTFILES` | Dotfiles repository URL (overridden by config's `dotfiles_repo`) |
| `OPENBOOT_API_URL` | Override the API base URL (default: `https://openboot.dev`) |
| `OPENBOOT_DISABLE_AUTOUPDATE` | Set to `1` to disable auto-update checks |

### Examples

Silent install with Git identity:

```
OPENBOOT_GIT_NAME="Your Name" OPENBOOT_GIT_EMAIL="you@example.com" \
  openboot --preset developer --silent
```

Set a default preset so `openboot` always starts with it:

```
export OPENBOOT_PRESET=developer
openboot  # launches TUI with developer preset pre-selected
```

## File Locations

These aren't environment variables, but useful to know:

| Path | What's There |
|------|-------------|
| `~/.openboot/auth.json` | Auth token (after `openboot login` or snapshot upload) |
| `~/.openboot/snapshot.json` | Local snapshot (when using `--local`) |
| `~/.openboot/config.json` | Auto-update settings |
| `~/.openboot/install_state.json` | Tracks what was installed and when |
| `~/.openboot/state.json` | UI reminder state |
| `~/.openboot/update_state.json` | Auto-update check state |
| `~/.dotfiles/` | Cloned dotfiles repo (when configured) |
