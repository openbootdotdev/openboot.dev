---
name: ship-pr
description: Ship a finished openboot.dev change through the canonical pull-request flow. Use when the user asks to open, submit, or ship a PR/MR for the current branch, including phrases such as "open a PR", "ship this", "提 PR", or "提个 MR". Push, open the PR, wait for CI, review the full diff, fix small findings, escalate product decisions, squash-merge a clean PR, and clean up locally. Do not use for status checks on an existing PR or for draft/WIP work.
---

# Ship a PR for openboot.dev

Treat the PR review as the last reversible gate before `main` deploys.

Do not use auto-merge. Complete CI and review before merging from the current
session.

## Check the branch

Run:

```bash
git status -sb
git rev-parse --abbrev-ref HEAD
git log --oneline main..HEAD
```

Stop if the branch is `main` or has no commits ahead of `main`. Account for all
working-tree changes before shipping.

For draft/WIP work, use a draft PR and stop. For a backwards-incompatible D1
migration, verify it locally and ask for the rollout decision before proceeding.

## Push and open the PR

Push the current branch:

```bash
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
```

The installed pre-push hook runs `npm run validate`; CI remains the gate when
the hook is not installed.

Create a PR with a Conventional Commits title under 70 characters. Summarize
the change and list the actual local verification in the body.

## Wait for CI

Run:

```bash
gh pr checks --watch
```

Require the checks listed in `.github/required-checks.txt`. If a required check
fails, inspect it with `gh run view --log-failed`, fix failures that have an
unambiguous solution, push, and wait again. Escalate failures that require a
product or rollout decision. Treat harness drift sensors as informational unless
repository policy changes.

## Review the full diff

After CI passes, review `git diff main...HEAD` for behavior, design, tests,
risk, and rollback. In particular, check:

- D1 access boundaries and parameter binding.
- API contract alignment with `openboot-contract`.
- Forward-only D1 migrations.
- Round trips for fields that flow CLI -> server -> CLI.
- New warnings, missing tests, and unexpected generated files.

Fix small, clear issues in the current session, commit them, push, and wait for
CI again. Escalate choices that depend on product intent or team convention.
Merge without asking for another confirmation when the PR is clean.

## Merge and clean up

Run:

```bash
gh pr merge --squash --delete-branch
git checkout main
git pull --ff-only
```

Delete the local feature branch if it still exists. Do not roll back a failed
deployment, change the separate `openboot-contract` repository, or alter
production secrets without explicit direction.
