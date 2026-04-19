---
title: Environment Variables
description: All environment variables the install script and openboot CLI understand.
group: Reference
order: 12
---

# Environment Variables

Every environment variable OpenBoot reads. Short list — v1.0 kept things minimal.

## Install script (`install.sh`)

Used when you run `curl -fsSL openboot.dev/install.sh | bash`. The script installs OpenBoot via Homebrew (`brew install openbootdotdev/tap/openboot`).

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENBOOT_VERSION` | Install a specific version instead of latest | `latest` |
| `OPENBOOT_DRY_RUN` | Set to `true` to preview without changes | — |

Preview the install script without making changes:

```
OPENBOOT_DRY_RUN=true curl -fsSL https://openboot.dev/install.sh | bash
```

## CLI (`openboot`)

Used by the `openboot` binary at runtime.

| Variable | Description |
|----------|-------------|
| `OPENBOOT_GIT_NAME` | Git user name — **read only in `--silent` mode** (required if Git isn't already configured) |
| `OPENBOOT_GIT_EMAIL` | Git user email — **read only in `--silent` mode** (required if Git isn't already configured) |
| `OPENBOOT_PRESET` | Default preset. Overridden by `-p` / `--preset` |
| `OPENBOOT_USER` | Default cloud config (alias or `user/slug`). Overridden by `-u` / `--user` |

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
| `~/.dotfiles/` | Cloned dotfiles repo (when configured) |
