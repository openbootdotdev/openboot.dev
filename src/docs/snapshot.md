# Snapshot

Snapshot captures your current Mac's development environment and turns it into a shareable OpenBoot config. Instead of building a config from scratch, you can scan what's already on your machine and upload it.

## Install and Run

```
curl -fsSL openboot.dev/install.sh | bash -s -- snapshot
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

## Interactive Flow

When you run `openboot snapshot` without flags:

1. **Scan with progress** — each component is scanned with real-time feedback:
   ```
   ✓ Homebrew Formulae    28 found
   ✓ Homebrew Casks       12 found
   ✓ macOS Preferences     9 found
   ⠋ Shell Environment    scanning...
   ```

2. **Review in the editor** — a full-screen TUI lets you review and customize what's included:
   - **3 tabs**: Formulae, Casks, macOS Preferences
   - **Toggle items** with Space to include/exclude individual packages or settings
   - **Search** with `/` to find specific items
   - **Select all** with `a` to quickly toggle an entire category
   - Shell, Git, and Dev Tools are shown as a read-only summary

3. **Confirm upload** — choose to upload to openboot.dev or save locally as a fallback.

4. **Authenticate** (if needed) — opens your browser to authorize via a device code flow (similar to `gh auth login`). If you're already authenticated, this step is skipped.

5. **Name your config** — provide a name like "my-setup" or "team-baseline".

6. **Success screen** — after upload, you'll see:
   ```
   ✓ Config uploaded successfully!

   View your config:
     https://openboot.dev/username/my-setup

   Share with others:
     curl -fsSL https://openboot.dev/username/my-setup/install.sh | bash

   Opening in browser...
   ```

The browser automatically opens to your new config page.

## Privacy

Snapshot is designed to be safe to share:

- **Paths are sanitized** — any references to your home directory are replaced with `~/`
- **Only whitelisted macOS preferences** — no arbitrary system data is read
- **No secrets** — SSH keys, API tokens, `.env` files, and credentials are never captured
- **Full control before uploading** — the interactive editor lets you review every item and deselect anything you don't want to share
