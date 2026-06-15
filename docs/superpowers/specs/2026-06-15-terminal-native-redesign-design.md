# Terminal-native redesign — design spec

**Date:** 2026-06-15
**Status:** Approved (vibe confirmed via `design-demo/` prototype)
**Scope:** Whole-site visual redesign (home, explore, config cards, docs, header, footer, shared shell)

## 1. Direction

Refined, terminal-native identity executed with **restraint** — the register is "high-end,
textured, not flashy, no AI-smell," in the spirit of Vercel / pi.dev. Fully monospace, dark-first
with a deliberate light mode. The terminal is the brand's visual *language* (prompts, carets, mono,
command-style labels), not literal cosplay — sections are clean web layouts with **one** real
terminal window as the signature moment.

**Anti-goals (the "AI-smell" to avoid):** purple/blue gradients, gradient blobs, heavy neon glows,
over-rounded everything, evenly-distributed timid color, flat digital surfaces, emoji UI.

**Reference prototype:** `design-demo/index.html` (throwaway). The production build reproduces this
look using the project's CSS-variable system and Svelte components. The demo is the source of truth
for the visual target.

## 2. Design tokens

Re-map values onto the **existing** token names in `src/lib/styles/variables.css` (so components
don't all need editing), and add the new tokens listed. Pure white text is intentionally retired in
favor of a soft off-white for a premium feel.

### Dark (default)
```
--bg-primary:   #0a0a0b      (was #0a0a0a)
--bg-secondary: #100f12      surface (cards, terminal, command box)
--bg-tertiary:  #161519      surface-2 (code blocks, raised)
--bg-hover:     #1b1a1f
--text-primary: #ededf0      soft white, not #ffffff
--text-secondary:#9a99a2
--text-muted:   #5b5a63
--accent:       #4ec98a      refined mint (was neon #22c55e)
--accent-hover: #6ad9a0
--accent-glow:  rgba(78,201,138,0.10)   (lower than before)
--border:       #1f1e22
--border-hover: #2c2b30
--code-bg:      #161519
--header-bg:    rgba(10,10,11,0.78)
--danger:       #d4655c      refined red
--danger-hover: #c0473d
/* new */
--accent-deep:  #2f6b4d      muted prompt / subtle ring
--amber:        #c9a14e      secondary terminal color (warnings/steps)
--shadow:       rgba(0,0,0,0.5)
--vignette:     color-mix(in srgb, var(--bg-primary) 55%, #000)
--grain-blend:  soft-light
--grain-opacity:0.05
```

### Light ("paper terminal")
```
--bg-primary:   #fafaf8      warm off-white (was stark #ffffff)
--bg-secondary: #ffffff
--bg-tertiary:  #f3f3f0
--bg-hover:     #ecece7
--text-primary: #18181b
--text-secondary:#5b5b60
--text-muted:   #909095
--accent:       #1c7d52      deep green, AA on light
--accent-hover: #176343
--accent-glow:  rgba(28,125,82,0.08)
--border:       #e7e7e2
--border-hover: #d6d6cf
--code-bg:      #f3f3f0
--header-bg:    rgba(250,250,248,0.78)
--danger:       #c0473d
--danger-hover: #a83a31
/* new */
--accent-deep:  #cde7d9
--amber:        #946a1a
--shadow:       rgba(20,20,30,0.10)
--vignette:     transparent
--grain-blend:  multiply
--grain-opacity:0.035
```

## 3. Typography — fully monospace

- **Family:** Geist Mono (primary) → JetBrains Mono (fallback, already loaded) → system mono.
  Add a `--font-mono` token; set it as the global body font.
- **Loading:** In `src/app.html`, replace the `Outfit` Google Fonts request with `Geist Mono`
  (weights 400/500/600). Keep `JetBrains Mono`. Outfit is removed entirely.
- **Hierarchy comes from size / weight / color / case** (one family, no font-switching):

| Role | Size | Weight | Tracking | Notes |
|------|------|--------|----------|-------|
| Display (h1) | clamp(2.3rem, 4.6vw, 3.7rem) | 500 | -0.04em | line-height 1.04 |
| h2 | 1.7rem | 500 | -0.025em | |
| h3 | ~1rem | 500 | -0.01em | |
| Body | 0.94rem | 400 | — | line-height 1.7, max-width ≤ 54–62ch |
| Label / eyebrow | 0.72–0.8rem | 400/500 | 0.02–0.1em | often lowercase or `#`/`>`-prefixed, uppercase for footer col heads |

**Fully-mono readability guardrails (hard rules):** body line-height ≥ 1.7; text measure ≤ 62ch;
body size ≥ 15px (0.94rem). These keep mono prose comfortable.

## 4. Texture, depth & motion

- **Film grain:** fixed full-viewport SVG fractal-noise overlay (`body::after`), `mix-blend-mode`
  and opacity per `--grain-blend` / `--grain-opacity`. This is the primary "texture." Add to the
  layout shell.
- **Vignette:** subtle radial darkening at page edges in dark mode only (`--vignette`); transparent
  in light.
- **Grid:** faint graph-paper grid behind the hero only, radial-masked, ~0.4 opacity. Not site-wide.
- **Depth:** hairline 1px borders + soft low shadows (`--shadow`). No large lifts, no neon.
- **Motion:** 150–250ms ease-out. Hover = border brightens + faint `--accent-glow` ring + ≤1px
  nudge. One on-scroll reveal (fade + 8px rise, once). Hero terminal auto-types. **All motion
  (typing, reveals, caret) disabled under `prefers-reduced-motion`** — terminal renders final state.

## 5. Component / file changes

Project uses **pure CSS + scoped `<style>` + CSS variables**, no Tailwind. Footer currently lives in
`src/routes/+page.svelte`.

| File | Change |
|------|--------|
| `src/lib/styles/variables.css` | New token values + added tokens (§2). |
| `src/app.html` | Swap Outfit→Geist Mono in the fonts link. |
| `src/routes/+layout.svelte` | Global body font → `--font-mono`; add grain + vignette overlays; base type rhythm; `prefers-reduced-motion` reset. |
| `src/lib/components/SiteHeader.svelte` | Terminal status-bar style: `$ openboot` (green prompt), lowercase mono nav, `★ 256`, refined ☾/☀ toggle, hairline border + blur. |
| `src/routes/+page.svelte` | Hero (mono display headline w/ green on key phrase, `#`-eyebrow, ✓ list, hairline click-to-copy command box w/ caret, signature auto-typing terminal, masked grid bg); How It Works (prompt header `> how it works`, hairline-divided 4-cell grid, quiet `01–04`, hover fill); Footer (`openboot $ _` prompt + caret, mono link columns, legal line). Tighten section rhythm. |
| `src/routes/explore/+page.svelte` | `> explore` prompt header; mono sort control; raise muted-text contrast; spacing rhythm. |
| `src/lib/components/ConfigCard.svelte` | Mono throughout; keep colored top accent but unify into the terminal language; green stats; badges as `[featured]`/`[official]`; bottom install line w/ copy; hover = border + faint glow. |
| Docs styles (mdsvex/docs layout) | Mono prose w/ readability guardrails; code blocks on `--bg-tertiary` w/ left green border; sidebar active item w/ `>` marker. |

## 6. Accessibility

- All text/background pairs meet **WCAG AA** (the new `--text-muted` and light-mode `--accent` are
  chosen for this; verify with a contrast check during build).
- Full `prefers-reduced-motion` support (§4).
- Keep keyboard focus styles; command/terminal copy actions remain reachable.

## 7. Quality (non-visual, in-scope)

- Investigate & fix the **2–3 console errors** seen on the live site during this pass.

## 8. Out of scope / non-goals

- No new pages, features, or copy rewrites beyond micro-labels (prompts, eyebrows). Marketing
  copywriting is a separate effort.
- No backend / API / DB changes.
- No framework or build-system changes (still SvelteKit + scoped CSS, no Tailwind).
- `design-demo/` is a throwaway and is removed (or git-ignored) before merge.
- Self-hosting Geist Mono (vs Google Fonts) is a possible later perf optimization, not this pass.

## 9. Success criteria

- Home, explore, docs, header, footer, config cards all render in the new terminal-native system,
  dark + light, both deliberate.
- `npm run validate` (check + lint + test) passes.
- Visual parity with the approved `design-demo/` look on the home page.
- No remaining console errors on the main pages.
- Target subjective quality: ~9/10 per the original critique's gap list, all six gaps closed.
