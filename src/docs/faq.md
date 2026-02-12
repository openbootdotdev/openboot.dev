---
title: FAQ
group: ''
order: 12
---

# FAQ

## Is OpenBoot free?

Yes — free and open source (MIT license). Create configs, use snapshot, share setups, all at no cost. Team management features (org accounts, access controls) are on the roadmap and may have paid tiers.

## Why not just use Homebrew directly?

Homebrew installs packages. OpenBoot sets up your **entire** environment — packages, GUI apps, shell configuration, dotfiles, and macOS preferences — in one command. Think of it as Homebrew + shell setup + dotfiles + system preferences, orchestrated together with an interactive TUI for picking what you want.

If you're happy managing each of those separately, you don't need OpenBoot. If you'd rather do it in 5 minutes instead of an hour, give it a try.

## Is it safe to pipe curl to bash?

Fair question. Here's how OpenBoot handles it:

- The install script is **open source** — review it at [github.com/openbootdotdev/openboot](https://github.com/openbootdotdev/openboot)
- Hosted on openboot.dev (Cloudflare Workers), served over HTTPS
- **Zero telemetry** — no analytics, no tracking, no phoning home
- The binary is downloaded from GitHub Releases with **SHA256 checksum verification**
- You can inspect the script before running it:

```
curl -fsSL https://openboot.dev/install.sh > install.sh && cat install.sh
```

## What if I already have Homebrew?

OpenBoot detects existing Homebrew installs and skips the setup. It also skips already-installed packages — only new ones get installed. Re-running is fast and safe.

## Can I use it without an account?

Yes. No account needed for:

- Installing with presets (`minimal`, `developer`, `full`)
- Using the interactive TUI
- Running `openboot snapshot --local` or `--json`

An account (GitHub or Google OAuth) is needed to:

- Upload configs to openboot.dev and share them via URL
- Install private configs (run `openboot login` first)

## How do I update OpenBoot?

```
openboot update --self
```

Or re-run the install script — it downloads the latest binary and replaces the old one. Your configs, snapshots, and auth tokens are unaffected.

## Where is my data stored?

| What | Where |
|------|-------|
| Configs & user data | Cloudflare D1 on openboot.dev |
| Auth token | `~/.openboot/auth.json` (local) |
| Local snapshots | `~/.openboot/snapshot.json` (local) |
| OpenBoot binary | `~/.openboot/bin/openboot` (local) |

Configs are **unlisted** by default — not listed on your profile, but the install URL works if shared. You can set them to **public** (listed on profile) or **private** (requires authentication to install). See [Custom Configs — Visibility](/docs/custom-configs#visibility) for details.

## What shell does OpenBoot set up?

**Zsh** with **Oh-My-Zsh**:

- Plugins: git, zsh-autosuggestions, zsh-syntax-highlighting
- A clean, informative theme
- Useful developer aliases

If you already have Oh-My-Zsh, OpenBoot merges its recommendations without overwriting your config. If you manage your shell yourself, use `--shell skip`.

## Does it work on Linux?

Not yet. OpenBoot is macOS-only. Linux support is being explored.

## Can I use it with my existing dotfiles?

Yes. Set your dotfiles repo URL in your config and OpenBoot will clone and link it with GNU Stow. See [Dotfiles & Shell](/docs/dotfiles-shell) for details.

Your existing dotfiles repo structure works as-is — OpenBoot doesn't require any special format.
