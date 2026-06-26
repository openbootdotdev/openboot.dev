import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './+server';

afterEach(() => vi.unstubAllGlobals());

// The handler ignores the request event, so an empty object is enough.
const call = () => GET({} as any);

describe('GET /api/github/stars', () => {
	it('returns the live star count from GitHub', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ stargazers_count: 260 }), { status: 200 }))
		);

		const res = await call();
		const data = (await res.json()) as { stars: number; stale?: boolean };

		expect(res.status).toBe(200);
		expect(data.stars).toBe(260);
		expect(data.stale).toBeUndefined();
		expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
	});

	it('falls back when GitHub is unreachable', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new Error('network down');
			})
		);

		const res = await call();
		const data = (await res.json()) as { stars: number; stale?: boolean };

		expect(data.stars).toBeGreaterThan(0);
		expect(data.stale).toBe(true);
		expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
	});

	it('falls back on a non-ok response (e.g. rate limited)', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('rate limit exceeded', { status: 403 }))
		);

		const res = await call();
		const data = (await res.json()) as { stars: number; stale?: boolean };

		expect(data.stale).toBe(true);
		expect(data.stars).toBeGreaterThan(0);
	});
});
