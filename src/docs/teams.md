---
title: For Teams
group: Use Cases
order: 8
---

# For Teams

Standardize your team's dev environment so every developer — new or existing — works with the same tools, same versions, same config.

## The Problem

Without a standard setup, you get:

- "Works on my machine" — different tool versions, missing dependencies
- Onboarding takes hours or days — "install this, then that, then configure..."
- Tribal knowledge — setup steps live in someone's head, not in docs

## The Solution

Create one config. Share one command. Everyone gets the same environment.

## Step by Step

### 1. Create Your Team Config

**Option A — Build from scratch:** Go to the [dashboard](/dashboard), create a new config, pick a base preset, and add your team's tools.

**Option B — Snapshot a reference machine:** If a team member already has the ideal setup, have them run:

```
openboot snapshot
```

This captures their Homebrew packages, shell config, and macOS preferences, then uploads it as a config.

### 2. Customize

In the dashboard, refine the config:

- Add project-specific tools (e.g., `kubectl`, `terraform`, `pnpm`)
- Remove personal preferences (e.g., a specific browser or notes app)
- Add a **custom script** for team-specific setup (clone repos, configure credentials, etc.)
- Set a **dotfiles repo** if your team shares one
- Give it a memorable slug like `frontend` or `backend-api`

### 3. Share

Every config gets installation instructions. Recommend Homebrew + CLI flag:

```bash
brew tap openbootdotdev/tap && brew install openboot
openboot --user yourteam/frontend
```

Or provide the one-line installer as an alternative:

```bash
curl -fsSL https://openboot.dev/yourteam/frontend/install.sh | bash
```

Put these in your:

- **README.md** — under "Getting Started" or "Development Setup"
- **Onboarding checklist** — as the first step
- **Slack / Teams channel** — pinned for easy access

### 4. New Developer Joins

They run the install command. That's it.

OpenBoot handles Homebrew, installs all packages, sets up their shell, clones dotfiles, and applies macOS preferences. They're ready to code in minutes, not hours.

## Tips

**Keep the config updated.** When your stack changes (new tool, version bump, removed dependency), update the config in the dashboard. The install URL stays the same.

**Use Snapshot for audits.** Periodically have team members run `openboot snapshot --json` to compare their environments against the team config.

**Multiple configs are fine.** Frontend team and backend team might need different tools. Create separate configs:

```
openboot.dev/yourteam/frontend
openboot.dev/yourteam/backend
openboot.dev/yourteam/devops
```

**Preview before installing.** New team members can preview what they'd get:

```bash
openboot --user yourteam/frontend --dry-run
```
