---
title: For You
description: How OpenBoot saves you hours on new Mac setup, keeps your machines in sync, and replaces your memory as a package manager.
group: Use Cases
order: 7
---

# For You

## Ninety minutes into a new Mac setup

You've just Googled "mac fast key repeat rate terminal" for the fifth time in your career. You recognize the Stack Overflow answer. You upvoted it last time.

Homebrew's installed. Xcode tools took 20 minutes for reasons you've stopped questioning. Now you're staring at Terminal trying to remember if you use `ripgrep` or `rg` or both. Was it `bat` or `batcat`? You had `fzf` on the old machine. Or was that only on your work Mac?

By 3pm you still haven't written a line of code.

This time, you open Terminal and type one line:

```bash
curl -fsSL https://openboot.dev/install.sh | bash
```

OpenBoot handles everything, then drops you into a TUI. You pick the `developer` preset — Node, Go, Docker, VS Code. You swap Postman for httpie, toggle on `fzf`. Hit Enter, go make coffee.

```text
✓ Homebrew installed
✓ Installing 29 formulae and 14 casks...
✓ node (22.0.0) · go (1.23.0) · docker · mass-installing...
✓ visual-studio-code · arc · orbstack
✓ Oh-My-Zsh configured (git, zsh-autosuggestions, zsh-syntax-highlighting)
✓ macOS preferences applied (Fast Key Repeat, Finder Path Bar, Show Hidden Files)
✓ Dotfiles cloned and linked
✨ Setup complete. Restart your terminal.
```

You come back, open a new tab, type `node --version`. It works. `git config user.email` — it's there. The Dock is clean, Finder shows hidden files, key repeat is fast. It's your machine.

Twenty minutes. You're writing code before lunch.

See [Presets](/docs/presets) for what's in `minimal`, `developer`, and `full`.

## Your memory is the worst package manager you've ever used

Two years on this Mac. Thirty-two Homebrew packages, but you couldn't list fifteen of them without checking `brew list`. Your `.zshrc` has aliases you don't remember writing. Did you install `tldr` or `tealdeer`? Both? You Googled the `defaults` command to make key repeat instant — good luck finding that again.

Last month someone asked what's in your dev environment. You sent them a list you typed from memory. Three tools were missing. Two you listed twice under different names.

Your memory is a terrible package manager. It doesn't track dependencies. It has no changelog. The `--version` flag is unreliable.

```bash
openboot snapshot
```

OpenBoot scans your machine — Homebrew packages, casks, macOS preferences, shell config, git identity — and opens a TUI editor. You uncheck personal stuff (Spotify, Slack), keep the dev tools. Name it, upload it. One minute.

```text
✓ Homebrew Formulae    32 found
✓ Homebrew Casks       15 found
✓ macOS Preferences    12 found
✓ Shell & Git Config   scanned
✓ Uploaded → https://openboot.dev/alex/my-setup
```

Now you have a URL. Next time someone asks "what's your dev environment?" you send them a link. The list is complete. The versions are accurate. Your memory is off the hook.

Want more than just packages? Add a **custom script** in the [Dashboard](/dashboard):

```bash
# Directory structure
mkdir -p ~/projects/{personal,work,oss}

# Fresh SSH key
ssh-keygen -t ed25519 -C "alex@hey.com" -f ~/.ssh/id_ed25519 -N ""
eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519

# Repos you always need
git clone git@github.com:alex/dotfiles.git ~/projects/personal/dotfiles
git clone git@github.com:alex/side-project.git ~/projects/personal/side-project
```

Everything that isn't a package — directory structure, SSH keys, repo cloning — becomes part of your config. See [Custom Configs](/docs/custom-configs) for more on what custom scripts can do.

When the new machine arrives, or when IT finally sends that hardware refresh email:

```bash
curl -fsSL https://openboot.dev/alex/my-setup/install.sh | bash
```

Everything restored. Twenty minutes, done.

## Work Mac, home Mac, same setup

Monday morning at the office. You install `jq` for a quick script. It's useful, so you keep using it all week.

Friday night at home. You pull down the same project on your personal Mac. Run the script. `jq: command not found`. Right. You forgot to install it here too.

Now you're manually remembering what you installed at work, typing `brew install jq` again, wondering what else is out of sync. This happens every time you add a new tool.

With OpenBoot, you don't remember. You just sync.

After installing `jq` at work:

```bash
openboot snapshot
```

Updates your config. At home:

```bash
openboot --user alex/my-setup
```

OpenBoot sees `jq` is in your config but not installed. Adds it. Two commands, both machines in sync. Works the other way too — install something at home, snapshot, pull it down at work next Monday.

Your config becomes the source of truth. Not your memory.

## What's Next

- [Presets](/docs/presets) — see what's in each starting point
- [Snapshot](/docs/snapshot) — the full capture walkthrough
- [Custom Configs](/docs/custom-configs) — build and share your own setup

