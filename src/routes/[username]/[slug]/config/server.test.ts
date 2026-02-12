/**
 * Tests for config JSON endpoint
 * Critical: Private config access control via Bearer tokens
 */

import { describe, it, expect } from 'vitest';
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
import { createBearerToken, getJSON } from '$lib/test/helpers';

describe('[username]/[slug]/config GET - Visibility Auth', () => {
	const baseUrl = 'http://localhost:5173/testuser/my-config/config';

	describe('Public configs', () => {
		it('should return config JSON without auth', async () => {
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
			expect(response.headers.get('content-type')).toContain('application/json');

			const json = await getJSON(response);
			expect(json.username).toBe('testuser');
			expect(json.slug).toBe('public-config');
			expect(json.name).toBe('Public Config');
			expect(json.preset).toBe('developer');
			expect(json.packages).toBeDefined();
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
			const json = await getJSON(response);
			expect(json.error).toContain('Config is private');
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

		it('should return config JSON with valid owner token', async () => {
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

			const json = await getJSON(response);
			expect(json.username).toBe('testuser');
			expect(json.slug).toBe('private-config');
			expect(json.name).toBe('Private Config');
			expect(json.preset).toBe('developer');
			expect(json.packages).toBeDefined();
			expect(json.casks).toBeDefined();
			expect(json.taps).toBeDefined();
			expect(json.npm).toBeDefined();
		});
	});

	describe('Data parsing', () => {
		it('should parse packages correctly', async () => {
			const config = {
				...mockPublicConfig,
				packages: JSON.stringify([
					{ name: 'git', type: 'formula', desc: 'Version control' },
					{ name: 'visual-studio-code', type: 'cask', desc: 'Editor' },
					{ name: 'typescript', type: 'npm', desc: 'TypeScript' }
				])
			};

			const db = createMockDB({
				users: [mockUser],
				configs: [config]
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

			const json = await getJSON(response);
			expect(json.packages).toContain('git');
			expect(json.packages).toContain('visual-studio-code');
			expect(json.casks).toContain('visual-studio-code');
			expect(json.npm).toContain('typescript');
		});

		it('should parse snapshot for taps and casks', async () => {
			const config = {
				...mockPublicConfig,
				snapshot: JSON.stringify({
					packages: {
						taps: ['homebrew/cask-fonts'],
						casks: ['font-fira-code']
					}
				})
			};

			const db = createMockDB({
				users: [mockUser],
				configs: [config]
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

			const json = await getJSON(response);
			expect(json.taps).toContain('homebrew/cask-fonts');
		});
	});
});
