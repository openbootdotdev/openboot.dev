---
title: Presets
group: Features
order: 3
---

# Presets

Three curated starting points. Pick one, then customize it in the TUI before installing — add what you want, remove what you don't.

## At a Glance

| | minimal | developer | full |
|---|---------|-----------|------|
| **Best for** | Minimalists, servers | Most developers | Polyglot / DevOps |
| **CLI tools** | 19 | 29 | 48 |
| **GUI apps** | 5 | 14 | 25 |
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

The recommended starting point. Everything you need to start building, nothing you don't.

**Adds over minimal:**
- **CLI:** node, go, pnpm, docker, docker-compose, lazydocker, tmux, neovim, httpie, pre-commit
- **GUI:** VS Code, OrbStack, Chrome, Arc, Postman, Notion, Scroll Reverser, TablePlus, AppCleaner

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

```bash
openboot --preset full
```

<details>
<summary>Or use the one-line installer</summary>

```bash
curl -fsSL https://openboot.dev/install.sh | bash -s -- --preset full
```
</details>

## Customizing During Install

Presets are just the starting selection. When the TUI launches:

1. The preset's packages come **pre-selected**
2. Use **arrow keys** to navigate, **Tab** to switch between formulae and casks
3. Press **Space** to toggle any package on or off
4. Press **Enter** to confirm and install

Want `developer` but with `kubectl`? Select `developer`, then toggle `kubectl` on. Don't use Notion? Toggle it off. The preset is the starting point, not the final answer.

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
