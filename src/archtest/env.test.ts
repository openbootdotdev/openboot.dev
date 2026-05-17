import { describe, it, expect } from 'vitest';
import { walkSourceFiles, collectViolations, formatViolations } from './walk';

// On Cloudflare Workers, secrets and config flow through `platform.env`
// (or `event.platform.env`), not `process.env`. Test infra is allowed
// to set `process.env` for vitest mocks — that's excluded by walk.ts.
describe('archtest: no process.env in production code', () => {
	it('production source must not read process.env', () => {
		const files = walkSourceFiles(['.ts', '.svelte']);
		const pattern = /\bprocess\.env\b/;

		const violations = collectViolations(files, pattern, () => true);

		if (violations.length > 0) {
			throw new Error(formatViolations('no-process-env', violations));
		}
		expect(violations).toHaveLength(0);
	});
});
