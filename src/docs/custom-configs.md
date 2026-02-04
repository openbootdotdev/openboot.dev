# Custom Configurations

Custom configs let you create, save, and share your own package selections. They're stored on openboot.dev and can be installed by anyone with the URL.

## Create an Account

Sign in with GitHub OAuth — click **Login** in the header or visit the dashboard directly. No email/password required.

## Using the Dashboard

Once logged in, go to your **Dashboard** to manage configs.

### Creating a Config

1. Click **Create Config**
2. Enter a **name** (e.g., "frontend-team") and optional **description**
3. Choose a **base preset** (minimal, developer, or full) as your starting point
4. Add or remove individual packages using the package search
5. Save your config

### Config Options

Each config supports:

- **Homebrew formulae** — CLI tools installed via `brew install`
- **Homebrew casks** — GUI apps installed via `brew install --cask`
- **Custom scripts** — Shell commands that run after package installation (e.g., setting up SSH keys, cloning repos)
- **Dotfiles repo** — A Git URL to your dotfiles repository that gets cloned and stowed
- **macOS preferences** — Whitelisted system settings (Dock autohide, key repeat speed, etc.)

### Import from Brewfile

Already have a Brewfile? Upload it in the dashboard and OpenBoot will parse it into a config. All `brew` and `cask` entries are extracted and mapped to the config format.

## Sharing Configs

Every config gets a shareable install URL:

```
curl -fsSL openboot.dev/<username>/<slug>/install | bash
```

For example, if your GitHub username is `sarah` and your config is named `frontend-team`:

```
curl -fsSL openboot.dev/sarah/frontend-team/install | bash
```

Share this URL in your team's README, onboarding docs, or Slack. Anyone who runs it gets your exact setup.

## Public vs Private Configs

- **Public** (default) — anyone can view and install your config
- **Private** — only you can see the config in the dashboard, but the install URL still works if someone has it

## Custom URL Aliases

Config slugs are auto-generated from the config name, but you can edit them in the dashboard. Keep them short and memorable:

- `openboot.dev/yourname/ios` instead of `openboot.dev/yourname/ios-development-team-2024`
- `openboot.dev/yourname/ml` instead of `openboot.dev/yourname/machine-learning-setup`
