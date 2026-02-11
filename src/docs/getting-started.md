# Getting Started

OpenBoot is an open-source command-line tool for macOS developers. Whether you're setting up a brand-new Mac or capturing an existing one, OpenBoot has you covered:

- **New Mac?** Bootstrap your entire dev environment in minutes — Homebrew packages, GUI apps, dotfiles, shell config, and macOS preferences — all through an interactive TUI.
- **Already set up?** Run `openboot snapshot` to capture what you have. Save it locally or share it as a config URL — your choice.

Pick the path that fits:

## Path 1: Bootstrap a New Mac

### System Requirements

- **macOS 12 (Monterey)** or later
- **Apple Silicon (M1/M2/M3/M4)** and **Intel** Macs are both supported
- An internet connection (packages are downloaded from Homebrew)
- Admin privileges (you'll be prompted for your password during install)

### Quick Install

Open Terminal and run:

```
curl -fsSL https://openboot.dev/install.sh | bash
```

That's it. One line.

### What Happens When You Run It

Here's exactly what the install script does, in order:

1. **Downloads the OpenBoot binary** — a small Go binary is fetched from the latest GitHub release and placed in `~/.openboot/bin` (and added to your PATH automatically).

2. **Installs Xcode Command Line Tools** — if not already installed, OpenBoot triggers the macOS CLT installer. These are required for Git, compilers, and Homebrew.

3. **Installs Homebrew** — if Homebrew isn't detected, OpenBoot runs the official Homebrew install script. If you already have Homebrew, it skips this step entirely.

4. **Launches the interactive TUI** — a full-screen terminal interface appears where you can browse and toggle packages on/off using your keyboard. You start with the `developer` preset by default, but every package is individually selectable.

5. **Installs your selections** — once you confirm, OpenBoot skips already-installed packages, then installs CLI tools in parallel and GUI apps sequentially (with terminal access for any password prompts). It also configures Oh-My-Zsh (with plugins and a theme), sets up useful shell aliases, and applies macOS preference tweaks.

### First Run Experience

When the TUI launches, you'll see:

- **Formulae section** — CLI tools grouped by category (essentials, languages, DevOps, etc.)
- **Casks section** — GUI applications (editors, browsers, utilities, etc.)
- **Navigation** — use arrow keys and Tab to move between sections, Space to toggle individual packages, Enter to confirm

The TUI shows which packages are already installed on your system (marked with a check) so you won't reinstall anything unnecessarily.

After installation completes, restart your terminal or run `source ~/.zshrc` to pick up the new shell configuration.

## Path 2: Snapshot Your Existing Mac

Already have your Mac configured just the way you like it? Snapshot captures your current setup — Homebrew packages, macOS preferences, shell config, and git settings — so you can save it locally or share it.

```
curl -fsSL https://openboot.dev/install.sh | bash -s -- snapshot
```

Or if you already have `openboot` installed:

```
openboot snapshot
```

Snapshot walks you through an interactive review of everything it found. You can toggle individual items on or off before deciding to save locally (`--local`) or upload to openboot.dev.

For full details, see the [Snapshot](/docs#snapshot) documentation.
