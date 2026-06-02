---
title: CLI Commands
description: Complete reference for the openboot CLI — install, snapshot, login, and their flags.
group: Reference
order: 9
---

# CLI Commands

OpenBoot v1.0 has two real verbs: **`install`** adds things to your Mac, **`snapshot`** captures what's on it. Everything else is auth or bookkeeping.

```
openboot install [source] # install from preset, file, or cloud config
openboot snapshot         # capture your environment
openboot doctor           # check system health and diagnose issues
openboot login / logout   # openboot.dev auth
openboot version          # print version
```

> **v1.0 removed these commands:** `pull`, `push`, `diff`, `clean`, `log`, `restore`, `init`, `setup-agent`, `update`, `list`, `edit`, `delete`. OpenBoot no longer uninstalls packages or tracks revision history — `install` is add-only, and `snapshot --publish` overwrites. Manage configs on the [dashboard](/dashboard). See the project [CHANGELOG](https://github.com/openbootdotdev/openboot/blob/main/CHANGELOG.md) for migration.

## `openboot install`

Install and configure your Mac.

```
openboot install [source]
```

**Behavior with no `[source]` and no flags:**

- If this machine has a saved sync source (from a previous install), resume it. OpenBoot fetches the config, shows a diff of what's missing, and asks to apply it.
- Otherwise, the interactive TUI opens.

The sync-source header looks like:

```
→ Syncing with @alice/dev-setup (last synced 2 days ago)
```

If the last sync was more than 90 days ago, the header turns yellow as a warning.

### Source resolution

The positional `[source]` argument is identified by pattern:

| Input | Resolves to |
|-------|-------------|
| `./path`, `/path`, `../path`, or `*.json` | Local file |
| `user/slug` | openboot.dev cloud config |
| `minimal`, `developer`, `full` | Built-in preset |
| Any other word | openboot.dev alias |

Examples:

```
openboot install                   # resume last sync (or interactive)
openboot install alice/dev-setup   # cloud config by user/slug
openboot install ./backup.json     # local config or snapshot file
openboot install developer         # built-in preset
openboot install myalias           # alias configured on the dashboard
openboot install --dry-run         # preview without installing
openboot install alice/dev-setup --pick node,ripgrep   # install only named packages
openboot install alice/dev-setup --dry-run             # list available package names
```

Explicit flags (`--from`, `--user`/`-u`, `-p`/`--preset`) always override the positional argument.

For private configs, run `openboot login` first.

### Install flags

| Flag | Description |
|------|-------------|
| `-p, --preset <name>` | Use a preset: `minimal`, `developer`, `full` |
| `-u, --user <alias or user/slug>` | Install from an openboot.dev config |
| `--from <file>` | Install from a local config or snapshot JSON |
| `-s, --silent` | Non-interactive mode (for CI/automation) |
| `--dry-run` | Preview without installing |
| `--pick <names>` | Comma-separated list of package names to install from a remote config (e.g. `--pick node,ripgrep`). Fails if any name is unknown. Use `--dry-run` to list available names. |
| `--packages-only` | Skip shell, macOS, dotfiles, post-install |
| `--shell <mode>` | `install` or `skip` |
| `--macos <mode>` | `configure` or `skip` |
| `--dotfiles <mode>` | `clone`, `link`, or `skip` |
| `--post-install <mode>` | `skip` to skip post-install scripts |
| `--allow-post-install` | Allow post-install scripts in silent mode |
| `--update` | Update Homebrew before installing |
| `--verbose` | Debug logging to stderr |

`install` is **add-only**. It never uninstalls packages or removes settings — if a package is in your local system but not in the config, it stays. To remove packages, run `brew uninstall` directly.

---

## `openboot snapshot`

Capture your Mac's Homebrew packages, npm globals, macOS preferences, shell config (Oh-My-Zsh theme + plugins), git identity, and dev tool versions.

```
openboot snapshot
```

### Destination by flag or context

```
openboot snapshot              # TTY: interactive menu. Pipe: JSON to stdout.
openboot snapshot --local      # save to ~/.openboot/snapshot.json
openboot snapshot --publish    # upload to openboot.dev
openboot snapshot --json       # JSON to stdout
```

Flags combine — `openboot snapshot --local --publish` saves locally **and** uploads.

When stdout is not a terminal (e.g. piped), `snapshot` emits JSON automatically:

```
openboot snapshot | jq '.packages.formulae'
openboot snapshot > my-setup.json
```

### Publishing

```
openboot snapshot --publish
```

- If this machine is already synced to a config, `--publish` updates that config in place (no prompts for name/description/visibility).
- Otherwise you're asked to name the config and pick visibility, then it's created.

Target a specific existing config by slug:

```
openboot snapshot --publish --slug my-config
```

### Restoring from a snapshot

```
openboot snapshot --import my-setup.json
openboot snapshot --import https://example.com/snapshot.json
openboot snapshot --import my-setup.json --dry-run
```

A review editor appears before any changes are made, so you can deselect items. What gets applied:

| Category | How |
|----------|-----|
| Homebrew formulae | `brew install` |
| Homebrew casks | `brew install --cask` |
| Homebrew taps | `brew tap` |
| NPM globals | `npm install -g` |
| Git config | `git config --global` (skipped if already set) |
| Shell config | Oh-My-Zsh theme and plugins written to `.zshrc` |
| macOS preferences | `defaults write` per captured preference |

### Snapshot flags

| Flag | Description |
|------|-------------|
| `--local` | Save to `~/.openboot/snapshot.json` |
| `--publish` | Upload to openboot.dev |
| `--slug <slug>` | Target an existing config by slug (with `--publish`) |
| `--json` | Output JSON to stdout |
| `--dry-run` | Preview without saving, uploading, or installing |
| `--import <path>` | Restore from a local file or URL |

---

## Authentication

### `openboot login`

Authenticate with openboot.dev through your browser. Required to install private configs and to publish snapshots.

```
openboot login
```

The token is saved at `~/.openboot/auth.json`.

### `openboot logout`

Remove the stored authentication token from this machine.

```
openboot logout
```

---

## `openboot version`

Print the OpenBoot version.

```
openboot version
```

---

## `openboot doctor`

Run read-only diagnostic checks on your development environment and get a pass/warn/fail summary.

```
openboot doctor
```

Checks performed:

| Check | What it verifies |
|-------|-----------------|
| Homebrew | Installed and on PATH |
| Homebrew outdated | Reports count of outdated packages |
| Git | Installed; user.name and user.email configured |
| Node.js | Installed and reachable |
| npm | Installed and reachable |
| Shell | Default shell is zsh |
| Oh-My-Zsh | Installed at `~/.oh-my-zsh` |
| Brew shellenv | `~/.zshrc` sources `brew shellenv` (Apple Silicon only) |
| OpenBoot dir | `~/.openboot/` exists |
| OpenBoot state | `install_state.json` is valid JSON |
| PATH | `/usr/local/bin` and/or Homebrew prefix on PATH |

All checks are read-only — `doctor` never modifies your system.

---

## Upgrading OpenBoot

OpenBoot no longer has a self-update command. It's installed via Homebrew — use Homebrew to upgrade:

```
brew upgrade openboot
```

OpenBoot also does a lightweight auto-update check when you run `install`.

---

## Removing packages

OpenBoot doesn't uninstall — by design. To remove a package, run Homebrew directly:

```
brew uninstall <package>
brew autoremove          # prune orphaned dependencies
```

For a history of what was installed on this machine, see `~/.openboot/install_state.json`.

---

See also: [Config Options](/docs/config-options) for the config schema, [Environment Variables](/docs/env-vars) for env vars, and the project [CHANGELOG](https://github.com/openbootdotdev/openboot/blob/main/CHANGELOG.md) for the full v1.0 migration.
