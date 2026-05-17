# Harness engineering for openboot.dev

This document describes the **harness** around openboot.dev: the set of
controls that catch drift and steer both human and AI contributors toward
correct outputs. It is based on Martin Fowler's
[Harness Engineering for Coding Agents](https://martinfowler.com/articles/harness-engineering.html).

If you are adding a new control or reasoning about why an existing one
exists, start here.

## Mental model

> Agent = Model + Harness. The harness is everything you can change.

We can't change the underlying LLM. We can change what guidance it gets
*before* writing code (**feedforward**) and what feedback it gets *after*
(**feedback**). When a class of issue recurs, the right reaction is not
"tell the agent again" — it's to **encode the rule into the harness** so
the next agent (or the next refactor by a human) cannot drift the same way.

Two execution flavors:

- **Computational** — deterministic, fast, free: `eslint`, `svelte-check`,
  `vitest`, `src/archtest/*`. Run on every change.
- **Inferential** — non-deterministic, slower, paid: AI code review,
  `/security-review`, `/ultrareview`. Run on integration boundaries.

Three regulation categories:

1. **Maintainability** — code style, complexity, dead code.
2. **Architecture fitness** — project-specific invariants (the "do X, not Y"
   rules in CLAUDE.md).
3. **Behaviour** — does the code actually do the right thing.

## Where each control lives

| Category | Control | Trigger | File |
|---|---|---|---|
| Maint. | `prettier --check` | save / `npm run format:check` | `.prettierrc` |
| Maint. | `eslint` (ts/svelte) — `no-explicit-any`, `no-unused-vars`, `no-console`, `no-restricted-globals` (banned: `process`), Svelte best practices | `npm run lint` / `.claude/hooks/post-tool-use.sh` / CI | `eslint.config.js` |
| Maint. | `npm audit --audit-level=high` (drift) | informational CI | `.github/workflows/harness.yml` |
| Maint. | `knip` dead-code (drift) | informational CI | `.github/workflows/harness.yml` |
| Maint. | `required-checks alignment` (drift) — `.github/required-checks.txt` ↔ workflow job names | informational CI | `.github/workflows/harness.yml` |
| Arch. | `db-access-scoping` — `.prepare()` / `.exec()` / `.batch()` only in `+server.ts` or `src/lib/server/db/` | vitest (`src/archtest/`) | `src/archtest/db-access.test.ts` |
| Arch. | `no-process-env` — Cloudflare Workers uses `platform.env`, not `process.env` | vitest + eslint `no-restricted-globals` | `src/archtest/env.test.ts` + `eslint.config.js` |
| Arch. | `no-console-in-server` — server code uses `console.error` only (no `console.log`) | vitest | `src/archtest/server-console.test.ts` |
| Behav. | `svelte-check` (TypeScript across `.ts` and `.svelte`) | `npm run check` / `.claude/hooks/stop.sh` / CI | `tsconfig.json` |
| Behav. | `vitest run` (unit + smoke) | `npm test` / pre-push / CI | `vitest.config.ts` |
| Behav. | `vitest --coverage` → Codecov (informational) | CI | `.github/workflows/ci.yml` |
| Behav. | Contract schema validation against `openboot-contract` | CI `check` job + post-deploy | `.github/workflows/ci.yml` |
| Behav. | Post-deploy health check (`/api/health`) | CI `deploy` job | `.github/workflows/ci.yml` |
| Behav. | Post-deploy smoke test + contract round-trip | CI `deploy` job | `scripts/smoke-test-api.sh` |
| Feedfwd. | Agent conventions | every AI turn | `CLAUDE.md`, `AGENTS.md` |
| Feedfwd. | Session-start hook (warm `svelte-kit sync`) | every Claude session | `.claude/hooks/session-start.sh` |
| Feedfwd. | `ship-pr` skill — push → CI → review → triage → squash → cleanup; **no `--auto`** | model-loaded | `.claude/skills/ship-pr/SKILL.md` |
| Feedback (agent) | `eslint` on edited file | after every Edit/Write/MultiEdit | `.claude/hooks/post-tool-use.sh` |
| Feedback (agent) | `svelte-check` + `archtest` | end of every Claude turn (if ts/svelte dirty) | `.claude/hooks/stop.sh` |
| Maint. | `eslint` on staged diff + `prettier --check` | local git pre-commit | `scripts/hooks/pre-commit` |
| Behav. | `npm run validate` (lint + check + test + build) | local git pre-push | `scripts/hooks/pre-push` |
| Drift loop | Failed harness sensor → open/update GitHub issue | on main / nightly | `.github/workflows/drift-to-issue.yml` |
| Format | Conventional Commits subject check | push / PR | `.github/workflows/conventional-commits.yml` |

## The steering loop

When you observe a recurring issue, decide where to encode the fix:

| Observation | Encode it as |
|---|---|
| "Agent keeps using `as any` in production code." | Promote `@typescript-eslint/no-explicit-any` from `warn` to `error` in the relevant `files:` override. The rule is already wired; only the severity changes. |
| "Agent reads/writes D1 from a non-server file." | Already enforced by `src/archtest/db-access.test.ts`. Update the test if the allowed-paths list legitimately changes. |
| "Agent reaches for `process.env` on Cloudflare." | Already enforced by `eslint` `no-restricted-globals` + `src/archtest/env.test.ts`. |
| "Agent introduces a new lint failure that ESLint should have caught." | Enable the relevant rule in `eslint.config.js`. |
| "Agent breaks behaviour that has no test." | Write the test next to existing ones (`src/**/*.test.ts`). The pattern is vitest + happy-dom + the helpers in `src/lib/test/`. |
| "Agent missed a CLAUDE.md rule we keep restating." | Make it a lint rule or an archtest test. A docs rule that doesn't fail is a docs rule that drifts. |
| "Agent guessed at an API contract." | Update `openboot-contract` fixtures + schemas. CI runs schema validation against them in the `check` job and after deploy. |
| "Agent's PR description was off." | Tighten `.github/pull_request_template.md` (if added) or the `ship-pr` skill. |
| "Drift sensor failed on main but nobody noticed." | Already handled: `.github/workflows/drift-to-issue.yml` opens/updates a tracking issue per failed sensor. |

Rule of thumb: **if you reach for a doc edit, first ask whether a test or
lint rule would catch the same drift mechanically.** Mechanical wins
because it survives doc rot.

## Warn → error promotion queue

ESLint rules currently set to `warn` (so `validate` stays green on
existing code). Promote to `error` once the call sites are cleaned up,
ideally one rule per PR so the diff is reviewable:

| Rule | Why warn today | Promote when |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | ~30 occurrences in Svelte components and routes | Components are typed properly (most are `(p: any) =>` in `.map()`s with a known shape) |
| `@typescript-eslint/no-unused-vars` | ~20 leftover imports | One sweep with manual review |
| `svelte/require-each-key` | ~10 unkeyed `{#each}` blocks | Each route owns its fix |
| `svelte/no-navigation-without-resolve` | ~10 `<a href>` / `goto()` without `resolve()` | Svelte 5 routing migration |
| `svelte/prefer-svelte-reactivity` | `new Set()` instead of `SvelteSet` in 2 files | Replace inline |
| `no-useless-escape` | bash-template strings escape `\$` for shell interpolation | False-positive review — likely stay warn |

## What's intentionally NOT in the harness

- **No coverage gate that fails PRs.** Codecov is informational
  (`fail_ci_if_error: false`). Hard coverage gates push toward
  test-shaped code without raising actual quality.
- **No husky / lint-staged.** `scripts/hooks/` symlinked via
  `npm run install:hooks` does the same job in ~30 lines, no runtime dep.
- **No baseline file for archtest rules.** Repo is small enough to clean
  up violations directly when a new rule is added.
- **No agent-driven changes to `main` without human review.** All AI
  changes go through PR review and the existing CI matrix.
- **No auto-release / tag automation.** Push to `main` auto-deploys; there
  is no separate release cadence to automate.
- **No "stale baseline" sensor.** N/A while there are no baselines.

## How agents should think about this file

If you are reading this as an AI agent: this file tells you **where** to
add a control, not what to check. The actual checks fire from `npm run
validate`, the `.claude/hooks/`, and the CI jobs. The most useful
contribution you can make is, when a review reveals a recurring issue,
proposing the row in the table above where the new control belongs — that
is how the harness improves over time.
