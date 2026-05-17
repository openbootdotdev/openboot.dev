import { describe, it, expect } from 'vitest';
import { walkSourceFiles, collectViolations, formatViolations } from './walk';

// Server code on Cloudflare Workers should reserve console.* for real
// errors (console.error). `console.log` in server code is almost always
// leftover debugging — and the harder problem is that there is no
// structured logging in this project, so noisy logs make the real errors
// invisible in `wrangler tail`.
//
// console.error and console.warn are allowed (matching eslint's no-console
// `{ allow: ['warn', 'error'] }` setting for the rest of the codebase).
describe('archtest: no console.log in server code', () => {
	it('src/lib/server and route +server.ts files may use console.error / console.warn only', () => {
		const files = walkSourceFiles(['.ts']).filter(
			(f) => f.path.startsWith('src/lib/server/') || f.path.endsWith('+server.ts')
		);
		const pattern = /\bconsole\.log\s*\(/;

		const violations = collectViolations(files, pattern, () => true);

		if (violations.length > 0) {
			throw new Error(formatViolations('no-server-console-log', violations));
		}
		expect(violations).toHaveLength(0);
	});
});
