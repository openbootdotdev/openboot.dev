/**
 * Tests for config JSON endpoint
 * Critical: Private config access control via Bearer tokens
 */

import { describe, it, expect } from 'vitest';
import { GET as _GET } from './+server';
const GET = _GET as (event: any) => Promise<Response>;
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
				route: { id: '/[username]/[slug]/config' },
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
				route: { id: '/[username]/[slug]/config' },
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
				route: { id: '/[username]/[slug]/config' },
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
				route: { id: '/[username]/[slug]/config' },
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
				route: { id: '/[username]/[slug]/config' },
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
				route: { id: '/[username]/[slug]/config' },
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
				route: { id: '/[username]/[slug]/config' },
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

		it('should parse shell config from snapshot', async () => {
			const config = {
				...mockPublicConfig,
				snapshot: JSON.stringify({
					packages: { taps: [], casks: [] },
					shell: {
						oh_my_zsh: true,
						theme: 'powerlevel10k',
						plugins: ['git', 'zsh-autosuggestions']
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.shell).toEqual({
				oh_my_zsh: true,
				theme: 'powerlevel10k',
				plugins: ['git', 'zsh-autosuggestions']
			});
		});

		it('should default shell fields when partially present', async () => {
			const config = {
				...mockPublicConfig,
				snapshot: JSON.stringify({
					packages: { taps: [], casks: [] },
					shell: { oh_my_zsh: true }
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.shell).toEqual({
				oh_my_zsh: true,
				theme: '',
				plugins: []
			});
		});

		it('should return null shell when snapshot has no shell', async () => {
			const config = {
				...mockPublicConfig,
				snapshot: JSON.stringify({
					packages: { taps: [], casks: [] }
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.shell).toBeNull();
		});

		it('should parse macos_prefs from snapshot', async () => {
			const config = {
				...mockPublicConfig,
				snapshot: JSON.stringify({
					packages: { taps: [], casks: [] },
					macos_prefs: [
						{ domain: 'NSGlobalDomain', key: 'AppleShowAllExtensions', value: 'true', desc: 'Show file extensions' },
						{ domain: 'com.apple.dock', key: 'autohide', value: 'true', desc: 'Auto-hide dock' }
					]
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.macos_prefs).toHaveLength(2);
			expect(json.macos_prefs[0].domain).toBe('NSGlobalDomain');
			expect(json.macos_prefs[1].key).toBe('autohide');
		});

		it('should filter out invalid macos_prefs entries', async () => {
			const config = {
				...mockPublicConfig,
				snapshot: JSON.stringify({
					packages: { taps: [], casks: [] },
					macos_prefs: [
						{ domain: 'NSGlobalDomain', key: 'AppleShowAllExtensions', value: 'true', desc: 'Valid' },
						{ domain: 'bad', key: 123 },
						null,
						'not-an-object'
					]
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.macos_prefs).toHaveLength(1);
			expect(json.macos_prefs[0].domain).toBe('NSGlobalDomain');
		});

		it('should return null macos_prefs when empty array', async () => {
			const config = {
				...mockPublicConfig,
				snapshot: JSON.stringify({
					packages: { taps: [], casks: [] },
					macos_prefs: []
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.macos_prefs).toBeNull();
		});

		it('should handle invalid snapshot JSON gracefully', async () => {
			const config = {
				...mockPublicConfig,
				snapshot: '{invalid json'
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(200);
			const json = await getJSON(response);
			expect(json.shell).toBeNull();
			expect(json.macos_prefs).toBeNull();
		});

		it('should handle string packages (legacy format)', async () => {
			const config = {
				...mockPublicConfig,
				packages: JSON.stringify(['git', 'curl', 'wget']),
				snapshot: JSON.stringify({
					packages: { taps: [], casks: ['curl'] }
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.packages).toEqual(['git', 'curl', 'wget']);
			expect(json.casks).toContain('curl');
		});

		it('should extract taps from fully-qualified package names', async () => {
			const config = {
				...mockPublicConfig,
				packages: JSON.stringify([
					{ name: 'homebrew/cask-fonts/font-fira-code', type: 'formula', desc: 'Font' }
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
				route: { id: '/[username]/[slug]/config' },
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

		it('should parse custom_script into post_install lines', async () => {
			const config = {
				...mockPublicConfig,
				custom_script: 'echo "line1"\n\necho "line2"\n  \necho "line3"'
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.post_install).toEqual(['echo "line1"', 'echo "line2"', 'echo "line3"']);
		});

		it('should return empty post_install when no custom_script', async () => {
			const config = {
				...mockPublicConfig,
				custom_script: null
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.post_install).toEqual([]);
		});

		it('should return empty dotfiles_repo when not set', async () => {
			const config = {
				...mockPublicConfig,
				dotfiles_repo: null
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.dotfiles_repo).toBe('');
		});

		it('should handle empty packages', async () => {
			const config = {
				...mockPublicConfig,
				packages: '[]'
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
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			const json = await getJSON(response);
			expect(json.packages).toEqual([]);
			expect(json.casks).toEqual([]);
			expect(json.npm).toEqual([]);
			expect(json.taps).toEqual([]);
		});
	});

	describe('Error handling', () => {
		it('should return 500 when platform env missing', async () => {
			const request = createMockRequest({ url: baseUrl });
			const platform = { env: undefined } as any;

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'public-config' },
				url: new URL(baseUrl),
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(500);
			const json = await getJSON(response);
			expect(json.error).toContain('Platform env not available');
		});

		it('should return 404 when user not found', async () => {
			const db = createMockDB({ users: [], configs: [] });
			const request = createMockRequest({ url: baseUrl });
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'nonexistent', slug: 'config' },
				url: new URL(baseUrl),
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(404);
			const json = await getJSON(response);
			expect(json.error).toContain('User not found');
		});

		it('should return 404 when config not found', async () => {
			const db = createMockDB({ users: [mockUser], configs: [] });
			const request = createMockRequest({ url: baseUrl });
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'nonexistent' },
				url: new URL(baseUrl),
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(404);
			const json = await getJSON(response);
			expect(json.error).toContain('Config not found');
		});

		it('should reject private config with token belonging to different user', async () => {
			const otherUserToken = {
				...mockApiToken,
				id: 'tok_other',
				user_id: 'other_user_id',
				token: 'obt_otheruser1234567890abcdefghijklmnop'
			};
			const db = createMockDB({
				users: [mockUser],
				configs: [mockPrivateConfig],
				api_tokens: [otherUserToken]
			});

			const request = createMockRequest({
				url: baseUrl,
				headers: { authorization: createBearerToken(otherUserToken.token) }
			});
			const platform = createMockPlatform(db);

			const response = await GET({
				request,
				platform,
				params: { username: 'testuser', slug: 'private-config' },
				url: new URL(baseUrl),
				route: { id: '/[username]/[slug]/config' },
				locals: {},
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				getClientAddress: () => '',
				fetch: globalThis.fetch
			});

			expect(response.status).toBe(403);
		});
	});
});
