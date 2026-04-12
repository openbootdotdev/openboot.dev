---
title: CLI Commands
description: Complete reference for all openboot commands — install, snapshot, sync, push, pull, log, restore, list, edit, login, doctor, update, and their flags.
group: Reference
order: 9
---

# CLI Commands

All commands for the `openboot` CLI, organized by what you're trying to do.

## Set Up an Environment

### `openboot`

Launch the interactive TUI installer. Browse packages, toggle what you want, and install.

```
openboot
```

### `openboot --preset <name>`

Start with a preset's packages pre-selected. Available: `minimal`, `developer`, `full`.

```
openboot --preset developer
```

You can still customize in the TUI. To skip the TUI entirely, add `--silent`.

### `openboot install <alias>` or `openboot install <username>/<slug>`

Install from a config hosted on openboot.dev.

If you set an alias for your config in the dashboard, use it directly:

```
openboot install myalias
```

Or use the full username/slug format:

```
openboot install sarah/frontend-team
```

**Resolution order** for a single word (no `/`):
1. Try as a config alias (set in the dashboard)
2. Fall back to `username/default` config

Alternatively, use the `--user` flag: `openboot --user myalias` (same effect).

For private configs, run `openboot login` first — the CLI sends your auth token automatically.

### Install Flags

| Flag | Description |
|------|-------------|
| `-p, --preset <name>` | Use a preset: `minimal`, `developer`, `full` |
| `-u, --user <alias or username/slug>` | Install from a config hosted on openboot.dev |
| `-s, --silent` | Non-interactive mode — no TUI, no prompts |
| `--dry-run` | Preview what would be installed without installing |
| `--packages-only` | Install packages only, skip shell/macOS/dotfiles config |
| `--shell <mode>` | `install` or `skip` |
| `--macos <mode>` | `configure` or `skip` |
| `--dotfiles <mode>` | `clone`, `link`, or `skip` |
| `--post-install <mode>` | `skip` to skip post-install scripts |
| `--update` | Update Homebrew before installing |

## Set Up a Project Environment

### `openboot init`

Read `.openboot.yml` from the current directory and install the declared dependencies, run initialization scripts, and verify the environment is ready.

```
openboot init
```

### `openboot init <directory>`

Run init against a specific project directory instead of the current one.

```
openboot init /path/to/project
```

### Init Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview what would be installed and run, without making any changes |
| `-s, --silent` | Non-interactive mode — skip confirmation prompts (for CI/CD) |
| `--update` | Update Homebrew before installing packages |

See [`.openboot.yml` Reference](/docs/openboot-yml) for the full config schema.

---

## Capture Your Environment

### `openboot snapshot`

Scan your Mac's current setup — packages, preferences, shell config, git settings — and upload or save it.

```
openboot snapshot
```

### `openboot snapshot --local`

Save the snapshot to `~/.openboot/snapshot.json` instead of uploading.

```
openboot snapshot --local
```

### `openboot snapshot --json`

Output the snapshot as JSON to stdout. Useful for piping to `jq` or other tools.

```
openboot snapshot --json
openboot snapshot --json | jq '.packages.formulae'
```

### `openboot snapshot --import <path>`

Restore a full environment from a snapshot file or URL. Installs packages, applies git identity, shell config (Oh-My-Zsh theme and plugins), and macOS preferences.

```
openboot snapshot --import my-setup.json
openboot snapshot --import https://example.com/snapshot.json
openboot snapshot --import my-setup.json --dry-run
```

A review editor appears before any changes are made, letting you deselect items you don't want.

### Snapshot Flags

| Flag | Description |
|------|-------------|
| `--local` | Save to `~/.openboot/snapshot.json` |
| `--json` | Output as JSON to stdout |
| `--dry-run` | Preview without saving, uploading, or installing |
| `--import <path>` | Restore from a local file or URL |

---

## Manage Your Remote Config

These commands work with configs stored on openboot.dev. They follow a git-style mental model: `push` saves your state, `pull` applies the remote to your system, `log` shows history, `restore` rolls back.

### `openboot push`

Capture your current system state and upload it to openboot.dev. If a sync source is configured (from a previous `openboot install`), it updates that config silently. Otherwise, an interactive picker lets you choose an existing config to update or create a new one.

```
openboot push
```

Attach a message to the revision (shown in `openboot log`):

```
openboot push -m "before upgrading to Node 22"
```

Target a specific config by slug:

```
openboot push --slug my-config
```

#### Push Flags

| Flag | Description |
|------|-------------|
| `--slug <slug>` | Push to a specific existing config |
| `-m, --message <text>` | Revision message saved in history |

---

### `openboot pull`

Fetch the latest version of your remote config and apply it to your local system. Equivalent to `git pull` — syncs the remote state down to your machine.

```
openboot pull
```

#### Pull Flags

| Flag | Description |
|------|-------------|
| `--slug <slug>` | Pull from a specific config |
| `--dry-run` | Preview changes without applying them |
| `-y, --yes` | Auto-confirm all prompts |

---

### `openboot sync`

Fetch the remote config and show what differs from your local system, then let you selectively apply changes. More granular than `pull` — you choose which packages to install or remove.

```
openboot sync
```

```
openboot sync --yes        # apply all changes without prompting
openboot sync --dry-run    # preview only
```

#### Sync Flags

| Flag | Description |
|------|-------------|
| `--source <username/slug>` | Sync from a specific config |
| `--dry-run` | Preview without applying |
| `-y, --yes` | Auto-confirm all changes |
| `--install-only` | Only install missing packages, never remove extras |

---

### `openboot diff`

Show what differs between your local system and your remote config, without applying any changes.

```
openboot diff
```

---

### `openboot list`

Show all configs in your openboot.dev account. The config currently linked to this machine is marked with `→`.

```
openboot list
```

```
=== Configs for fullstackjam ===

→ jam-s-packages  Jam's packages  [public]
  work-mac        Work Machine
  minimal

Install: openboot -u fullstackjam/<slug>  •  Edit: openboot edit --slug <slug>  •  Delete: openboot delete <slug>
```

---

### `openboot edit`

Pick a config from your account and open it in the browser for editing. Shows an interactive list of your configs — select one to open the edit page on openboot.dev.

```
openboot edit
```

Skip the picker and open a specific config directly:

```
openboot edit --slug my-config
```

#### Edit Flags

| Flag | Description |
|------|-------------|
| `--slug <slug>` | Open a specific config (skips the picker) |

---

### `openboot log`

Show the revision history for your config. Every `push` automatically saves the previous version as a revision.

```
openboot log
```

```
=== Revision history: jam-s-packages ===

  rev_abc123  2026-04-10 14:32  26 pkgs  before upgrading to Node 22
  rev_def456  2026-04-08 09:15  24 pkgs
  rev_ghi789  2026-04-01 11:00  20 pkgs

Use 'openboot restore <revision-id>' to roll back to a previous state.
```

Up to 10 revisions are kept per config. Oldest are pruned automatically.

#### Log Flags

| Flag | Description |
|------|-------------|
| `--slug <slug>` | Show history for a specific config |

---

### `openboot restore <revision-id>`

Roll back your config to a previous revision. The current config is automatically saved as a new revision first (so you can always undo). After updating the server config, the changes are applied to your local system via sync.

```
openboot restore rev_abc123
```

Preview what would change without applying:

```
openboot restore rev_abc123 --dry-run
```

Get revision IDs from `openboot log`.

#### Restore Flags

| Flag | Description |
|------|-------------|
| `--slug <slug>` | Restore a specific config |
| `--dry-run` | Preview changes without applying them |
| `-y, --yes` | Auto-confirm all prompts |

---

### `openboot delete <slug>`

Delete a config from your openboot.dev account.

```
openboot delete my-config
```

Skip the confirmation prompt:

```
openboot delete my-config --force
```

#### Delete Flags

| Flag | Description |
|------|-------------|
| `-f, --force` | Skip the confirmation prompt |

---

## Authentication

### `openboot login`

Authenticate with openboot.dev via browser. Required for installing private configs and uploading snapshots.

```
openboot login
```

Opens your browser to approve the login. After approval, a token is saved at `~/.openboot/auth.json`.

### `openboot logout`

Remove the stored authentication token from this machine.

```
openboot logout
```

## Clean Your Environment

### `openboot clean`

Compare your current system against a config or snapshot and remove packages not in it.

```
openboot clean
```

By default, compares against `~/.openboot/snapshot.json`. Use `--from` or `--user` to compare against a different source.

```
openboot clean --dry-run
openboot clean --user sarah/frontend-team
openboot clean --from my-setup.json
```

**What it removes**: Homebrew formulae, casks, and npm global packages that aren't in your target config or snapshot. Taps are only diffed when the target includes at least one tap; npm is only checked if npm is available on the system.

### Clean Flags

| Flag | Description |
|------|-------------|
| `--from <file>` | Compare against a local snapshot file |
| `--user <username/slug>` | Compare against a config hosted on openboot.dev |
| `--dry-run` | Preview what would be removed without removing anything |

**Sources checked in order**: `--from` → `--user` → local snapshot (`~/.openboot/snapshot.json`).

---

## Maintain Your Environment

### `openboot doctor`

Run diagnostic checks — network, disk space, Homebrew health, Git config, shell setup.

```
openboot doctor
```

```
✓ Network connectivity
✓ Disk space (48 GB free)
✓ Homebrew installed
✓ Homebrew health
✓ Outdated packages (5 updates available)
✓ Git installed
✓ Git identity
✓ Oh-My-Zsh installed
✓ .zshrc exists

Suggested fixes:
  Run 'openboot update' to upgrade outdated packages

All checks passed! Your environment is healthy.
```

### `openboot update`

Update Homebrew and upgrade all installed packages.

```
openboot update
openboot update --dry-run
```

### `openboot update --self`

Update the OpenBoot binary to the latest version.

```
openboot update --self
```

### Update Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview what packages would be updated without upgrading |
| `--self` | Update the OpenBoot binary itself to the latest version |

### `openboot version`

Print the current OpenBoot version.

```
openboot version
```

---

See also: [Config Options](/docs/config-options) for the full config schema, and [Environment Variables](/docs/env-vars) for all env vars that control the install script and CLI.
