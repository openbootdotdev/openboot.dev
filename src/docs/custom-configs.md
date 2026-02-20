---
title: Custom Configs
description: Build your own setup on the dashboard, share it as a one-line install command, and explore what the public config page shows — packages, fork, share, and more.
group: Features
order: 5
---

# Custom Configs

Build your own setup, save it on openboot.dev, and share it as a one-line install command. Anyone with the URL can install your exact environment.

## Creating a Config

1. Sign in with GitHub or Google—click **Login** in the header
2. Go to your [Dashboard](/dashboard)
3. Click **Create Config**
4. Pick a base preset (`minimal`, `developer`, or `full`) to start from
5. Add or remove packages using search
6. Save

## What a Config Can Include

| Feature | Description |
|---------|-------------|
| **Homebrew formulae** | CLI tools installed via `brew install` |
| **Homebrew casks** | GUI apps installed via `brew install --cask` |
| **Custom scripts** | Shell commands that run after packages install (SSH setup, repo cloning, etc.) |
| **Dotfiles repo** | A Git URL — gets cloned and linked with `stow` |
| **macOS preferences** | Whitelisted system settings (Dock, Finder, key repeat, etc.) |

See [Config Options](/docs/config-options) for the full schema and all available fields.

## Importing a Brewfile

Already have a Brewfile? Upload it in the dashboard. OpenBoot parses all `brew` and `cask` entries and maps them to a config automatically.

## Sharing

Every config gets an install command:

```bash
openboot install sarah/frontend-team
```

Put it in your README, onboarding docs, or Slack. One command, everyone gets the same setup.

## The Config Page

Every config has a public page at `openboot.dev/username/slug`. Here's what it shows and what visitors can do.

### Stats

At the top of the page, four numbers give a quick summary of what the config contains:

| Stat | What it counts |
|------|----------------|
| **Apps** | Homebrew casks (GUI apps) |
| **CLI** | Homebrew formulae (command-line tools) |
| **Dev** | Dev tool versions captured by `openboot snapshot` |
| **Installs** | Total times this config has been installed |

### Package Sections

Packages are displayed in four sections:

- **Applications** — Casks shown as a grid of cards, each linking to its Homebrew page
- **CLI Tools** — Formulae shown as clickable tags, each linking to its Homebrew page
- **NPM Packages** — npm globals shown as clickable tags, each linking to npmjs.com
- **Development Tools** — Tool versions captured by a snapshot (e.g. node 20.11, go 1.22)

Long lists are collapsed by default — a "Show all N →" button expands them.

### Configuration Details

Collapsible cards below the packages show what else will be applied during install:

| Card | Contents |
|------|----------|
| **Dotfiles Repository** | Git URL, linked to the repo. Deployed automatically via GNU Stow. |
| **Shell Setup** | Default shell, Oh My Zsh status, theme, and plugin list |
| **Git Configuration** | Name, email, and other settings from the captured snapshot |
| **Custom Installation Script** | Shell commands with syntax highlighting and a copy button |
| **Homebrew Taps** | Custom taps that will be added before packages install |
| **macOS Preferences** | System settings that will be applied, with domain and value |

Cards that don't apply to the config are hidden automatically.

### Fork

Click **Fork to Dashboard** to copy the config into your own account. The fork starts as unlisted and opens your dashboard so you can customize it. Requires a login — if you're not signed in, you'll be redirected to the login page first.

### Share

Click **Share** to open the share modal:

- **Copy Link** — copies `https://openboot.dev/username/slug` to the clipboard
- **Share on X** — opens a pre-filled tweet with the config name and URL

## Visibility

Every config has a visibility setting you can change in the dashboard:

| Visibility | Listed on Profile | Install URL | Config Page |
|------------|:-:|:-:|:-:|
| **Public** | Yes | Works for everyone | Viewable by anyone |
| **Unlisted** (default) | No | Works for everyone | Viewable with direct link |
| **Private** | No | Requires auth | Owner only |

### Installing Private Configs

Run `openboot login` first to authenticate, then install as usual:

```bash
openboot login
openboot install yourname/my-setup
```

## Short URLs

Config slugs are auto-generated, but you can edit them in the dashboard. Keep them short:

- `openboot.dev/yourname/ios` instead of `openboot.dev/yourname/ios-development-team-2024`
- `openboot.dev/yourname/ml` instead of `openboot.dev/yourname/machine-learning-setup`

## Install Tracking

Each config tracks the number of times it's been installed. The install count is visible on your dashboard and config page. This helps you understand which configs are most popular and widely used.
