import { describe, it, expect } from 'vitest';
import { GET } from './+server';
import { createMockDB } from '$lib/test/db-mock';
import { createMockPlatform } from '$lib/test/fixtures';

describe('GET /api/health', () => {
	it('returns health check response', async () => {
		const db = createMockDB();
		const platform = createMockPlatform(db);
		
		const response = await GET({ platform } as any);
		const data = await response.json();
		
		expect(data.status).toBeDefined();
		expect(data.checks).toBeDefined();
		expect(data.checks.api).toBe('ok');
		expect(data.checks.database).toBeDefined();
		expect(data.version).toBe('0.1.0');
		expect(data.checks.timestamp).toBeTruthy();
	});

	it('returns degraded status when database fails', async () => {
		const db = {
			prepare: () => ({
				first: async () => { throw new Error('DB error'); }
			})
		} as any;
		
		const platform = createMockPlatform(db);
		
		const response = await GET({ platform } as any);
		const data = await response.json();
		
		expect(response.status).toBe(503);
		expect(data.status).toBe('degraded');
		expect(data.checks.database).toBe('error');
	});

	it('sets no-cache headers', async () => {
		const db = createMockDB();
		const platform = createMockPlatform(db);
		
		const response = await GET({ platform } as any);
		
		expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
	});
});
