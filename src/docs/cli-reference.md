# CLI Reference

The `openboot` command-line tool handles both installation and environment capture.

## Installation Commands

### `openboot`

Run with no arguments to launch the interactive TUI installer. This is the default experience — you'll see a full-screen terminal interface where you can browse and select packages.

```
openboot
```

The TUI starts with the `developer` preset pre-selected. Use arrow keys to navigate, Space to toggle packages, and Enter to confirm.

### `openboot --preset <name>`

Install a preset directly. Available presets: `minimal`, `developer`, `full`.

```
openboot --preset developer
```

This launches the TUI with the specified preset's packages pre-selected.

### `openboot --user <username>/<slug>`

Install from a remote custom config hosted on openboot.dev.

```
openboot --user sarah/frontend-team
```

This fetches the config and launches the TUI with those packages pre-selected.

### `openboot --dry-run`

Preview what would be installed without actually installing anything. Works with any other flag combination.

```
openboot --preset full --dry-run
```

Output shows the full list of formulae and casks that would be installed, along with any shell configuration or macOS preference changes.

## Snapshot Commands

### `openboot snapshot`

Capture your current Mac's development environment. Scans Homebrew packages, macOS preferences, shell config, git config, and installed dev tools.

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
openboot snapshot --json | jq '.homebrew.formulae'
```

### `openboot snapshot --local`

Save the snapshot to `~/.openboot/snapshot.json` instead of uploading to openboot.dev.

```
openboot snapshot --local
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENBOOT_VERSION` | Override the version of OpenBoot to install | Latest release |
| `OPENBOOT_INSTALL_DIR` | Override the installation directory for the binary | `/usr/local/bin` or `/opt/homebrew/bin` |

### Example

Install a specific version:

```
OPENBOOT_VERSION=0.3.1 curl -fsSL openboot.dev/install | bash
```

Install to a custom directory:

```
OPENBOOT_INSTALL_DIR=~/.local/bin curl -fsSL openboot.dev/install | bash
```
