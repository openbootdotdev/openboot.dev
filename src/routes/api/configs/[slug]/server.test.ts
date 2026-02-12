/**
 * Tests for /api/configs/[slug] GET/PUT/DELETE endpoints
 * Critical: Auth validation, visibility field validation, config updates
 */

import { describe, it, expect } from 'vitest';
import { GET, PUT, DELETE } from './+server';
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

describe('/api/configs/[slug] GET/PUT/DELETE', () => {
	const baseUrl = 'http://localhost:5173/api/configs/my-config';

	describe('GET - Retrieve single config', () => {
		it('should reject request without auth', async () => {
			const db = createMockDB({ users: [mockUser], configs: [mockConfig] });
			const request = createMockRequest({ url: baseUrl, method: 'GET' });
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { slug: 'my-config' },
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

		it('should return 404 for non-existent config', async () => {
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
				params: { slug: 'nonexistent' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: createMockCookies(),
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(404);
			const json = await getJSON(response);
			expect(json.error).toContain('Config not found');
		});

		it('should return config with all fields', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
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
				params: { slug: 'my-config' },
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
			expect(json.config.id).toBe('cfg_test123');
			expect(json.config.slug).toBe('my-config');
			expect(json.config.name).toBe('My Test Config');
			expect(json.config.visibility).toBe('unlisted');
			expect(json.install_url).toBeDefined();
		});

		it('should return install_url with alias when present', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
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
				params: { slug: 'my-config' },
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
			expect(json.install_url).toContain('myconfig');
		});

		it('should parse packages correctly', async () => {
			const configWithPackages = {
				...mockConfig,
				packages: JSON.stringify([
					{ name: 'git', type: 'formula' },
					{ name: 'visual-studio-code', type: 'cask' }
				])
			};
			const db = createMockDB({
				users: [mockUser],
				configs: [configWithPackages],
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
				params: { slug: 'my-config' },
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
			expect(json.config.packages).toHaveLength(2);
			expect(json.config.packages[0].name).toBe('git');
			expect(json.config.packages[1].type).toBe('cask');
		});
	});

	describe('PUT - Update config', () => {
		it('should reject request without auth', async () => {
			const db = createMockDB({ users: [mockUser], configs: [mockConfig] });
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				body: { name: 'Updated' }
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
			const request = new Request(baseUrl, {
				method: 'PUT',
				headers: {
					'Authorization': createBearerToken(mockApiToken.token),
					'Content-Type': 'application/json'
				},
				body: 'invalid json {'
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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

		it('should return 404 for non-existent config', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'Updated' }
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'nonexistent' },
				url: new URL(baseUrl),
				route: { id: '' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: createMockCookies(),
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(404);
			const json = await getJSON(response);
			expect(json.error).toContain('Config not found');
		});

		describe('Visibility validation on PUT', () => {
			it('should update config with visibility=public', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [mockConfig],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'PUT',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { visibility: 'public' }
				});
				const platform = createMockPlatform(db);

				const response = await PUT({
					request,
					platform,
					params: { slug: 'my-config' },
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

			it('should update config with visibility=private', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [mockConfig],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'PUT',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { visibility: 'private' }
				});
				const platform = createMockPlatform(db);

				const response = await PUT({
					request,
					platform,
					params: { slug: 'my-config' },
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

			it('should update config with visibility=unlisted', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [mockPublicConfig],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'PUT',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { visibility: 'unlisted' }
				});
				const platform = createMockPlatform(db);

				const response = await PUT({
					request,
					platform,
					params: { slug: 'public-config' },
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

			it('should reject invalid visibility value on PUT', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [mockConfig],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'PUT',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { visibility: 'invalid' }
				});
				const platform = createMockPlatform(db);

				const response = await PUT({
					request,
					platform,
					params: { slug: 'my-config' },
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

			it('should reject visibility=secret on PUT', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [mockConfig],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'PUT',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { visibility: 'secret' }
				});
				const platform = createMockPlatform(db);

				const response = await PUT({
					request,
					platform,
					params: { slug: 'my-config' },
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

			it('should allow undefined visibility (no change)', async () => {
				const db = createMockDB({
					users: [mockUser],
					configs: [mockConfig],
					api_tokens: [mockApiToken]
				});
				const request = createMockRequest({
					url: baseUrl,
					method: 'PUT',
					headers: { authorization: createBearerToken(mockApiToken.token) },
					body: { name: 'Updated Name' }
				});
				const platform = createMockPlatform(db);

				const response = await PUT({
					request,
					platform,
					params: { slug: 'my-config' },
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
		});

		it('should update config name and slug', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'Renamed Config' }
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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
			expect(json.slug).toBe('renamed-config');
		});

		it('should reject duplicate name (slug conflict)', async () => {
			const config2 = { ...mockConfig, id: 'cfg_2', slug: 'other-config', name: 'Other Config' };
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig, config2],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { name: 'Other Config' }
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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

		it('should update alias', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { alias: 'newalias' }
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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
			expect(json.alias).toBe('newalias');
		});

		it('should clear alias when set to empty string', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { alias: '' }
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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
			expect(json.alias).toBeNull();
		});

		it('should reject duplicate alias', async () => {
			const config2 = { ...mockConfig, id: 'cfg_2', slug: 'other-config', alias: 'taken' };
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig, config2],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { alias: 'taken' }
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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

		it('should update description', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: { description: 'New description' }
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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

		it('should update multiple fields at once', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'PUT',
				headers: { authorization: createBearerToken(mockApiToken.token) },
				body: {
					name: 'Multi Update',
					description: 'Updated description',
					visibility: 'public',
					alias: 'multiupdate'
				}
			});
			const platform = createMockPlatform(db);

			const response = await PUT({
				request,
				platform,
				params: { slug: 'my-config' },
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
			expect(json.slug).toBe('multi-update');
			expect(json.alias).toBe('multiupdate');
		});
	});

	describe('DELETE - Remove config', () => {
		it('should reject request without auth', async () => {
			const db = createMockDB({ users: [mockUser], configs: [mockConfig] });
			const request = createMockRequest({ url: baseUrl, method: 'DELETE' });
			const platform = createMockPlatform(db);

			const response = await DELETE({
				request,
				platform,
				params: { slug: 'my-config' },
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

		it('should delete config successfully', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'DELETE',
				headers: { authorization: createBearerToken(mockApiToken.token) }
			});
			const platform = createMockPlatform(db);

			const response = await DELETE({
				request,
				platform,
				params: { slug: 'my-config' },
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

		it('should silently succeed for non-existent config', async () => {
			const db = createMockDB({
				users: [mockUser],
				configs: [],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'DELETE',
				headers: { authorization: createBearerToken(mockApiToken.token) }
			});
			const platform = createMockPlatform(db);

			const response = await DELETE({
				request,
				platform,
				params: { slug: 'nonexistent' },
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

		it('should delete only the specified config', async () => {
			const config2 = { ...mockConfig, id: 'cfg_2', slug: 'other-config' };
			const db = createMockDB({
				users: [mockUser],
				configs: [mockConfig, config2],
				api_tokens: [mockApiToken]
			});
			const request = createMockRequest({
				url: baseUrl,
				method: 'DELETE',
				headers: { authorization: createBearerToken(mockApiToken.token) }
			});
			const platform = createMockPlatform(db);

			const response = await DELETE({
				request,
				platform,
				params: { slug: 'my-config' },
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
	});
});
