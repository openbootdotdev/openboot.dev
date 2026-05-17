import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { POST } from './+server';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockApiToken } from '$lib/test/fixtures';

const db = env.DB;
const baseUrl = 'http://localhost:5173/api/auth/cli/approve';
const userRow = () => strip(mockUser, 'provider', 'provider_id');

beforeEach(async () => {
	await resetDb(db);
});

describe('POST /api/auth/cli/approve', () => {
	const authed = (body: unknown) => call(POST, { url: baseUrl, method: 'POST', token: mockApiToken.token, body });

	it('rejects request without authentication', async () => {
		const response = await call(POST, {
			url: baseUrl,
			method: 'POST',
			body: { code: 'TESTCODE' }
		});

		expect(response.status).toBe(401);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Unauthorized');
	});

	it('rejects request with missing code', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authed({});

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Code is required');
	});

	it('rejects request with non-string code', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authed({ code: 123 });

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Code is required');
	});

	it('rejects invalid (non-existent) code', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authed({ code: 'INVALIDCODE' });

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Invalid or expired code');
	});

	it('rejects expired code', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [mockApiToken],
			cli_auth_codes: [
				{
					id: 'code123',
					code: 'EXPIRED1',
					user_id: null,
					token_id: null,
					status: 'pending',
					expires_at: '2020-01-01 00:00:00'
				}
			]
		});

		const response = await authed({ code: 'EXPIRED1' });

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Invalid or expired code');
	});

	it('approves valid pending code', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [mockApiToken],
			cli_auth_codes: [
				{
					id: 'code123',
					code: 'PENDING1',
					user_id: null,
					token_id: null,
					status: 'pending',
					expires_at: '2099-01-01 00:00:00'
				}
			]
		});

		const response = await authed({ code: 'PENDING1' });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { success: boolean };
		expect(json.success).toBe(true);
	});

	it('creates API token with obt_ prefix', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [mockApiToken],
			cli_auth_codes: [
				{
					id: 'code123',
					code: 'PENDING1',
					user_id: null,
					token_id: null,
					status: 'pending',
					expires_at: '2099-01-01 00:00:00'
				}
			]
		});

		await authed({ code: 'PENDING1' });

		const newToken = await db
			.prepare(`SELECT token FROM api_tokens WHERE name = 'cli' AND user_id = ?`)
			.bind(mockUser.id)
			.first<{ token: string }>();
		expect(newToken).not.toBeNull();
		expect(newToken!.token).toMatch(/^obt_[a-f0-9]{32}$/);
	});

	it('updates code status to approved', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [mockApiToken],
			cli_auth_codes: [
				{
					id: 'code123',
					code: 'PENDING1',
					user_id: null,
					token_id: null,
					status: 'pending',
					expires_at: '2099-01-01 00:00:00'
				}
			]
		});

		await authed({ code: 'PENDING1' });

		const updated = await db
			.prepare('SELECT status, user_id, token_id FROM cli_auth_codes WHERE id = ?')
			.bind('code123')
			.first<{ status: string; user_id: string; token_id: string }>();
		expect(updated?.status).toBe('approved');
		expect(updated?.user_id).toBe(mockUser.id);
		expect(updated?.token_id).toBeTruthy();
	});

	it('rejects invalid JSON body', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await call(POST, {
			url: baseUrl,
			method: 'POST',
			token: mockApiToken.token,
			headers: { 'content-type': 'application/json' },
			body: 'invalid-json'
		});

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Invalid request body');
	});

	it('returns 500 if platform env not available', async () => {
		const response = await POST({
			request: new Request(baseUrl, {
				method: 'POST',
				body: JSON.stringify({ code: 'TESTCODE' }),
				headers: { 'content-type': 'application/json' }
			}),
			platform: { env: undefined },
			url: new URL(baseUrl),
			route: { id: '/api/auth/cli/approve' },
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
