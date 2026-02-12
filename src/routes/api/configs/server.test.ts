/**
 * Tests for /api/configs GET/POST endpoints
 * Critical: Auth validation, visibility field validation, config creation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from './+server';
import { createMockDB } from '$lib/test/db-mock';
import {
	mockUser,
	mockConfig,
	mockPublicConfig,
	mockPrivateConfig,
	mockApiToken,
	createMockRequest,
	createMockPlatform,
	createMockCookies
} from '$lib/test/fixtures';
import { createBearerToken, getJSON } from '$lib/test/helpers';

describe('/api/configs GET/POST', () => {
	const baseUrl = 'http://localhost:5173/api/configs';

	describe('GET - List configs', () => {
		it('should reject request without auth', async () => {
			const db = createMockDB({ users: [mockUser], configs: [mockConfig] });
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

			expect(response.status).toBe(401);
			const json = await getJSON(response);
			expect(json.error).toContain('Unauthorized');
		});

		it('should return empty list for user with no configs', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'GET',
				headers: { authorization: createBearerToken(mockApiToken.token) }
			});
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

			expect(response.status).toBe(200);
			const json = await getJSON(response);
			expect(json.configs).toEqual([]);
			expect(json.username).toBe('testuser');
		});

		it('should return all user configs with visibility field', async () => {
			const configs = [mockPublicConfig, mockPrivateConfig, mockConfig];
			const db = createMockDB({
				users: [mockUser],
				configs,
				api_tokens: [mockApiToken]
			});

			const request = createMockRequest({
				url: baseUrl,
				method: 'GET',
				headers: { authorization: createBearerToken(mockApiToken.token) }
			});
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

			expect(response.status).toBe(200);
			const json = await getJSON(response);
			expect(json.configs).toHaveLength(3);
			expect(json.configs[0].visibility).toBe('public');
			expect(json.configs[1].visibility).toBe('private');
			expect(json.configs[2].visibility).toBe('unlisted');
		});

		it('should parse snapshot JSON in response', async () => {
			const configWithSnapshot = {
				...mockConfig,
				snapshot: JSON.stringify({ packages: { formulas: ['git'] } })
			};
			const db = createMockDB({
				users: [mockUser],
				configs: [configWithSnapshot],
				api_tokens: [mockApiToken]
			});

			const request = createMockRequest({
				url: baseUrl,
				method: 'GET',
				headers: { authorization: createBearerToken(mockApiToken.token) }
			});
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

			expect(response.status).toBe(200);
			const json = await getJSON(response);
			expect(json.configs[0].snapshot).toEqual({ packages: { formulas: ['git'] } });
		});
	});

	describe('POST - Create config', () => {
		it('should reject request without auth', async () => {
			const db = createMockDB({ users: [mockUser], configs: [] });
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				body: { name: 'New Config' }
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

		it('should reject invalid JSON body', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = new Request(baseUrl, {
				method: 'POST',
				headers: {
					'Authorization': createBearerToken(mockApiToken.token),
					'Content-Type': 'application/json'
				},
				body: 'invalid json {'
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

		it('should reject POST without name field', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { description: 'No name provided' }
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
			expect(json.error).toContain('Name is required');
		});

		describe('Visibility validation', () => {
			it('should create config with visibility=public', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'POST',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { name: 'Public Config', visibility: 'public' }
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

				expect(response.status).toBe(201);
				const json = await getJSON(response);
				expect(json.id).toBeDefined();
				expect(json.slug).toBe('public-config');
			});

			it('should create config with visibility=unlisted', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'POST',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { name: 'Unlisted Config', visibility: 'unlisted' }
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

				expect(response.status).toBe(201);
				const json = await getJSON(response);
				expect(json.id).toBeDefined();
			});

			it('should create config with visibility=private', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'POST',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { name: 'Private Config', visibility: 'private' }
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

				expect(response.status).toBe(201);
				const json = await getJSON(response);
				expect(json.id).toBeDefined();
			});

			it('should reject invalid visibility value', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'POST',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { name: 'Bad Config', visibility: 'invalid' }
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
				expect(json.error).toContain('Invalid visibility');
				expect(json.error).toContain('public, unlisted, or private');
			});

			it('should reject visibility=secret', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'POST',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { name: 'Secret Config', visibility: 'secret' }
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
				expect(json.error).toContain('Invalid visibility');
			});

			it('should default to unlisted when visibility not provided', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'POST',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { name: 'Default Visibility Config' }
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

				expect(response.status).toBe(201);
				const json = await getJSON(response);
				expect(json.id).toBeDefined();
			});
		});

		it('should reject duplicate config name (same slug)', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'My Config' } // Same as mockConfig
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

			expect(response.status).toBe(409);
			const json = await getJSON(response);
			expect(json.error).toContain('already exists');
		});

		it('should create config with all optional fields', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: {
					name: 'Full Config',
					description: 'Complete config with all fields',
					base_preset: 'full',
					packages: [{ name: 'git', type: 'formula' }],
					custom_script: 'echo "test"',
					visibility: 'public',
					alias: 'fullcfg',
					dotfiles_repo: 'https://github.com/user/dotfiles'
				}
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

			expect(response.status).toBe(201);
			const json = await getJSON(response);
			expect(json.id).toBeDefined();
			expect(json.slug).toBe('full-config');
			expect(json.alias).toBe('fullcfg');
			expect(json.install_url).toContain('fullcfg');
		});

		it('should return install_url with alias when provided', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'Aliased Config', alias: 'myalias' }
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

			expect(response.status).toBe(201);
			const json = await getJSON(response);
			expect(json.alias).toBe('myalias');
			expect(json.install_url).toContain('myalias');
		});

		it('should return install_url with username/slug when no alias', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'No Alias Config' }
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

			expect(response.status).toBe(201);
			const json = await getJSON(response);
			expect(json.alias).toBeNull();
			expect(json.install_url).toContain('testuser');
			expect(json.install_url).toContain('no-alias-config');
		});

		it('should reject alias that is too short', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'Config', alias: 'a' }
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
			expect(json.error).toContain('Alias must be at least 2 characters');
		});

		it('should reject reserved alias names', async () => {
			const reservedAliases = ['api', 'install', 'dashboard', 'login', 'logout'];

			for (const alias of reservedAliases) {
				const db = createMockDB({
					users: [mockUser],
					configs: [],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'POST',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { name: `Config ${alias}`, alias }
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
				expect(json.error).toContain('reserved');
			}
		});

		it('should reject duplicate alias', async () => {
			const existingConfig = { ...mockConfig, alias: 'taken' };
			const db = createMockDB({
				users: [mockUser],
				configs: [existingConfig],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'Another Config', alias: 'taken' }
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

			expect(response.status).toBe(409);
			const json = await getJSON(response);
			expect(json.error).toContain('already taken');
		});

		it('should enforce max 20 configs per user', async () => {
			const configs = Array.from({ length: 20 }, (_, i) => ({
				...mockConfig,
				id: `cfg_${i}`,
				slug: `config-${i}`,
				name: `Config ${i}`
			}));

			const db = createMockDB({
				users: [mockUser],
				configs,
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'POST',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'Config 21' }
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
			expect(json.error).toContain('Maximum 20 configs');
		});
	});
});
