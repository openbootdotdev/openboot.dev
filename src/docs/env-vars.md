---
title: Environment Variables
description: Environment settings for the install script and openboot CLI.
group: Reference
order: 12
---

# Environment Variables

Environment settings for the install script and CLI.

## Install script (`install.sh`)

Used when you run `curl -fsSL openboot.dev/install.sh | bash`. The script installs OpenBoot via Homebrew (`brew install openbootdotdev/tap/openboot`).

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENBOOT_DRY_RUN` | Set to `true` to preview without changes | — |

The script always installs the latest release published in the tap; there is no version pin.

Preview the install script without making changes:

```
curl -fsSL https://openboot.dev/install.sh | OPENBOOT_DRY_RUN=true bash
```

## CLI (`openboot`)

Used by the `openboot` binary at runtime.

| Variable | Description |
|----------|-------------|
| `OPENBOOT_GIT_NAME` | Git user name — **read only in `--silent` mode** (required if Git isn't already configured) |
| `OPENBOOT_GIT_EMAIL` | Git user email — **read only in `--silent` mode** (required if Git isn't already configured) |
| `OPENBOOT_PRESET` | Default preset. Overridden by `-p` / `--preset` |
| `OPENBOOT_USER` | Default cloud config (alias or `user/slug`). Overridden by `-u` / `--user` |
| `OPENBOOT_DOTFILES` | Dotfiles repo URL for preset-based installs. Remote configs and snapshots use their own dotfiles settings; this does not override a remote config's `dotfiles_repo` |
| `OPENBOOT_DISABLE_AUTOUPDATE` | Set to `1` to skip the auto-update check that runs before `install` |
| `OPENBOOT_API_URL` | Override the openboot.dev API base URL — testing only; must be `https://` or `http://localhost` |

Silent install with Git identity:

```
OPENBOOT_GIT_NAME="Your Name" OPENBOOT_GIT_EMAIL="you@example.com" \
  openboot install --preset developer --silent
```

Set a default preset so `openboot install` always starts with it:

```
export OPENBOOT_PRESET=developer
openboot install  # TUI opens with developer preset pre-selected
```

## File locations

Not environment variables, but useful to know.

| Path | What's there |
|------|-------------|
| `~/.openboot/auth.json` | Auth token (after `openboot login` or publishing a snapshot) |
| `~/.openboot/snapshot.json` | Local snapshot (when using `--local`) |
| `~/.openboot/install_state.json` | What was installed on this machine, and when |
| `~/.openboot/sync_source.json` | The cloud config this machine is synced to |
| `~/.openboot/config.json` | Update preference: `"autoupdate": "notify"` (default), `"true"` (automatic upgrades), or `"false"` (no checks) |
| `~/.dotfiles/` | Cloned dotfiles repo (when configured) |
