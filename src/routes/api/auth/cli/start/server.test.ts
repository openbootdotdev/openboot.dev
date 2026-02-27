import { describe, it, expect } from 'vitest';
import { POST } from './+server';
import { createMockDB } from '$lib/test/db-mock';
import { createMockRequest, createMockPlatform, createMockCookies } from '$lib/test/fixtures';
import { getJSON } from '$lib/test/helpers';

describe('POST /api/auth/cli/start', () => {
	const baseUrl = 'http://localhost:5173/api/auth/cli/start';
	let testCounter = 0;

	it('should generate code and code_id', async () => {
		const db = createMockDB({ cli_auth_codes: [] });
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: {},
			clientIp: `127.0.0.${++testCounter}`
		});
		const platform = createMockPlatform(db);

		const response = await POST({
			request,
			platform,
			url: new URL(baseUrl),
			route: { id: '' },
			locals: {},
			isDataRequest: false,
			isSubRequest: false,
			cookies: createMockCookies(),
			getClientAddress: () => '',
			fetch: globalThis.fetch
		});

		expect(response.status).toBe(200);
		const json = await getJSON(response);
		expect(json.code_id).toBeDefined();
		expect(json.code).toBeDefined();
		expect(json.code).toHaveLength(8);
		expect(/^[A-Z0-9]{8}$/.test(json.code)).toBe(true);
	});

	it('should always server-generate codes regardless of body', async () => {
		const db = createMockDB({ cli_auth_codes: [] });
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 'MYCUSTOM' },
			clientIp: `127.0.0.${++testCounter}`
		});
		const platform = createMockPlatform(db);

		const response = await POST({
			request,
			platform,
			url: new URL(baseUrl),
			route: { id: '' },
			locals: {},
			isDataRequest: false,
			isSubRequest: false,
			cookies: createMockCookies(),
			getClientAddress: () => '',
			fetch: globalThis.fetch
		});

		expect(response.status).toBe(200);
		const json = await getJSON(response);
		// Code should be server-generated, not the client-supplied value
		expect(json.code).not.toBe('MYCUSTOM');
		expect(json.code).toHaveLength(8);
		expect(json.code_id).toBeDefined();
	});

	it('should store code with pending status and 10 minute expiration', async () => {
		const db = createMockDB({ cli_auth_codes: [] });
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: {},
			clientIp: `127.0.0.${++testCounter}`
		});
		const platform = createMockPlatform(db);

		const response = await POST({
			request,
			platform,
			url: new URL(baseUrl),
			route: { id: '' },
			locals: {},
			isDataRequest: false,
			isSubRequest: false,
			cookies: createMockCookies(),
			getClientAddress: () => '',
			fetch: globalThis.fetch
		});

		expect(response.status).toBe(200);
		const json = await getJSON(response);

		const stored = db.data.cli_auth_codes?.find((c: any) => c.id === json.code_id);
		expect(stored).toBeDefined();
		expect(stored.code).toBe(json.code);
		expect(stored.status).toBe('pending');
	});

	it('should return 500 if platform env not available', async () => {
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: {}
		});
		const platform = { env: undefined };

		const response = await POST({
			request,
			platform,
			url: new URL(baseUrl),
			route: { id: '' },
			locals: {},
			isDataRequest: false,
			isSubRequest: false,
			cookies: createMockCookies(),
			getClientAddress: () => '',
			fetch: globalThis.fetch
		});

		expect(response.status).toBe(500);
		const json = await getJSON(response);
		expect(json.error).toContain('Platform env not available');
	});
});
