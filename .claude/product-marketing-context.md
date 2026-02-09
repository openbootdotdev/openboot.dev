# OpenBoot — Product Marketing Context

## Product

**Name**: OpenBoot
**Tagline**: One-line macOS Development Environment Setup
**URL**: https://openboot.dev
**GitHub**: https://github.com/openbootdotdev/openboot
**License**: MIT (free, open source)
**Stage**: Pre-launch (Feb 2026)

**What it does**: Bootstraps a complete macOS dev environment in ~5 minutes via a single curl command. Interactive TUI for package selection, dotfiles deployment via GNU Stow, Oh-My-Zsh setup, and macOS preference tuning. Web dashboard at openboot.dev for creating/sharing custom configs.

**Install command**: `curl -fsSL https://openboot.dev/install.sh | bash`

## Tech Stack

- **CLI**: Go 1.24, Charmbracelet (bubbletea, bubbles, huh, lipgloss), Cobra
- **Web**: SvelteKit, Cloudflare Workers/Pages, D1 database
- **Auth**: GitHub OAuth
- **Distribution**: GitHub Releases (darwin-amd64, darwin-arm64 only)

## Core Features

- 3 curated presets: minimal (23 pkgs), developer (35 pkgs), full (50+ pkgs)
- 50+ tools across 13 categories (Essential, Git, Dev, DevOps, DB, AI/ML, Editors, Browsers, Terminals, Productivity, Utilities, Design, API/Debug)
- Smart install: skip already-installed, parallel CLI tools, sequential GUI apps
- Interactive TUI with searchable package selector
- Dotfiles via GNU Stow
- Oh-My-Zsh + aliases
- macOS developer-friendly preferences
- Snapshot: capture existing setup
- Web dashboard: create custom configs, import Brewfile, duplicate configs, share via short URL
- Dry-run, doctor, update, resume commands
- Silent mode for CI/automation

## Target Audience

**Primary**: Individual developers setting up a new Mac
**Secondary**: Team leads onboarding new engineers
**Tertiary**: DevOps/platform engineers standardizing environments

## Positioning

**Primary**: "Set up your Mac in one command — not one afternoon"
**vs Strap**: OpenBoot adds web dashboard + team sharing + dotfiles + custom scripts
**vs Chezmoi**: OpenBoot handles packages + dotfiles + scripts (chezmoi is dotfiles-only)
**vs nix-darwin**: OpenBoot is simple (no Nix language learning curve)
**vs Brewfile**: OpenBoot adds dotfiles + scripts + TUI + web dashboard + team sharing

**Unique differentiator**: Only tool combining one-curl setup + web dashboard + team config sharing + Homebrew + dotfiles + custom scripts with a low learning curve.

## Competitive Landscape

| Tool | Status | Packages | Dotfiles | Scripts | Team Sharing | Web UI | Learning Curve |
|------|--------|----------|----------|---------|--------------|--------|----------------|
| OpenBoot | Active | Yes | Yes | Yes | Yes | Yes | Low |
| Strap | Maintained | Yes | No | No | No | No | Low |
| Chezmoi | Active | No | Yes | Yes | No | No | High |
| nix-darwin | Active | Yes | Yes | Yes | No | No | Very High |
| Dotbot | Active | No | Yes | Yes | No | No | Low |
| Brewfile | Official | Yes | No | No | No | No | Low |
| Boxen | Dead (2018) | Yes | Yes | Yes | Yes | No | High |

## Business Model

Free / open source. No monetization planned currently. Potential future: freemium with paid team tier.

## Current Channels

**Owned**: openboot.dev (landing page, docs, dashboard)
**Rented**: Twitter/X account, Product Hunt account
**Borrowed**: None yet

## Marketing Assets Inventory

| Asset | Status |
|-------|--------|
| Landing page | Done (strong messaging, 8 value props, terminal mockup) |
| Documentation | Done (6 sections: getting started, presets, custom configs, snapshot, CLI ref, FAQ) |
| GitHub README | Needs polish (add demo GIF, better structure) |
| OG tags / social preview | Missing |
| Twitter Cards | Missing |
| Sitemap | Missing |
| Demo video/GIF | Missing |
| Blog | Missing |
| Changelog | Missing |
| Email capture | Missing |
| Analytics | Intentionally none (privacy-first positioning) |

## Key Messaging

**For HN/Reddit**: "I got tired of spending 3 hours setting up every new Mac. So I built OpenBoot."
**For Product Hunt**: "Set up your macOS dev environment in 5 minutes"
**Privacy angle**: "No analytics. No telemetry. Your data stays on your machine."
**Open source angle**: "100% open source, MIT licensed"

**Anticipated objections**:
- "Why not just use a Brewfile?" — OpenBoot adds dotfiles + scripts + TUI + web dashboard + skip-already-installed + team sharing
- "Is curl | bash safe?" — Script is open source, inspectable, MIT licensed
- "Why macOS only?" — Focused on doing one platform really well

## Launch Channels (Priority Order)

1. Hacker News (Show HN) — technical credibility
2. Product Hunt — reach + validation
3. Reddit (r/macapps, r/commandline, r/programming) — community
4. Twitter/X — ongoing engagement
5. DEV.to — developer audience

## Pre-Launch Gaps (Critical)

1. OG meta tags + social preview image (every share looks broken without this)
2. Demo GIF in GitHub README (top driver of GitHub stars)
3. Polished README structure for launch traffic

## Requirements / Constraints

- macOS 12+ (Monterey or later)
- Apple Silicon + Intel supported
- Don't use Go's default HTTP client for Cloudflare Workers (causes EOF)
- Don't install casks in parallel (password prompts)
- Privacy-first: no analytics, no telemetry
- Comments in code are discouraged
