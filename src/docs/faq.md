# FAQ

## Is OpenBoot free?

Yes. OpenBoot is free and open source (MIT license) for individuals. You can create custom configs, use snapshot, and share setups at no cost. Team management features (org accounts, access controls) are on the roadmap and may have paid tiers.

## Does it work on Linux?

Partially. The Homebrew-based package installation works on Linux since Homebrew supports Linux (Linuxbrew). However, macOS-specific features don't apply:

- macOS preference tweaks are skipped
- Cask installations are skipped (casks are macOS-only)
- Some GUI app detection in snapshot won't work

For Linux, you'll get the CLI tool installations but not the full experience.

## Can I use it for my team?

Yes. The recommended workflow is:

1. Create a custom config on your dashboard with your team's standard tools
2. Share the one-line install URL in your onboarding docs or README
3. New team members run the command and get the exact same environment

Alternatively, a team lead can run `openboot snapshot` on their own machine to capture their proven setup and share it directly.

## Is it safe to pipe curl to bash?

This is a common concern. Here's how OpenBoot handles it:

- The install script is **open source** — review it anytime at [github.com/openbootdotdev/openboot](https://github.com/openbootdotdev/openboot)
- The script is hosted on openboot.dev (Cloudflare Workers) and served over HTTPS
- **No telemetry** is collected — no analytics, no tracking, no phoning home
- You can download and inspect the script before running it: `curl -fsSL openboot.dev/install.sh > install.sh && cat install.sh`
- The binary itself is downloaded from GitHub Releases with checksum verification

## What if I already have Homebrew installed?

OpenBoot detects existing Homebrew installations and skips the Homebrew install step entirely. It also detects already-installed packages and marks them in the TUI so you know what's new versus what's already on your system.

## How do I update OpenBoot?

Re-run the install script:

```
curl -fsSL openboot.dev/install.sh | bash
```

This downloads the latest binary and replaces the existing one. Your configs, snapshots, and auth tokens are not affected.

## Where is my data stored?

- **Configs and user data** — stored in Cloudflare D1 (SQLite-compatible database) on openboot.dev's infrastructure
- **Configs are public by default** — anyone with the URL can install from your config. You can mark configs as private in the dashboard.
- **Auth tokens** — stored locally at `~/.openboot/auth.json` on your machine
- **Local snapshots** — saved to `~/.openboot/snapshot.json` when using `--local`
- **No data is stored on your machine** beyond the binary, auth token, and optional local snapshots

## Can I use OpenBoot without an account?

Yes. You don't need an account to:

- Install using the default presets (`minimal`, `developer`, `full`)
- Use the interactive TUI
- Run `openboot snapshot --local` or `openboot snapshot --json`

An account is only needed to upload configs to openboot.dev and share them via URL.

## What shell does OpenBoot configure?

OpenBoot sets up **Zsh** with **Oh-My-Zsh**, including:

- A curated set of plugins (git, zsh-autosuggestions, zsh-syntax-highlighting)
- A clean theme
- Useful aliases for common developer tasks

If you already have Oh-My-Zsh installed, OpenBoot merges its plugin recommendations without overwriting your existing configuration.
