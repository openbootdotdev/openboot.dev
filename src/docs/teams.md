---
title: For Teams
group: Use Cases
order: 8
---

# For Teams

## The Doc

Every team has one. A Google Doc titled "Dev Environment Setup" with 47 steps, last edited eight months ago by someone who's since left. Step 12 says "install Node 18" but the project moved to 22 in March. Step 23 says "ask Sarah for the .env template." Sarah doesn't know what you're talking about. Step 31 references a Homebrew package that's been renamed.

New hire spends two days on this. Senior dev spends half a day answering the same setup questions for the fourth time this quarter. The team lead knows the doc is broken but hasn't updated it in months because who has time to maintain 47 steps.

OpenBoot replaces The Doc with one command.

## First day, first commit

Your new hire opens the `CONTRIBUTING.md`. Step one:

```bash
curl -fsSL https://openboot.dev/acme/frontend/install.sh | bash
```

That's the entire setup section. They run it and go read the architecture docs while packages stream by:

```text
✓ Homebrew installed
✓ node (22.0.0) · pnpm (9.1.0) · docker · mass-installing...
✓ visual-studio-code · arc · orbstack
✓ Oh-My-Zsh configured · macOS preferences applied
✓ Running post-install script...
✓ git clone acme/webapp → ~/acme/webapp
✓ git clone acme/api → ~/acme/api
✓ .env.example → .env (webapp, api)
✓ pnpm install (webapp, api)
✨ Setup complete. Restart your terminal.
```

Twenty minutes. They open `~/acme/webapp`, run `pnpm dev`, see the app in the browser. They push a fix to a typo they spotted in the README before lunch.

The custom script at the end is what makes this work — it's not just "install your tools," it's "be ready to code." Repo cloning, `.env` files from templates, `pnpm install` — everything that used to live in The Doc is now automated and identical for everyone. See [Config Options](/docs/config-options) for the full custom script reference.

## How the one-liner gets created

The team lead spends 30 minutes building the config. In exchange, every new hire for the next two years skips two days of setup.

There are two ways to create the config:

**Snapshot a reference machine.** If someone on your team already has the ideal setup:

```bash
openboot snapshot
```

OpenBoot scans their Homebrew packages, macOS preferences, shell config, and git settings. A TUI editor opens where they uncheck personal tools — Spotify, 1Password, the personal notes app — and keep only what the team needs. Name it, upload it, done.

**Build from scratch in the [Dashboard](/dashboard).** Click **Create Config**, pick `developer` as the base, add `pnpm` and `playwright`, remove `postman`, set the slug to `frontend`. Five minutes of clicking.

Either way, you end up on the same config page. Now comes the part most teams skip — and shouldn't.

### The custom script

This is the difference between "install your tools" and "be ready to code." Click into the config and add a post-install script:

```bash
# Clone team repos
mkdir -p ~/acme
git clone git@github.com:acme/webapp.git ~/acme/webapp
git clone git@github.com:acme/api.git ~/acme/api

# Local env files from templates
cp ~/acme/webapp/.env.example ~/acme/webapp/.env
cp ~/acme/api/.env.example ~/acme/api/.env

# Install project dependencies
cd ~/acme/webapp && pnpm install
cd ~/acme/api && pnpm install
```

This runs after all packages are installed, so `git`, `pnpm`, and every other tool the script depends on are already available. Every step that used to be "ask someone" or "check the wiki" is now code that runs itself.

### Share it

Add the install command to your `CONTRIBUTING.md`:

```markdown
## Development Setup

    curl -fsSL https://openboot.dev/acme/frontend/install.sh | bash

Or install via Homebrew:

    brew tap openbootdotdev/tap && brew install openboot
    openboot --user acme/frontend

Preview first: `openboot --user acme/frontend --dry-run`
```

The URL never changes. When the stack changes, update the config in the [Dashboard](/dashboard). Everyone who runs the command next gets the latest version. No more editing a 47-step Google Doc.

Want to show your tech stack to candidates? Add the config URL to your README or job posts. They see exactly what they'd be working with.

Set visibility to **unlisted** (URL works, but not listed publicly) or **private** (requires authentication) depending on your needs. See [Custom Configs](/docs/custom-configs) for details.

## Multiple teams, one system

Company grows. Backend needs Go, PostgreSQL, Redis. DevOps needs kubectl, helm, k9s. Create separate configs:

```text
openboot.dev/acme/frontend   → Node, pnpm, Playwright
openboot.dev/acme/backend    → Go, PostgreSQL, Redis
openboot.dev/acme/devops     → kubectl, helm, k9s, awscli
```

Each has its own custom script. Backend clones the API monorepo and seeds the local database. DevOps sets up `kubectl` contexts.

Full-stack dev working across teams? Run both. OpenBoot skips what's already installed.

```bash
openboot --user acme/frontend
openboot --user acme/backend
```

## Keeping everyone in sync

Three months in. Someone reports a bug. Only reproduces on their machine. Team calls, tries everything — clear caches, restart Docker, check env vars. An hour later, someone asks "what Node version?" They're on 18. Everyone else is on 22.

This is drift. Have everyone run `openboot snapshot`, compare output. You'll find what you didn't know — someone never installed `playwright`, a contractor is on old OrbStack, two people have local `postgresql` while everyone else uses Docker.

Update the team config, ping Slack, everyone re-runs. Back in sync.

Six months from now, you upgrade to Node 24. Update the config. Everyone pulls it down on their next sync. No announcement. No "did everyone update yet?" in Slack. The config is the truth.

## What's Next

- [Presets](/docs/presets) — pick your base
- [Custom Configs](/docs/custom-configs) and [Config Options](/docs/config-options) — full config reference
- [Snapshot](/docs/snapshot) — capture a reference machine
