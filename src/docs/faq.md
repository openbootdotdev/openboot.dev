---
title: FAQ
description: Common questions about OpenBoot — pricing, safety, Homebrew vs installer, Linux support, uninstalling, and more.
group: ''
order: 12
---

# FAQ

## Is OpenBoot free?

Yes — free and open source (MIT license). Create configs, use snapshot, share setups, all at no cost. Team management features (org accounts, access controls) are on the roadmap and may have paid tiers.

## Why not just use Homebrew directly?

Homebrew installs packages. OpenBoot sets up your **entire** environment — packages, GUI apps, shell configuration, dotfiles, and macOS preferences — in one command. Think of it as Homebrew + shell setup + dotfiles + system preferences, orchestrated together with an interactive TUI for picking what you want.

If you're happy managing each of those separately, you don't need OpenBoot. If you'd rather do it in 5 minutes instead of an hour, give it a try.

## Should I use Homebrew or the one-line installer?

**Use Homebrew** (`brew install openboot`) if you:
- Already have Homebrew installed
- Want cleaner updates (`brew upgrade openboot`)
- Prefer package managers over `curl | bash`

**Use the one-line installer** if you:
- Don't have Homebrew yet (it installs Homebrew for you)
- Want the absolute fastest setup on a fresh Mac
- Are running in CI/automation environments

Both methods install the exact same binary.

## Is the one-line installer safe?

Fair question. Here's how OpenBoot handles it:

- The install script is **open source** — review it at [github.com/openbootdotdev/openboot](https://github.com/openbootdotdev/openboot)
- Hosted on openboot.dev (Cloudflare Workers), served over HTTPS
- **Zero telemetry** — no analytics, no tracking, no phoning home
- The binary is downloaded from GitHub Releases with **SHA256 checksum verification**
- You can inspect the script before running it:

```bash
curl -fsSL https://openboot.dev/install.sh > install.sh && cat install.sh
```

If you prefer, install via Homebrew instead (see above).

## What about install counts on shared configs?

If you share a config publicly on the Explore page, we display an install count. This is **not telemetry** in the traditional sense:

- **Anonymous** — we don't track who installed it, only that someone did
- **Opt-in** — only happens when you actively set visibility to "Public"
- **No personal data** — no IP addresses, no user agents, no system info collected
- **Zero tracking** — we don't follow your behavior, clicks, or usage patterns

"Zero telemetry" means the OpenBoot CLI never reports back to us. It doesn't track what you install, what commands you run, or any system information. Install counts are simply a counter for configs you chose to share publicly with the community.

Think of it like GitHub's star count — it shows popularity, but doesn't track individual users.

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

**If installed via Homebrew:**

```bash
brew upgrade openboot
```

**If installed via the one-line installer:**

```bash
openboot update --self
```

Or re-run the install script — it downloads the latest binary and replaces the old one.

Your configs, snapshots, and auth tokens are unaffected by updates.

## How do I uninstall OpenBoot?

### 1. Remove the binary

**If installed via Homebrew:**

```bash
brew uninstall openboot
brew untap openbootdotdev/tap
```

**If installed via the one-line installer:**

```bash
rm -f ~/.openboot/bin/openboot
```

### 2. Remove OpenBoot data

```bash
rm -rf ~/.openboot
```

This deletes your auth token, local snapshots, install state, and update config. If you want to keep anything, back it up first — see [File Locations](/docs/env-vars#file-locations) for what's in there.

### 3. Clean up shell config (optional)

If OpenBoot configured your shell, open `~/.zshrc` and remove the block starting with `# OpenBoot additions` — it includes Homebrew init, PATH changes, CLI aliases, and tool integrations. If you're not sure which lines, look for the block between `# OpenBoot additions` and the next blank line or section.

If you used dotfiles linking, OpenBoot created `.openboot.bak` backups of your original files. To restore them:

```bash
# Example: restore a backed-up .zshrc
mv ~/.zshrc.openboot.bak ~/.zshrc
```

### 4. Packages and apps (optional)

OpenBoot doesn't remove Homebrew packages or casks when you uninstall it — they're yours to keep. If you want to remove packages that were installed via OpenBoot, use `brew uninstall <package>` individually.

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
