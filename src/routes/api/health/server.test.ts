import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { GET } from './+server';

describe('GET /api/health', () => {
	it('returns healthy when DB responds', async () => {
		const response = await GET({ platform: { env } } as any);
		const data = (await response.json()) as Record<string, any>;

		expect(response.status).toBe(200);
		expect(data.status).toBe('healthy');
		expect(data.checks.api).toBe('ok');
		expect(data.checks.database).toBe('ok');
		expect(data.version).toBe('0.1.0');
		expect(data.checks.timestamp).toBeTruthy();
	});

	it('returns degraded when DB throws', async () => {
		const brokenDb = {
			prepare: () => ({
				first: async () => {
					throw new Error('DB error');
				}
			})
		};
		const response = await GET({ platform: { env: { ...env, DB: brokenDb } } } as any);
		const data = (await response.json()) as Record<string, any>;

		expect(response.status).toBe(503);
		expect(data.status).toBe('degraded');
		expect(data.checks.database).toBe('error');
	});

	it('sets no-cache headers', async () => {
		const response = await GET({ platform: { env } } as any);
		expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
	});
});
