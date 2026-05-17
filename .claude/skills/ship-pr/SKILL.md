---
name: ship-pr
description: Use when the user wants to open a pull request for the current branch — phrases like "open a PR", "ship this", "submit PR", "let's send it", "提 PR", "提个 MR". Walks the canonical post-edit flow: push → open PR → wait for CI → review the diff → triage findings (self-fix small issues, escalate decisions, merge directly when clean) → local cleanup. Trigger any time the user signals they're done editing and want the change on its way to main. Do NOT trigger for `gh pr view` / status checks on existing PRs.
---

# Ship a PR for openboot.dev

This is the canonical way to move a finished change from a feature branch
to `main`. Push to `main` auto-deploys — so the PR review gate is the
last reversible step.

The mechanical gate is GitHub Actions (`ci.yml` `check` job +
`conventional-commits.yml`). This skill adds the **inferential** gate on
top: once CI is green, the diff gets reviewed, findings are surfaced,
and merge happens after the user OKs it.

**Auto-merge is intentionally not used.** `gh pr merge --auto` skips the
review step entirely. The merge command is run from this session, after
the user confirms.

## When to use

Trigger when the user says they're done with a change and want a PR.
Do **not** use this for:

- Draft PRs / WIP work. Use plain `gh pr create --draft` and stop.
- Changes that flip live behaviour without a feature flag — those need a
  staging plan, not a merge.
- Wrangler / D1 schema migrations that aren't backwards-compatible — verify
  on `--local` first, ask the user about the rollout sequence.

## The flow

### Step 1 — Confirm the branch is shippable

```bash
git status -sb                       # clean except expected diff?
git rev-parse --abbrev-ref HEAD      # not on main
git log --oneline main..HEAD         # commits actually exist
```

If the branch is `main`, stop — make a feature branch first. If there
are no commits ahead of `main`, stop — nothing to ship.

### Step 2 — Push

```bash
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
```

The `pre-push` hook (installed via `npm run install:hooks`) runs `npm
run validate` here automatically — no need to run it manually. If the
hook is not installed, that's the user's choice; CI will still gate.

### Step 3 — Open the PR

```bash
gh pr create --title "<conventional commit subject>" --body "$(cat <<'EOF'
## Summary

- <bullet 1>
- <bullet 2>

## Test plan

- [ ] <how you verified locally>
- [ ] <what to check after deploy if relevant>
EOF
)"
```

Title rules (from CLAUDE.md):
- Conventional Commits prefix: `feat:` / `fix:` / `docs:` / `refactor:`
  / `test:` / `chore:` / `ci:` / `perf:` / `style:` / `build:` / `revert:`.
- Optional scope: `fix(api):`, `feat(editor):`, etc.
- Keep under 70 chars. Detail goes in the body.

### Step 4 — Wait for CI

```bash
gh pr checks --watch
```

Blocks until every check finishes. Typical wall time is 3–8 min. The
required checks per `.github/required-checks.txt`:

- `check` (type check + tests + build + contract schema validation)
- `validate-commits`

If a required check fails:
- **Stop. Do not proceed to review or merge.**
- Read the failure (`gh run view --log-failed`), explain it to the
  user, and ask whether to fix it now.
- Drift sensors (`harness.yml`) failing is informational — flag them
  but do not block. They surface as a separate (non-required) status.

### Step 5 — Review the diff

Once CI is green, review the **full PR diff**: `git diff main...HEAD`.
CI catches mechanical violations; this catches the rest — behaviour,
design, test coverage, risk, rollback. Pay attention to:

- Anything reaching `env.DB` or `platform.env` outside an allowed path
  (`src/lib/server/**` or `+server.ts`) — archtest should have caught
  this, but double-check.
- New ESLint warnings — note them in the PR description if any.
- API contract changes — must align with `openboot-contract`.
- DB schema changes — check the migration is forward-only (D1 has no
  `DROP COLUMN`, see CLAUDE.md).
- Round-trip behaviour for fields that flow CLI → server → CLI (the
  recent `macos_prefs[].host` regression came from one side stripping
  a field; a quick GET-after-PUT mental check catches the pattern).

### Step 6 — Triage findings

Three buckets, decide for each:

- **Self-fix small stuff** in this session: typo, missing test, obvious
  refactor, missed null check. Commit, push, wait for CI again.
- **Escalate decisions to the user**: anything where the answer depends
  on product intent or team convention. Quote the file/line, state the
  option, ask.
- **Merge directly when clean**: zero findings or only nits-deferred-to-
  follow-up. Do not ask "want me to merge?" — the loop closes itself.

### Step 7 — Merge

```bash
gh pr merge --squash --delete-branch
```

Squash because the project uses Conventional Commits at the merge-commit
level, not the in-branch commits. `--delete-branch` cleans up the remote
ref. CI then auto-deploys.

### Step 8 — Local cleanup

```bash
git checkout main && git pull --ff-only
git branch -D <feature-branch>
```

Return to a clean main with the merged work pulled. Skip
`git branch -D` if you already deleted it as part of the merge.

## What this skill does NOT do

- Roll back a deploy. If `/api/health` fails after merge, that's a
  `wrangler rollback` decision — ask the user.
- Trigger a release. There is no separate release; push to main IS the
  release.
- Update `openboot-contract`. That's a separate repo; if the contract
  needs to change, coordinate with the CLI repo's matching PR first.
