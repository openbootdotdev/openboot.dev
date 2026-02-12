import { describe, it, expect } from 'vitest';
import { GET } from './+server';
import { createMockDB } from '$lib/test/db-mock';
import { mockUser, createMockRequest, createMockPlatform, createMockCookies } from '$lib/test/fixtures';
import { getJSON } from '$lib/test/helpers';

describe('GET /api/auth/cli/poll', () => {
	const baseUrl = 'http://localhost:5173/api/auth/cli/poll';

	it('should return 400 if code_id not provided', async () => {
		const db = createMockDB({});
		const request = createMockRequest({ url: baseUrl, method: 'GET' });
		const platform = createMockPlatform(db);

		const response = await GET({
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

		expect(response.status).toBe(400);
		const json = await getJSON(response);
		expect(json.error).toContain('code_id is required');
	});

	it('should return expired status if code_id not found', async () => {
		const db = createMockDB({ cli_auth_codes: [] });
		const url = `${baseUrl}?code_id=nonexistent`;
		const request = createMockRequest({ url, method: 'GET' });
		const platform = createMockPlatform(db);

		const response = await GET({
			request,
			platform,
			url: new URL(url),
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
		expect(json.status).toBe('expired');
	});

	it('should return expired status if code expired', async () => {
		const expiredCode = {
			id: 'code123',
			code: 'EXPIRED1',
			user_id: null,
			token_id: null,
			status: 'pending',
			expires_at: '2020-01-01 00:00:00'
		};
		const db = createMockDB({ cli_auth_codes: [expiredCode] });
		const url = `${baseUrl}?code_id=code123`;
		const request = createMockRequest({ url, method: 'GET' });
		const platform = createMockPlatform(db);

		const response = await GET({
			request,
			platform,
			url: new URL(url),
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
		expect(json.status).toBe('expired');
	});

	it('should return pending status for pending code', async () => {
		const pendingCode = {
			id: 'code123',
			code: 'PENDING1',
			user_id: null,
			token_id: null,
			status: 'pending',
			expires_at: '2099-01-01 00:00:00'
		};
		const db = createMockDB({ cli_auth_codes: [pendingCode] });
		const url = `${baseUrl}?code_id=code123`;
		const request = createMockRequest({ url, method: 'GET' });
		const platform = createMockPlatform(db);

		const response = await GET({
			request,
			platform,
			url: new URL(url),
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
		expect(json.status).toBe('pending');
	});

	it('should return approved status with token for approved code', async () => {
		const approvedCode = {
			id: 'code123',
			code: 'APPROVED',
			user_id: mockUser.id,
			token_id: 'token1',
			status: 'approved',
			expires_at: '2099-01-01 00:00:00'
		};
		const apiToken = {
			id: 'token1',
			user_id: mockUser.id,
			token: 'obt_test_token_123',
			name: 'cli',
			expires_at: '2099-06-01 00:00:00',
			created_at: '2025-01-01 00:00:00'
		};
		const db = createMockDB({
			cli_auth_codes: [approvedCode],
			api_tokens: [apiToken],
			users: [mockUser]
		});
		const url = `${baseUrl}?code_id=code123`;
		const request = createMockRequest({ url, method: 'GET' });
		const platform = createMockPlatform(db);

		const response = await GET({
			request,
			platform,
			url: new URL(url),
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
		expect(json.status).toBe('approved');
		expect(json.token).toBe('obt_test_token_123');
		expect(json.username).toBe('testuser');
		expect(json.expires_at).toBe('2099-06-01T00:00:00Z');
	});

	it('should mark approved code as used after first poll', async () => {
		const approvedCode = {
			id: 'code123',
			code: 'APPROVED',
			user_id: mockUser.id,
			token_id: 'token1',
			status: 'approved',
			expires_at: '2099-01-01 00:00:00'
		};
		const apiToken = {
			id: 'token1',
			user_id: mockUser.id,
			token: 'obt_test_token_123',
			name: 'cli',
			expires_at: '2099-06-01 00:00:00',
			created_at: '2025-01-01 00:00:00'
		};
		const db = createMockDB({
			cli_auth_codes: [approvedCode],
			api_tokens: [apiToken],
			users: [mockUser]
		});
		const url = `${baseUrl}?code_id=code123`;
		const request = createMockRequest({ url, method: 'GET' });
		const platform = createMockPlatform(db);

		const response = await GET({
			request,
			platform,
			url: new URL(url),
			route: { id: '' },
			locals: {},
			isDataRequest: false,
			isSubRequest: false,
			cookies: createMockCookies(),
			getClientAddress: () => '',
			fetch: globalThis.fetch
		});

		expect(response.status).toBe(200);

		const updatedCode = db.data.cli_auth_codes?.find((c: any) => c.id === 'code123');
		expect(updatedCode?.status).toBe('used');
	});

	it('should still return token for used code (idempotent)', async () => {
		const usedCode = {
			id: 'code123',
			code: 'USED1234',
			user_id: mockUser.id,
			token_id: 'token1',
			status: 'used',
			expires_at: '2099-01-01 00:00:00'
		};
		const apiToken = {
			id: 'token1',
			user_id: mockUser.id,
			token: 'obt_test_token_123',
			name: 'cli',
			expires_at: '2099-06-01 00:00:00',
			created_at: '2025-01-01 00:00:00'
		};
		const db = createMockDB({
			cli_auth_codes: [usedCode],
			api_tokens: [apiToken],
			users: [mockUser]
		});
		const url = `${baseUrl}?code_id=code123`;
		const request = createMockRequest({ url, method: 'GET' });
		const platform = createMockPlatform(db);

		const response = await GET({
			request,
			platform,
			url: new URL(url),
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
		expect(json.status).toBe('approved');
		expect(json.token).toBe('obt_test_token_123');
	});

	it('should return expired status if approved but token missing', async () => {
		const approvedCode = {
			id: 'code123',
			code: 'APPROVED',
			user_id: 'user1',
			token_id: null,
			status: 'approved',
			expires_at: '2099-01-01 00:00:00'
		};
		const db = createMockDB({ cli_auth_codes: [approvedCode] });
		const url = `${baseUrl}?code_id=code123`;
		const request = createMockRequest({ url, method: 'GET' });
		const platform = createMockPlatform(db);

		const response = await GET({
			request,
			platform,
			url: new URL(url),
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
		expect(json.status).toBe('expired');
	});

	it('should return 500 if platform env not available', async () => {
		const url = `${baseUrl}?code_id=code123`;
		const request = createMockRequest({ url, method: 'GET' });
		const platform = { env: undefined };

		const response = await GET({
			request,
			platform,
			url: new URL(url),
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
