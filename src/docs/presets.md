---
title: Presets
description: Three curated package sets — minimal, developer, and full — as starting points you can customize before installing.
group: Features
order: 3
---

# Presets

Three curated package sets. Pick one and customize it in the TUI before installing—add what you need, remove what you don't.

## At a Glance

| | minimal | developer | full |
|---|---------|-----------|------|
| **Best for** | Minimalists, servers | Most developers | Polyglot / DevOps |
| **CLI tools** | 19 | 29 | 48 |
| **GUI apps** | 5 | 14 | 25 |
| **NPM packages** | 0 | 5 | 9 |
| **Includes** | Essentials | Essentials + languages + editors | Everything |

## minimal

CLI essentials. Fast and lightweight.

**CLI tools:** curl, wget, jq, yq, ripgrep, fd, bat, eza, fzf, zoxide, htop, btop, tree, tealdeer, gh, git-delta, git-lfs, lazygit, stow

**GUI apps:** Warp, Raycast, Maccy, Stats, Rectangle

```bash
openboot --preset minimal
```

<details>
<summary>Or use the one-line installer</summary>

```bash
curl -fsSL https://openboot.dev/install.sh | bash -s -- --preset minimal
```
</details>

## developer

Default preset. What most developers need without extra stuff you won't use.

**Adds over minimal:**
- **CLI:** node, go, pnpm, docker, docker-compose, lazydocker, tmux, neovim, httpie, pre-commit
- **GUI:** VS Code, OrbStack, Chrome, Arc, Postman, Notion, Scroll Reverser, TablePlus, AppCleaner
- **NPM:** typescript, tsx, eslint, prettier, nodemon

```bash
openboot --preset developer
```

<details>
<summary>Or use the one-line installer</summary>

```bash
curl -fsSL https://openboot.dev/install.sh | bash -s -- --preset developer
```
</details>

## full

Complete dev environment. Languages, DevOps, databases, AI tools — all of it.

**Adds over developer:**
- **CLI:** python, uv, rustup, deno, bun, cmake, kubectl, helm, k9s, terraform, awscli, sqlite, postgresql, redis, duckdb, ollama, llm, tig, dive
- **GUI:** Cursor, Firefox, Proxyman, Obsidian, Figma, IINA, Keka, AlDente, ngrok, Shottr, Miniconda
- **NPM:** pm2, serve, vercel, wrangler

```bash
openboot --preset full
```

<details>
<summary>Or use the one-line installer</summary>

```bash
curl -fsSL https://openboot.dev/install.sh | bash -s -- --preset full
```
</details>

## Customizing Before Install

Presets are starting selections, not locked-in choices. When the TUI opens:

1. Preset packages are pre-selected
2. **Arrow keys** to navigate, **Tab** to switch between formulae and casks
3. **Space** to toggle any package on or off
4. **Enter** to confirm and start installing

Want `developer` with `kubectl` added? Pick `developer`, then toggle `kubectl` on. Don't use Notion? Toggle it off. Customize before you commit.

## Skipping the TUI

For scripted installs, use `--silent` to install a preset exactly as defined:

```bash
openboot --preset developer --silent
```

Preview what would be installed first with `--dry-run`:

```bash
openboot --preset developer --dry-run
```

See [CLI Reference](/docs/cli-reference) for automation details.
