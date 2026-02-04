# Snapshot

Snapshot captures your current Mac's development environment and turns it into a shareable OpenBoot config. Instead of building a config from scratch, you can scan what's already on your machine and upload it.

## Install and Run

```
curl -fsSL openboot.dev/install | bash -s -- snapshot
```

This downloads the OpenBoot binary (if not already installed) and immediately runs the snapshot command.

If you already have `openboot` installed:

```
openboot snapshot
```

## What It Captures

Snapshot scans the following:

### Homebrew Packages

- **Formulae** — detected via `brew leaves` (only top-level packages, not dependencies)
- **Casks** — all installed GUI applications managed by Homebrew

### macOS Preferences

A curated whitelist of 24 system settings that developers commonly customize:

- Dock: autohide, icon size, position, minimize effect
- Finder: show extensions, show hidden files, default view style
- Keyboard: key repeat rate, initial key repeat delay
- Trackpad: tap to click, tracking speed
- Screenshots: format, location, disable shadow
- Global: reduce transparency, dark mode, accent color
- Mission Control: spaces auto-rearrange, group windows by app

Only these whitelisted preferences are captured — no arbitrary system data.

### Shell Configuration

- **Oh-My-Zsh** — detected if present, along with installed plugins and the active theme
- **Shell aliases** — from `.zshrc` (common patterns, not the entire file)

### Git Config

- `user.name` and `user.email` from `~/.gitconfig`
- Core settings like default editor and default branch

### Dev Tools with Versions

- Node.js, Go, Python, Rust, Ruby — detected with their installed versions
- Package managers: npm, pnpm, yarn, pip, cargo

## Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview what would be captured without uploading or saving |
| `--json` | Output the snapshot as JSON to stdout (pipe to other tools) |
| `--local` | Save the snapshot to `~/.openboot/snapshot.json` instead of uploading |

### Examples

Preview what snapshot will capture:

```
openboot snapshot --dry-run
```

Pipe the JSON output to `jq`:

```
openboot snapshot --json | jq '.homebrew.formulae'
```

Save locally for later:

```
openboot snapshot --local
```

## Upload Flow

When you run `openboot snapshot` without flags, after scanning your system it will:

1. **Prompt for authentication** — opens your browser to authorize OpenBoot via a device code flow (similar to `gh auth login`). You see a code in the terminal, confirm it in the browser, and the CLI receives an auth token.

2. **Name your config** — you'll be asked to provide a name (e.g., "my-setup" or "team-baseline").

3. **Upload** — the snapshot is pushed to openboot.dev as a new config under your account.

4. **Get your URL** — the CLI prints your shareable install URL: `openboot.dev/<username>/<slug>/install`

If you're already authenticated (token stored at `~/.openboot/auth.json`), step 1 is skipped.

## Privacy

Snapshot is designed to be safe to share:

- **Paths are sanitized** — any references to your home directory are replaced with `~/`
- **Only whitelisted macOS preferences** — no arbitrary system data is read
- **No secrets** — SSH keys, API tokens, `.env` files, and credentials are never captured
- **You review before uploading** — the snapshot is shown in the terminal before upload so you can verify what's being shared
