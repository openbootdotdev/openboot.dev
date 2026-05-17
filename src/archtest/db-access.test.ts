import { describe, it, expect } from 'vitest';
import { walkSourceFiles, collectViolations, formatViolations } from './walk';

// CLAUDE.md: "DB access: Only in +server.ts files".
// Extended in practice: server-only helpers under `src/lib/server/`
// (auth, db query helpers) may access D1 too — concentrating SQL there
// is the established pattern. Client-side code (Svelte components,
// stores, browser-side lib) must not.
//
// If you have a legitimate reason to query D1 from a new path, add it
// to `allowedPathPrefixes` below and explain why in your commit message.
const allowedPathPrefixes = ['src/lib/server/'];
const allowedFileSuffix = '+server.ts';

describe('archtest: D1 access scoping', () => {
	it('only +server.ts and src/lib/server/db/ may call .prepare/.exec/.batch on the DB', () => {
		const files = walkSourceFiles(['.ts', '.svelte']);
		// Match `<something>.prepare(` / `.exec(` / `.batch(` where the
		// LHS plausibly refers to a D1Database. The regex is intentionally
		// loose — we accept some false positives in exchange for catching
		// `env.DB.prepare()` / `platform.env.DB.prepare()` / `db.prepare()`
		// reliably. The predicate below applies the real filter.
		const pattern = /\b(?:env\.DB|platform(?:\.env)?\.DB|\bDB|\bdb)\s*\.(?:prepare|exec|batch)\s*\(/;

		const violations = collectViolations(files, pattern, (file) => {
			if (file.path.endsWith(allowedFileSuffix)) return false;
			if (allowedPathPrefixes.some((p) => file.path.startsWith(p))) return false;
			return true;
		});

		if (violations.length > 0) {
			throw new Error(formatViolations('db-access', violations));
		}
		expect(violations).toHaveLength(0);
	});
});
