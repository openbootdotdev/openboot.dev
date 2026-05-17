import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { GET } from './+server';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser } from '$lib/test/fixtures';

const db = env.DB;
const baseUrl = 'http://localhost:5173/api/auth/cli/poll';
const userRow = () => strip(mockUser, 'provider', 'provider_id');

const apiToken = {
	id: 'token1',
	user_id: mockUser.id,
	token: 'obt_test_token_123',
	name: 'cli',
	expires_at: '2099-06-01 00:00:00',
	created_at: '2025-01-01 00:00:00'
};

beforeEach(async () => {
	await resetDb(db);
});

describe('GET /api/auth/cli/poll', () => {
	it('returns 400 if code_id not provided', async () => {
		const response = await call(GET, { url: baseUrl });

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('code_id is required');
	});

	it('returns expired status if code_id not found', async () => {
		const response = await call(GET, { url: `${baseUrl}?code_id=nonexistent` });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { status: string };
		expect(json.status).toBe('expired');
	});

	it('returns expired status if code expired', async () => {
		await seed(db, {
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

		const response = await call(GET, { url: `${baseUrl}?code_id=code123` });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { status: string };
		expect(json.status).toBe('expired');
	});

	it('returns pending status for pending code', async () => {
		await seed(db, {
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

		const response = await call(GET, { url: `${baseUrl}?code_id=code123` });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { status: string };
		expect(json.status).toBe('pending');
	});

	it('returns approved status with token for approved code', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [apiToken],
			cli_auth_codes: [
				{
					id: 'code123',
					code: 'APPROVED',
					user_id: mockUser.id,
					token_id: 'token1',
					status: 'approved',
					expires_at: '2099-01-01 00:00:00'
				}
			]
		});

		const response = await call(GET, { url: `${baseUrl}?code_id=code123` });

		expect(response.status).toBe(200);
		const json = (await response.json()) as {
			status: string;
			token: string;
			username: string;
			expires_at: string;
		};
		expect(json.status).toBe('approved');
		expect(json.token).toBe('obt_test_token_123');
		expect(json.username).toBe('testuser');
		expect(json.expires_at).toBe('2099-06-01T00:00:00Z');
	});

	it('marks approved code as used after first poll', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [apiToken],
			cli_auth_codes: [
				{
					id: 'code123',
					code: 'APPROVED',
					user_id: mockUser.id,
					token_id: 'token1',
					status: 'approved',
					expires_at: '2099-01-01 00:00:00'
				}
			]
		});

		const response = await call(GET, { url: `${baseUrl}?code_id=code123` });
		expect(response.status).toBe(200);

		const updated = await db
			.prepare('SELECT status FROM cli_auth_codes WHERE id = ?')
			.bind('code123')
			.first<{ status: string }>();
		expect(updated?.status).toBe('used');
	});

	it('still returns token for used code (idempotent)', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [apiToken],
			cli_auth_codes: [
				{
					id: 'code123',
					code: 'USED1234',
					user_id: mockUser.id,
					token_id: 'token1',
					status: 'used',
					expires_at: '2099-01-01 00:00:00'
				}
			]
		});

		const response = await call(GET, { url: `${baseUrl}?code_id=code123` });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { status: string; token: string };
		expect(json.status).toBe('approved');
		expect(json.token).toBe('obt_test_token_123');
	});

	it('returns expired status if approved but token missing', async () => {
		await seed(db, {
			cli_auth_codes: [
				{
					id: 'code123',
					code: 'APPROVED',
					user_id: 'user1',
					token_id: null,
					status: 'approved',
					expires_at: '2099-01-01 00:00:00'
				}
			]
		});

		const response = await call(GET, { url: `${baseUrl}?code_id=code123` });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { status: string };
		expect(json.status).toBe('expired');
	});

	it('returns 500 if platform env not available', async () => {
		// Bypass the call helper to inject a missing env.
		const url = `${baseUrl}?code_id=code123`;
		const response = await GET({
			request: new Request(url),
			platform: { env: undefined },
			url: new URL(url),
			route: { id: '/api/auth/cli/poll' },
			locals: {},
			isDataRequest: false,
			isSubRequest: false,
			cookies: { get: () => undefined, set: () => {}, delete: () => {}, getAll: () => [], serialize: () => '' },
			getClientAddress: () => '',
			fetch: globalThis.fetch
		} as any);

		expect(response.status).toBe(500);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Platform env not available');
	});
});
