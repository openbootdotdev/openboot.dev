---
title: Custom Configs
group: Features
order: 5
---

# Custom Configs

Build your own setup, save it on openboot.dev, and share it as a one-line install command. Anyone with the URL can install your exact environment.

## Creating a Config

1. **Sign in** with GitHub — click **Login** in the header (no email/password needed)
2. Go to your **[Dashboard](/dashboard)**
3. Click **Create Config**
4. Pick a **base preset** (`minimal`, `developer`, or `full`) as your starting point
5. **Add or remove packages** using the search
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

Every config gets a URL:

```
curl -fsSL https://openboot.dev/sarah/frontend-team/install.sh | bash
```

Put it in your README, onboarding docs, or Slack. One command, same environment for everyone.

You can also install via the CLI directly:

```
openboot --user sarah/frontend-team
```

## Visibility

Every config has a visibility setting you can change in the dashboard:

| Visibility | Listed on Profile | Install URL | Config Page |
|------------|:-:|:-:|:-:|
| **Public** | Yes | Works for everyone | Viewable by anyone |
| **Unlisted** (default) | No | Works for everyone | Viewable with direct link |
| **Private** | No | Requires auth | Owner only |

### Installing Private Configs

**Via `curl | bash`** — the install script automatically opens your browser for authorization, then proceeds with the install:

```
curl -fsSL https://openboot.dev/yourname/my-setup/install.sh | bash
```

**Via the CLI** — run `openboot login` first, then use `--user` as usual. The CLI sends your auth token automatically:

```
openboot login
openboot --user yourname/my-setup
```

## Short URLs

Config slugs are auto-generated, but you can edit them in the dashboard. Keep them short:

- `openboot.dev/yourname/ios` instead of `openboot.dev/yourname/ios-development-team-2024`
- `openboot.dev/yourname/ml` instead of `openboot.dev/yourname/machine-learning-setup`
