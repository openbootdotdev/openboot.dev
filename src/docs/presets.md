# Presets

Presets are curated collections of packages designed for different use cases. Each preset is a starting point — when the interactive TUI launches, you can toggle any package on or off before confirming the install.

## Available Presets

### minimal

Lightweight CLI essentials for servers, containers, or developers who prefer a lean setup.

**CLI tools:** curl, wget, jq, yq, ripgrep, fd, bat, eza, fzf, zoxide, htop, btop, tree, tldr, gh, git-delta, lazygit, stow

**GUI apps:** Warp, Raycast, Maccy, Stats

```
curl -fsSL openboot.dev/install | bash -s -- --preset minimal
```

### developer (recommended)

A ready-to-code Mac setup with everything you need to start building immediately. Includes all of `minimal` plus languages, Docker, editors, and browsers.

**CLI tools (additions over minimal):** node, go, pnpm, docker, docker-compose, tmux, neovim, httpie

**GUI apps (additions over minimal):** VS Code, OrbStack, Chrome, Arc, Postman, Notion, Scroll Reverser

```
curl -fsSL openboot.dev/install | bash -s -- --preset developer
```

### full

The complete dev environment — every language, DevOps tool, database, and AI utility we recommend. Best for polyglot developers, DevOps engineers, or anyone who wants it all.

**CLI tools (additions over developer):** python, uv, rustup, deno, bun, kubectl, helm, k9s, terraform, awscli, sqlite, postgresql, redis, duckdb, ollama, llm

**GUI apps (additions over developer):** Cursor, Firefox, Proxyman, Obsidian, Figma, IINA, Keka, AlDente, Rectangle

```
curl -fsSL openboot.dev/install | bash -s -- --preset full
```

## Customizing During Install

You don't have to accept a preset as-is. When the interactive TUI launches:

1. The preset's packages come pre-selected
2. Use **arrow keys** to navigate the package list
3. Press **Space** to toggle any package on or off
4. Press **Enter** to confirm and begin installation

This means you can start with `developer` but add `kubectl` from `full`, or remove `notion` if you don't use it. The preset is just the starting selection.

## Non-Interactive Install

If you want to skip the TUI and install a preset exactly as defined (useful for CI or scripting), the `--preset` flag with no TUI will install everything in the preset without prompting:

```
curl -fsSL openboot.dev/install | bash -s -- --preset developer
```

Add `--dry-run` to preview what would be installed without actually installing anything:

```
curl -fsSL openboot.dev/install | bash -s -- --preset developer --dry-run
```
