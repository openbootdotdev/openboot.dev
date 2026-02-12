/**
 * Tests for install script endpoint
 * Critical: Private config access control via Bearer tokens
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from './+server';
import { createMockDB } from '$lib/test/db-mock';
import {
	mockUser,
	mockPublicConfig,
	mockPrivateConfig,
	mockApiToken,
	mockExpiredApiToken,
	createMockRequest,
	createMockPlatform
} from '$lib/test/fixtures';
import { createBearerToken } from '$lib/test/helpers';

describe('[username]/[slug]/install GET - Visibility Auth', () => {
	const baseUrl = 'http://localhost:5173/testuser/my-config/install';

	describe('Public configs', () => {
		it('should return install script without auth', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockPublicConfig]
			});

			const request = createMockRequest({ url: baseUrl });
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'public-config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(200);
			expect(response.headers.get('content-type')).toContain('text/plain');

			const text = await response.text();
			expect(text).toContain('#!/bin/bash');
			expect(text).toContain('openboot');
		});
	});

	describe('Private configs - Auth required', () => {
		it('should reject private config without auth header', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockPrivateConfig]
			});

			const request = createMockRequest({ url: baseUrl });
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'private-config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(403);
			const text = await response.text();
			expect(text).toContain('Config is private');
		});

		it('should reject private config with empty Bearer token', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockPrivateConfig]
			});

			const request = createMockRequest({
				url: baseUrl,
				headers: { authorization: 'Bearer ' }
			});
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'private-config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(403);
		});

		it('should reject private config with invalid token', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockPrivateConfig],
				api_tokens: [mockApiToken]
			});

			const request = createMockRequest({
				url: baseUrl,
				headers: { authorization: createBearerToken('obt_invalid_token_123') }
			});
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'private-config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(403);
		});

		it('should reject private config with expired token', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockPrivateConfig],
				api_tokens: [mockExpiredApiToken]
			});

			const request = createMockRequest({
				url: baseUrl,
				headers: { authorization: createBearerToken(mockExpiredApiToken.token) }
			});
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'private-config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(403);
		});

		it('should reject private config with token from different user', async () => {
			const otherUser = { ...mockUser, id: 'user_other', username: 'otheruser' };
			const otherToken = { ...mockApiToken, id: 'tok_other', user_id: 'user_other' };

			const db = createMockDB({
				users: [mockUser, otherUser],
				configs: [mockPrivateConfig],
				api_tokens: [otherToken]
			});

			const request = createMockRequest({
				url: baseUrl,
				headers: { authorization: createBearerToken(otherToken.token) }
			});
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'private-config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(403);
		});

		it('should return install script with valid owner token', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockPrivateConfig],
				api_tokens: [mockApiToken]
			});

			const request = createMockRequest({
				url: baseUrl,
				headers: { authorization: createBearerToken(mockApiToken.token) }
			});
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'private-config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(200);

			const text = await response.text();
			expect(text).toContain('#!/bin/bash');
			expect(text).toContain('openboot');
		});

		it('should handle Bearer token with mixed case', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockPrivateConfig],
				api_tokens: [mockApiToken]
			});

			const request = createMockRequest({
				url: baseUrl,
				headers: { authorization: `bearer ${mockApiToken.token}` } // lowercase
			});
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'private-config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(200);
		});
	});

	describe('404 cases', () => {
		it('should return 404 for non-existent user', async () => {
			const db = createMockDB({ users: [], configs: [] });

			const request = createMockRequest({ url: baseUrl });
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'nonexistent', slug: 'config' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(404);
			const text = await response.text();
			expect(text).toContain('User not found');
		});

		it('should return 404 for non-existent config', async () => {
			const db = createMockDB({ users: [mockUser], configs: [] });

			const request = createMockRequest({ url: baseUrl });
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'nonexistent' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(404);
			const text = await response.text();
			expect(text).toContain('Config not found');
		});
	});
});
