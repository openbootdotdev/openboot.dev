---
title: FAQ
description: Common questions about OpenBoot — pricing, safety, Homebrew vs installer, Linux support, uninstalling, and more.
group: ''
order: 13
---

# FAQ

## Is OpenBoot free?

Yes. Free and open source (MIT license). Create configs, snapshot your setup, share with your team — no cost. Team features (org accounts, access controls) may have paid tiers later.

## Why not just use Homebrew directly?

Homebrew installs packages. OpenBoot installs packages **and** configures your shell, links dotfiles, and applies macOS preferences. All in one run with a TUI to pick what you want.

If you're fine managing those separately, you don't need this. If you'd rather automate it, try OpenBoot.

## Should I use Homebrew or the one-line installer?

**Use Homebrew** (`brew install openbootdotdev/tap/openboot`) if you:
- Already have Homebrew installed
- Want cleaner updates (`brew upgrade openboot`)
- Prefer package managers over ad-hoc scripts

**Use the one-line installer** if you:
- Don't have Homebrew yet (it installs Homebrew for you)
- Want the absolute fastest setup on a fresh Mac
- Are running in CI / automation environments

Both methods install the exact same binary.

## Is the one-line installer safe?

Fair question. Here's how it works:

- Install script is open source — review it at [github.com/openbootdotdev/openboot](https://github.com/openbootdotdev/openboot/blob/main/scripts/install.sh)
- Hosted on openboot.dev (Cloudflare Workers), served over HTTPS
- Zero telemetry — no analytics, no tracking, nothing phones home
- Installs OpenBoot via Homebrew (`brew install openbootdotdev/tap/openboot`), which handles integrity verification
- You can inspect the script before running it:

```bash
curl -fsSL https://openboot.dev/install.sh > install.sh
cat install.sh
bash install.sh
```

If you prefer, install via Homebrew instead (see above).

## What about install counts on shared configs?

If you share a config publicly on the Explore page, we display an install count. This is **not telemetry** in the traditional sense:

- **Anonymous** — we don't track who installed it, only that someone did
- **Opt-in** — only happens when visibility is set to "Public"
- **No personal data** — no IP addresses, no user agents, no system info
- **Zero tracking** — no behavior, clicks, or usage patterns

"Zero telemetry" means the OpenBoot CLI never reports back to us. It doesn't track what you install, what commands you run, or any system information. Install counts are simply a counter for configs you chose to share publicly.

Think of it like GitHub's star count — shows popularity, doesn't track individuals.

## What if I already have Homebrew?

OpenBoot detects existing Homebrew installs and skips the setup. It also skips already-installed packages — only new ones get installed. Re-running is fast and safe.

## Does OpenBoot uninstall packages?

No — by design. As of v1.0, OpenBoot is add-only:

- `openboot install` never removes packages, even if they're not in the config you're installing from
- There is no `openboot clean` or `openboot uninstall`
- To remove something, run Homebrew directly: `brew uninstall <package>`

This makes re-running `openboot install` always safe — you never lose packages you added manually.

## Can I use it without an account?

Yes. No account needed for:

- Installing with presets (`minimal`, `developer`, `full`)
- Using the interactive TUI
- Running `openboot snapshot --local` or `--json`

An account (GitHub or Google OAuth) is needed to:

- Publish configs to openboot.dev (`openboot snapshot --publish`)
- Install private configs (run `openboot login` first)

## How do I update OpenBoot?

```bash
brew upgrade openboot
```

OpenBoot also does a lightweight auto-update check when you run `install`.

The old `openboot update --self` command was removed in v1.0 — use `brew upgrade` instead.

Your configs, snapshots, and auth tokens are unaffected by upgrades.

## How do I uninstall OpenBoot?

### 1. Remove the binary

```bash
brew uninstall openboot
brew untap openbootdotdev/tap
```

### 2. Remove OpenBoot data

```bash
rm -rf ~/.openboot
```

This deletes your auth token, local snapshots, install state, and sync source. See [File Locations](/docs/env-vars#file-locations) for what's in there if you want to keep something.

### 3. Clean up shell config (optional)

If OpenBoot configured your shell, open `~/.zshrc` and remove the block starting with `# OpenBoot additions` — it includes Homebrew init, PATH changes, CLI aliases, and tool integrations.

If you used dotfiles linking, OpenBoot created `.openboot.bak` backups of your original files. To restore:

```bash
mv ~/.zshrc.openboot.bak ~/.zshrc
```

### 4. Packages and apps (optional)

OpenBoot doesn't remove Homebrew packages when you uninstall it — they're yours to keep. To remove packages installed via OpenBoot, use `brew uninstall <package>` individually.

## Where is my data stored?

| What | Where |
|------|-------|
| Configs & user data | Cloudflare D1 on openboot.dev |
| Auth token | `~/.openboot/auth.json` (local) |
| Local snapshots | `~/.openboot/snapshot.json` (local) |
| OpenBoot binary | Managed by Homebrew (`which openboot`) |

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

Yes. Set your dotfiles repo URL in your config and OpenBoot will clone and link it with GNU Stow. See [Dotfiles & Shell](/docs/dotfiles-shell).

Your existing dotfiles repo structure works as-is — OpenBoot doesn't require any special format.
