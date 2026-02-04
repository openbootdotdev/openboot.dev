# Getting Started

OpenBoot is an open-source command-line tool that bootstraps your macOS development environment in minutes. Instead of manually installing Homebrew, CLI tools, GUI apps, configuring your shell, and tweaking macOS settings one by one, OpenBoot handles it all with a single command — through a beautiful interactive TUI that lets you pick exactly what you want.

## System Requirements

- **macOS 12 (Monterey)** or later
- **Apple Silicon (M1/M2/M3/M4)** and **Intel** Macs are both supported
- An internet connection (packages are downloaded from Homebrew)
- Admin privileges (you'll be prompted for your password during install)

## Quick Install

Open Terminal and run:

```
curl -fsSL https://openboot.dev/install | bash
```

That's it. One line.

## What Happens When You Run It

Here's exactly what the install script does, in order:

1. **Downloads the OpenBoot binary** — a small Go binary is fetched from the latest GitHub release and placed in `/usr/local/bin` (Intel) or `/opt/homebrew/bin` (Apple Silicon).

2. **Installs Xcode Command Line Tools** — if not already installed, OpenBoot triggers the macOS CLT installer. These are required for Git, compilers, and Homebrew.

3. **Installs Homebrew** — if Homebrew isn't detected, OpenBoot runs the official Homebrew install script. If you already have Homebrew, it skips this step entirely.

4. **Launches the interactive TUI** — a full-screen terminal interface appears where you can browse and toggle packages on/off using your keyboard. You start with the `developer` preset by default, but every package is individually selectable.

5. **Installs your selections** — once you confirm, OpenBoot installs all selected Homebrew formulae and casks, configures Oh-My-Zsh (with plugins and a theme), sets up useful shell aliases, and applies macOS preference tweaks.

## First Run Experience

When the TUI launches, you'll see:

- **Formulae section** — CLI tools grouped by category (essentials, languages, DevOps, etc.)
- **Casks section** — GUI applications (editors, browsers, utilities, etc.)
- **Navigation** — use arrow keys and Tab to move between sections, Space to toggle individual packages, Enter to confirm

The TUI shows which packages are already installed on your system (marked with a check) so you won't reinstall anything unnecessarily.

After installation completes, restart your terminal or run `source ~/.zshrc` to pick up the new shell configuration.
