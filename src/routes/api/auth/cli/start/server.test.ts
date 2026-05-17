import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { POST } from './+server';
import { resetDb } from '$lib/test/seed';
import { call } from '$lib/test/call';

const db = env.DB;
const baseUrl = 'http://localhost:5173/api/auth/cli/start';

let testCounter = 0;
const nextIp = () => `127.0.0.${++testCounter}`;

beforeEach(async () => {
	await resetDb(db);
});

describe('POST /api/auth/cli/start', () => {
	it('generates code and code_id', async () => {
		const response = await call(POST, {
			url: baseUrl,
			method: 'POST',
			body: {},
			clientAddress: nextIp()
		});

		expect(response.status).toBe(200);
		const json = (await response.json()) as { code: string; code_id: string };
		expect(json.code_id).toBeDefined();
		expect(json.code).toBeDefined();
		expect(json.code).toHaveLength(8);
		expect(/^[A-Z0-9]{8}$/.test(json.code)).toBe(true);
	});

	it('always server-generates codes regardless of body', async () => {
		const response = await call(POST, {
			url: baseUrl,
			method: 'POST',
			body: { code: 'MYCUSTOM' },
			clientAddress: nextIp()
		});

		expect(response.status).toBe(200);
		const json = (await response.json()) as { code: string; code_id: string };
		expect(json.code).not.toBe('MYCUSTOM');
		expect(json.code).toHaveLength(8);
		expect(json.code_id).toBeDefined();
	});

	it('stores code with pending status', async () => {
		const response = await call(POST, {
			url: baseUrl,
			method: 'POST',
			body: {},
			clientAddress: nextIp()
		});

		expect(response.status).toBe(200);
		const json = (await response.json()) as { code: string; code_id: string };

		const stored = await db
			.prepare('SELECT code, status FROM cli_auth_codes WHERE id = ?')
			.bind(json.code_id)
			.first<{ code: string; status: string }>();
		expect(stored).not.toBeNull();
		expect(stored!.code).toBe(json.code);
		expect(stored!.status).toBe('pending');
	});

	it('returns 500 if platform env not available', async () => {
		const response = await POST({
			request: new Request(baseUrl, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } }),
			platform: { env: undefined },
			url: new URL(baseUrl),
			route: { id: '/api/auth/cli/start' },
			locals: {},
			isDataRequest: false,
			isSubRequest: false,
			cookies: {
				get: () => undefined,
				set: () => {},
				delete: () => {},
				getAll: () => [],
				serialize: () => ''
			},
			getClientAddress: () => '127.0.0.99',
			fetch: globalThis.fetch
		} as any);

		expect(response.status).toBe(500);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Platform env not available');
	});
});
