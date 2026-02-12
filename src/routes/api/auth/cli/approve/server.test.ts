import { describe, it, expect } from 'vitest';
import { POST } from './+server';
import { createMockDB } from '$lib/test/db-mock';
import {
	mockUser,
	mockApiToken,
	createMockRequest,
	createMockPlatform,
	createMockCookies
} from '$lib/test/fixtures';
import { createBearerToken, getJSON } from '$lib/test/helpers';

describe('POST /api/auth/cli/approve', () => {
	const baseUrl = 'http://localhost:5173/api/auth/cli/approve';

	it('should reject request without authentication', async () => {
		const db = createMockDB({});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 'TESTCODE' }
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

		expect(response.status).toBe(401);
		const json = await getJSON(response);
		expect(json.error).toContain('Unauthorized');
	});

	it('should reject request with missing code', async () => {
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken]
		});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: {},
			headers: { authorization: createBearerToken(mockApiToken.token) }
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

		expect(response.status).toBe(400);
		const json = await getJSON(response);
		expect(json.error).toContain('Code is required');
	});

	it('should reject request with non-string code', async () => {
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken]
		});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 123 },
			headers: { authorization: createBearerToken(mockApiToken.token) }
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

		expect(response.status).toBe(400);
		const json = await getJSON(response);
		expect(json.error).toContain('Code is required');
	});

	it('should reject invalid or expired code', async () => {
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			cli_auth_codes: []
		});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 'INVALIDCODE' },
			headers: { authorization: createBearerToken(mockApiToken.token) }
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

		expect(response.status).toBe(400);
		const json = await getJSON(response);
		expect(json.error).toContain('Invalid or expired code');
	});

	it('should reject expired code', async () => {
		const expiredCode = {
			id: 'code123',
			code: 'EXPIRED1',
			user_id: null,
			token_id: null,
			status: 'pending',
			expires_at: '2020-01-01 00:00:00'
		};
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			cli_auth_codes: [expiredCode]
		});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 'EXPIRED1' },
			headers: { authorization: createBearerToken(mockApiToken.token) }
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

		expect(response.status).toBe(400);
		const json = await getJSON(response);
		expect(json.error).toContain('Invalid or expired code');
	});



	it('should approve valid pending code', async () => {
		const pendingCode = {
			id: 'code123',
			code: 'PENDING1',
			user_id: null,
			token_id: null,
			status: 'pending',
			expires_at: '2099-01-01 00:00:00'
		};
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			cli_auth_codes: [pendingCode]
		});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 'PENDING1' },
			headers: { authorization: createBearerToken(mockApiToken.token) }
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
		expect(json.success).toBe(true);
	});

	it('should create API token with 90 day expiration', async () => {
		const pendingCode = {
			id: 'code123',
			code: 'PENDING1',
			user_id: null,
			token_id: null,
			status: 'pending',
			expires_at: '2099-01-01 00:00:00'
		};
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			cli_auth_codes: [pendingCode]
		});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 'PENDING1' },
			headers: { authorization: createBearerToken(mockApiToken.token) }
		});
		const platform = createMockPlatform(db);

		await POST({
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

		const tokens = db.data.api_tokens || [];
		const newToken = tokens.find((t: any) => t.name === 'cli' && t.user_id === mockUser.id);
		expect(newToken).toBeDefined();
		expect(newToken.token).toMatch(/^obt_[a-f0-9]{32}$/);
	});

	it('should update code status to approved', async () => {
		const pendingCode = {
			id: 'code123',
			code: 'PENDING1',
			user_id: null,
			token_id: null,
			status: 'pending',
			expires_at: '2099-01-01 00:00:00'
		};
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			cli_auth_codes: [pendingCode]
		});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 'PENDING1' },
			headers: { authorization: createBearerToken(mockApiToken.token) }
		});
		const platform = createMockPlatform(db);

		await POST({
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

		const updatedCode = db.data.cli_auth_codes?.find((c: any) => c.id === 'code123');
		expect(updatedCode?.status).toBe('approved');
		expect(updatedCode?.user_id).toBe(mockUser.id);
		expect(updatedCode?.token_id).toBeDefined();
	});

	it('should reject invalid JSON body', async () => {
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken]
		});
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: 'invalid-json',
			invalidJSON: true,
			headers: { authorization: createBearerToken(mockApiToken.token) }
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

		expect(response.status).toBe(400);
		const json = await getJSON(response);
		expect(json.error).toContain('Invalid request body');
	});

	it('should return 500 if platform env not available', async () => {
		const request = createMockRequest({
			url: baseUrl,
			method: 'POST',
			body: { code: 'TESTCODE' }
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
