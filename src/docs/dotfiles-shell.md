---
title: Dotfiles & Shell
group: Features
order: 6
---

# Dotfiles & Shell

OpenBoot configures your shell environment and can link your dotfiles — so your personal setup follows you to any Mac.

## Shell Configuration

OpenBoot sets up **Zsh** with **Oh-My-Zsh** automatically:

- **Plugins**: git, zsh-autosuggestions, zsh-syntax-highlighting
- **Theme**: A clean, informative prompt
- **Aliases**: Common shortcuts for developer workflows

If you already have Oh-My-Zsh installed, OpenBoot merges its plugin recommendations without overwriting your existing config.

After installation, restart your terminal or run `source ~/.zshrc` to pick up the new configuration.

### Skipping Shell Setup

If you manage your shell config yourself:

```
openboot --shell skip
```

## Dotfiles

If you keep your config files in a Git repo (`.zshrc`, `.gitconfig`, `.vimrc`, etc.), OpenBoot can clone and link them automatically.

### How It Works

1. Set a **dotfiles repo URL** in your config (via the dashboard or config JSON)
2. During install, OpenBoot clones the repo to `~/.dotfiles`
3. Files are symlinked into your home directory using [GNU Stow](https://www.gnu.org/software/stow/)

### Dotfiles Modes

Control how OpenBoot handles dotfiles with the `--dotfiles` flag:

| Mode | What it does |
|------|-------------|
| `clone` | Clone the repo to `~/.dotfiles` |
| `link` | Clone and symlink with `stow` |
| `skip` | Don't touch dotfiles |

```
openboot --dotfiles link
openboot --dotfiles skip
```

### Setting Up Your Dotfiles Repo

Don't have a dotfiles repo yet? Here's the minimum structure that works with `stow`:

```
~/.dotfiles/
├── git/
│   └── .gitconfig
├── zsh/
│   └── .zshrc
└── vim/
    └── .vimrc
```

Each top-level directory is a "package." When stowed, the contents are symlinked one level up — so `git/.gitconfig` becomes `~/.gitconfig`.

OpenBoot provides a [starter dotfiles template](https://github.com/openbootdotdev/dotfiles) you can fork and customize.

## macOS Preferences

OpenBoot applies a curated set of developer-friendly macOS settings. These are all reversible system preferences — nothing destructive.

### What Gets Configured

**Global**
- Show all file extensions
- Always show scrollbars
- Disable auto-correct and auto-capitalization
- Fast key repeat rate and short repeat delay

**Finder**
- Show path bar and status bar
- Default to list view
- No warning when changing file extensions
- Show hidden files

**Dock**
- Keep Dock visible (no autohide by default)
- Hide recent applications
- Set icon size
- Use scale effect for minimize

**Screenshots**
- Save to `~/Screenshots`
- PNG format
- Disable shadow

**Other**
- Safari developer menu enabled
- TextEdit defaults to plain text
- Time Machine won't prompt for new backup disks

### Skipping macOS Preferences

If you prefer your current settings:

```
openboot --macos skip
```

See [Config Options](/docs/config-options) for the complete list of macOS preferences you can configure.
