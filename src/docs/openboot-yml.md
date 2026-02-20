---
title: .openboot.yml Reference
description: Full schema for .openboot.yml — the project-level config used by `openboot init` to install packages, set env vars, and run setup scripts.
group: Reference
order: 11
---

# `.openboot.yml` Reference

`.openboot.yml` is a project-level config file that tells `openboot init` what to install and how to set up the development environment for a specific project. Commit it alongside your code so everyone on the team gets the same setup with one command.

## Full Example

```yaml
version: "1.0"

brew:
  taps:
    - homebrew/cask-fonts
  packages:
    - git
    - node@20
    - go
    - jq
    - ripgrep
  casks:
    - visual-studio-code
    - docker

npm:
  - typescript
  - eslint
  - prettier

env:
  NODE_ENV: development
  API_URL: http://localhost:3000

init:
  - npm install
  - cp .env.example .env
  - npm run db:migrate

verify:
  - node --version
  - npm --version
  - git --version
  - docker --version
```

## Fields

### `version`

Schema version. Currently the only valid value is `"1.0"`.

- **Type:** string
- **Required:** yes
- **Value:** `"1.0"`

### `brew`

Homebrew packages to install. All three sub-fields are optional.

#### `brew.taps`

Homebrew taps to add before installing packages. Use this for packages that live outside the default Homebrew registry.

- **Type:** list of strings
- **Example:** `["homebrew/cask-fonts", "stripe/stripe-cli"]`

#### `brew.packages`

Homebrew formulae (CLI tools) to install via `brew install`.

- **Type:** list of strings
- **Example:** `["git", "node@20", "ripgrep", "jq"]`

#### `brew.casks`

Homebrew casks (GUI apps) to install via `brew install --cask`.

- **Type:** list of strings
- **Example:** `["visual-studio-code", "docker", "tableplus"]`

### `npm`

Global npm packages to install via `npm install -g`. Only runs if npm is available on the system.

- **Type:** list of strings
- **Example:** `["typescript", "eslint", "prettier"]`

### `env`

Environment variables to display after packages install. OpenBoot prints these with suggested export commands — it does not write them to any file automatically.

- **Type:** key-value map
- **Example:**

```yaml
env:
  NODE_ENV: development
  DATABASE_URL: postgres://localhost:5432/mydb
```

### `init`

Shell commands to run after packages are installed. Each command runs from the project directory in sequence. Use this for `npm install`, copying config files, running migrations, etc.

- **Type:** list of strings
- **Runs as:** individual shell commands from the project directory
- **On failure:** init stops at the first failing command

```yaml
init:
  - npm install
  - cp .env.example .env
  - npm run db:migrate
```

### `verify`

Shell commands to run as a final check. Each command is expected to exit with code 0. All commands run regardless of earlier failures, and results are summarized at the end.

- **Type:** list of strings
- **On failure:** reports which checks failed but does not undo prior steps

```yaml
verify:
  - node --version
  - docker --version
  - psql --version
```

## Placement

The file must be named `.openboot.yml` and placed in the project root. When running `openboot init /path/to/project`, OpenBoot looks for `.openboot.yml` at that path.

## Usage

```bash
# From the project directory
openboot init

# From anywhere, pointing at the project
openboot init ~/projects/my-app

# Preview without installing
openboot init --dry-run

# Non-interactive (for CI/CD)
openboot init --silent
```

See [CLI Commands](/docs/cli-reference#set-up-a-project-environment) for all `openboot init` flags.
