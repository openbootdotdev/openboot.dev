# CLI Reference

The `openboot` command-line tool handles installation, environment capture, diagnostics, and updates.

## Installation Commands

### `openboot`

Run with no arguments to launch the interactive TUI installer. This is the default experience — you'll see a full-screen terminal interface where you can browse and select packages.

```
openboot
```

The TUI starts with the `developer` preset pre-selected. Use arrow keys to navigate, Space to toggle packages, and Enter to confirm.

### `openboot --preset <name>`

Launch the TUI with a preset's packages pre-selected. Available presets: `minimal`, `developer`, `full`.

```
openboot --preset developer
```

You can still toggle individual packages on or off before confirming. To skip the TUI entirely, combine with `--silent`.

### `openboot --user <username>/<slug>`

Install from a remote custom config hosted on openboot.dev.

```
openboot --user sarah/frontend-team
```

This fetches the config and installs its packages directly.

### `openboot --dry-run`

Preview what would be installed without actually installing anything. Works with any other flag combination.

```
openboot --preset full --dry-run
```

Output shows the full list of formulae and casks that would be installed, along with any shell configuration or macOS preference changes.

### `openboot --silent`

Non-interactive mode — skips all prompts and uses defaults. Useful for CI/CD pipelines or scripted setups.

```
openboot --preset developer --silent
```

Requires `OPENBOOT_GIT_NAME` and `OPENBOOT_GIT_EMAIL` environment variables if Git is not already configured.

### Additional Install Flags

| Flag | Description |
|------|-------------|
| `-p, --preset <name>` | Use a preset: `minimal`, `developer`, `full` |
| `-u, --user <name>` | Install from an openboot.dev config |
| `-s, --silent` | Non-interactive mode (for CI/CD) |
| `--dry-run` | Preview changes without installing |
| `--resume` | Resume an incomplete installation |
| `--packages-only` | Install packages only, skip system configuration (git, shell, macOS prefs) |
| `--shell <mode>` | Shell setup mode: `install` or `skip` |
| `--macos <mode>` | macOS preferences: `configure` or `skip` |
| `--dotfiles <mode>` | Dotfiles mode: `clone`, `link`, or `skip` |
| `--update` | Update Homebrew before installing |
| `--rollback` | Restore backed-up config files |

## Snapshot Commands

### `openboot snapshot`

Capture your current Mac's development environment. Scans Homebrew packages, npm globals, macOS preferences, shell config, git config, and installed dev tools.

```
openboot snapshot
```

The interactive flow:
1. **Scan** — progress animation shows each component being captured
2. **Edit** — full-screen TUI to review and toggle items (Space to toggle, Tab to switch categories, `/` to search)
3. **Confirm** — choose to upload or save locally
4. **Upload** — authenticate (if needed), name your config, and get a shareable URL

### `openboot snapshot --dry-run`

Preview what would be captured without saving or uploading.

```
openboot snapshot --dry-run
```

### `openboot snapshot --json`

Output the snapshot as JSON to stdout. Useful for piping to other tools or inspecting the raw data.

```
openboot snapshot --json
openboot snapshot --json | jq '.packages.formulae'
```

### `openboot snapshot --local`

Save the snapshot to `~/.openboot/snapshot.json` instead of uploading to openboot.dev.

```
openboot snapshot --local
```

### `openboot snapshot --import <file-or-url>`

Restore a development environment from a previously exported snapshot. Accepts a local JSON file or a URL.

```
openboot snapshot --import my-setup.json
openboot snapshot --import https://example.com/snapshot.json
openboot snapshot --import my-setup.json --dry-run
```

The import flow launches the snapshot editor TUI so you can review and toggle items before installing.

### Snapshot Flags

| Flag | Description |
|------|-------------|
| `--local` | Save snapshot to `~/.openboot/snapshot.json` |
| `--json` | Output as JSON to stdout |
| `--dry-run` | Preview without saving, uploading, or installing |
| `--import <path>` | Restore from a local file or URL |

## Utility Commands

### `openboot doctor`

Run diagnostic checks on your development environment. Checks network connectivity, disk space, Homebrew health, Git configuration, shell setup, and essential tools.

```
openboot doctor
```

Example output:

```
  ✓ Network connectivity
  ✓ Disk space (48 GB free)
  ✓ Homebrew installed
  ✓ Homebrew health
  ✓ Git installed
  ✓ Git identity
  ✓ Oh-My-Zsh installed
  ✓ .zshrc exists

  All checks passed! Your environment is healthy.
```

### `openboot update`

Update Homebrew package definitions and upgrade all installed packages.

```
openboot update
openboot update --dry-run
```

### `openboot update --self`

Update the OpenBoot binary itself to the latest release from GitHub.

```
openboot update --self
```

### `openboot version`

Print the current OpenBoot version.

```
openboot version
```

## Environment Variables

### Install Script Variables

These are used when running the `curl | bash` install command:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENBOOT_VERSION` | Override the version of OpenBoot to install | Latest release |
| `OPENBOOT_INSTALL_DIR` | Override the installation directory for the binary | `~/.openboot/bin` |
| `OPENBOOT_DRY_RUN` | Set to `true` to preview the install script without changes | — |
| `OPENBOOT_SKIP_CHECKSUM` | Set to `true` to skip SHA256 checksum verification | — |

### CLI Variables

These are used by the `openboot` binary:

| Variable | Description |
|----------|-------------|
| `OPENBOOT_GIT_NAME` | Git user name (required in `--silent` mode if not configured) |
| `OPENBOOT_GIT_EMAIL` | Git user email (required in `--silent` mode if not configured) |
| `OPENBOOT_PRESET` | Default preset to use |
| `OPENBOOT_USER` | Remote config username/slug |
| `OPENBOOT_DOTFILES` | Dotfiles repository URL |

### Examples

Install a specific version:

```
OPENBOOT_VERSION=0.3.1 curl -fsSL https://openboot.dev/install.sh | bash
```

Install to a custom directory:

```
OPENBOOT_INSTALL_DIR=~/.local/bin curl -fsSL https://openboot.dev/install.sh | bash
```

Silent mode for CI:

```
OPENBOOT_GIT_NAME="CI Bot" OPENBOOT_GIT_EMAIL="ci@example.com" openboot --preset developer --silent
```
