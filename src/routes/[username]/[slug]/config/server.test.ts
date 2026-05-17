/**
 * Tests for config JSON endpoint.
 * Runs inside Workers runtime with real D1 (via vitest-pool-workers).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { GET } from './+server';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockPublicConfig, mockPrivateConfig, mockApiToken, mockExpiredApiToken } from '$lib/test/fixtures';

const db = env.DB;
const baseUrl = 'http://localhost:5173/testuser/my-config/config';
const userRow = () => strip(mockUser, 'provider', 'provider_id');

const opts = (overrides: Record<string, unknown> = {}) => ({
	url: baseUrl,
	route: { id: '/[username]/[slug]/config' },
	params: { username: 'testuser', slug: 'my-config' },
	...overrides
});

const seedPublic = (config: Record<string, unknown>) => seed(db, { users: [userRow()], configs: [config] });

beforeEach(async () => {
	await resetDb(db);
});

describe('public configs', () => {
	it('returns config JSON without auth', async () => {
		await seedPublic(mockPublicConfig);

		const response = await call(GET, opts({ params: { username: 'testuser', slug: 'public-config' } }));

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');
		const json = (await response.json()) as Record<string, any>;
		expect(json.username).toBe('testuser');
		expect(json.slug).toBe('public-config');
		expect(json.name).toBe('Public Config');
		expect(json.preset).toBe('developer');
		expect(json.packages).toBeDefined();
	});
});

describe('private configs — auth required', () => {
	it('rejects private config without auth header', async () => {
		await seedPublic(mockPrivateConfig);

		const response = await call(GET, opts({ params: { username: 'testuser', slug: 'private-config' } }));

		expect(response.status).toBe(403);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Config is private');
	});

	it('rejects private config with invalid token', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPrivateConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(
			GET,
			opts({ params: { username: 'testuser', slug: 'private-config' }, token: 'obt_invalid_token_123' })
		);

		expect(response.status).toBe(403);
	});

	it('rejects private config with expired token', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPrivateConfig],
			api_tokens: [mockExpiredApiToken]
		});

		const response = await call(
			GET,
			opts({ params: { username: 'testuser', slug: 'private-config' }, token: mockExpiredApiToken.token })
		);

		expect(response.status).toBe(403);
	});

	it('returns config JSON with valid owner token', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPrivateConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(
			GET,
			opts({ params: { username: 'testuser', slug: 'private-config' }, token: mockApiToken.token })
		);

		expect(response.status).toBe(200);
		const json = (await response.json()) as Record<string, any>;
		expect(json.username).toBe('testuser');
		expect(json.slug).toBe('private-config');
		expect(json.name).toBe('Private Config');
		expect(json.preset).toBe('developer');
		expect(json.packages).toBeDefined();
		expect(json.casks).toBeDefined();
		expect(json.taps).toBeDefined();
		expect(json.npm).toBeDefined();
	});

	it('rejects private config with token belonging to different user', async () => {
		const otherUser = { ...userRow(), id: 'other_user_id', username: 'otheruser' };
		const otherToken = {
			...mockApiToken,
			id: 'tok_other',
			user_id: 'other_user_id',
			token: 'obt_otheruser1234567890abcdefghijklmnop'
		};
		await seed(db, {
			users: [userRow(), otherUser],
			configs: [mockPrivateConfig],
			api_tokens: [otherToken]
		});

		const response = await call(
			GET,
			opts({ params: { username: 'testuser', slug: 'private-config' }, token: otherToken.token })
		);

		expect(response.status).toBe(403);
	});
});

describe('data parsing', () => {
	const publicOpts = opts({ params: { username: 'testuser', slug: 'public-config' } });
	const callPublic = () => call(GET, publicOpts);

	it('routes packages by type (formula/cask/npm)', async () => {
		await seedPublic({
			...mockPublicConfig,
			packages: JSON.stringify([
				{ name: 'git', type: 'formula', desc: 'Version control' },
				{ name: 'visual-studio-code', type: 'cask', desc: 'Editor' },
				{ name: 'typescript', type: 'npm', desc: 'TypeScript' }
			])
		});

		const json = (await (await callPublic()).json()) as {
			packages: { name: string }[];
			casks: { name: string }[];
			npm: { name: string }[];
		};
		expect(json.packages).toContainEqual(expect.objectContaining({ name: 'git' }));
		expect(json.packages.map((p) => p.name)).not.toContain('visual-studio-code');
		expect(json.casks).toContainEqual(expect.objectContaining({ name: 'visual-studio-code' }));
		expect(json.npm).toContainEqual(expect.objectContaining({ name: 'typescript' }));
	});

	it('parses snapshot for taps and casks', async () => {
		await seedPublic({
			...mockPublicConfig,
			snapshot: JSON.stringify({
				packages: { taps: ['homebrew/cask-fonts'], casks: ['font-fira-code'] }
			})
		});

		const json = (await (await callPublic()).json()) as { taps: string[] };
		expect(json.taps).toContain('homebrew/cask-fonts');
	});

	it('does not include shell in API response', async () => {
		await seedPublic({
			...mockPublicConfig,
			snapshot: JSON.stringify({
				packages: { taps: [], casks: [] },
				shell: { oh_my_zsh: true, theme: 'powerlevel10k', plugins: ['git', 'zsh-autosuggestions'] }
			})
		});

		const json = (await (await callPublic()).json()) as { shell?: unknown };
		expect(json.shell).toBeUndefined();
	});

	it('parses macos_prefs from snapshot', async () => {
		await seedPublic({
			...mockPublicConfig,
			snapshot: JSON.stringify({
				packages: { taps: [], casks: [] },
				macos_prefs: [
					{ domain: 'NSGlobalDomain', key: 'AppleShowAllExtensions', value: 'true', desc: 'Show extensions' },
					{ domain: 'com.apple.dock', key: 'autohide', value: 'true', desc: 'Auto-hide dock' }
				]
			})
		});

		const json = (await (await callPublic()).json()) as { macos_prefs: { domain: string; key: string }[] };
		expect(json.macos_prefs).toHaveLength(2);
		expect(json.macos_prefs[0].domain).toBe('NSGlobalDomain');
		expect(json.macos_prefs[1].key).toBe('autohide');
	});

	it('preserves host="currentHost" and omits it when empty', async () => {
		await seedPublic({
			...mockPublicConfig,
			snapshot: JSON.stringify({
				packages: { taps: [], casks: [] },
				macos_prefs: [
					{ domain: 'com.apple.controlcenter', key: 'Sound', type: 'int', value: '18', desc: 'd', host: 'currentHost' },
					{ domain: 'NSGlobalDomain', key: 'AppleShowAllExtensions', type: 'bool', value: 'true', desc: 'd' }
				]
			})
		});

		const json = (await (await callPublic()).json()) as { macos_prefs: { host?: string }[] };
		expect(json.macos_prefs).toHaveLength(2);
		expect(json.macos_prefs[0].host).toBe('currentHost');
		expect(json.macos_prefs[1]).not.toHaveProperty('host');
	});

	it('filters out invalid macos_prefs entries', async () => {
		await seedPublic({
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
		});

		const json = (await (await callPublic()).json()) as { macos_prefs: { domain: string }[] };
		expect(json.macos_prefs).toHaveLength(1);
		expect(json.macos_prefs[0].domain).toBe('NSGlobalDomain');
	});

	it('returns null macos_prefs when empty array', async () => {
		await seedPublic({
			...mockPublicConfig,
			snapshot: JSON.stringify({
				packages: { taps: [], casks: [] },
				macos_prefs: []
			})
		});

		const json = (await (await callPublic()).json()) as { macos_prefs: unknown };
		expect(json.macos_prefs).toBeNull();
	});

	it('handles invalid snapshot JSON gracefully', async () => {
		await seedPublic({ ...mockPublicConfig, snapshot: '{invalid json' });

		const response = await callPublic();
		expect(response.status).toBe(200);
		const json = (await response.json()) as { shell?: unknown; macos_prefs: unknown };
		expect(json.shell).toBeUndefined();
		expect(json.macos_prefs).toBeNull();
	});

	it('handles string packages (legacy format)', async () => {
		await seedPublic({
			...mockPublicConfig,
			packages: JSON.stringify(['git', 'curl', 'wget']),
			snapshot: JSON.stringify({ packages: { taps: [], casks: ['curl'] } })
		});

		const json = (await (await callPublic()).json()) as {
			packages: { name: string }[];
			casks: { name: string }[];
		};
		expect(json.packages.map((p) => p.name)).toEqual(['git', 'wget']);
		expect(json.casks).toContainEqual(expect.objectContaining({ name: 'curl' }));
	});

	it('extracts taps from fully-qualified package names', async () => {
		await seedPublic({
			...mockPublicConfig,
			packages: JSON.stringify([{ name: 'homebrew/cask-fonts/font-fira-code', type: 'formula', desc: 'Font' }])
		});

		const json = (await (await callPublic()).json()) as { taps: string[] };
		expect(json.taps).toContain('homebrew/cask-fonts');
	});

	it('parses custom_script into post_install lines', async () => {
		await seedPublic({
			...mockPublicConfig,
			custom_script: 'echo "line1"\n\necho "line2"\n  \necho "line3"'
		});

		const json = (await (await callPublic()).json()) as { post_install: string[] };
		expect(json.post_install).toEqual(['echo "line1"', 'echo "line2"', 'echo "line3"']);
	});

	it('returns empty post_install when no custom_script', async () => {
		await seedPublic({ ...mockPublicConfig, custom_script: null });

		const json = (await (await callPublic()).json()) as { post_install: unknown[] };
		expect(json.post_install).toEqual([]);
	});

	it('returns empty dotfiles_repo when not set', async () => {
		await seedPublic({ ...mockPublicConfig, dotfiles_repo: null });

		const json = (await (await callPublic()).json()) as { dotfiles_repo: string };
		expect(json.dotfiles_repo).toBe('');
	});

	it('handles typed objects with desc (from-snapshot format)', async () => {
		await seedPublic({
			...mockPublicConfig,
			packages: JSON.stringify([
				{ name: 'git', type: 'formula', desc: 'Version control' },
				{ name: 'docker', type: 'cask', desc: 'Containers' },
				{ name: 'typescript', type: 'npm', desc: 'Typed JS' },
				{ name: 'homebrew/cask-fonts', type: 'tap' }
			])
		});

		const json = (await (await callPublic()).json()) as {
			packages: { name: string; desc?: string }[];
			casks: { name: string; desc: string }[];
			npm: { name: string; desc: string }[];
		};
		expect(json.packages).toContainEqual({ name: 'git', desc: 'Version control' });
		expect(json.packages).toContainEqual(expect.objectContaining({ name: 'homebrew/cask-fonts' }));
		expect(json.casks).toContainEqual({ name: 'docker', desc: 'Containers' });
		expect(json.npm).toContainEqual({ name: 'typescript', desc: 'Typed JS' });
	});

	it('handles typed objects without desc (fills from metadata)', async () => {
		await seedPublic({
			...mockPublicConfig,
			packages: JSON.stringify([
				{ name: 'curl', type: 'formula' },
				{ name: 'warp', type: 'cask' }
			])
		});

		const json = (await (await callPublic()).json()) as {
			packages: { name: string; desc: string }[];
		};
		const curlPkg = json.packages.find((p) => p.name === 'curl');
		expect(curlPkg).toBeDefined();
		expect(curlPkg!.desc).toBeTruthy();
		expect(curlPkg!.desc).not.toBe('curl');
	});

	it('handles mixed format (strings + typed objects)', async () => {
		await seedPublic({
			...mockPublicConfig,
			packages: JSON.stringify(['git', { name: 'docker', type: 'cask' }, 'wget']),
			snapshot: JSON.stringify({ packages: { taps: [], casks: [] } })
		});

		const json = (await (await callPublic()).json()) as {
			packages: { name: string; desc: string }[];
			casks: { name: string; desc: string }[];
		};
		expect(json.packages.map((p) => p.name)).toContain('git');
		expect(json.packages.map((p) => p.name)).toContain('wget');
		expect(json.casks).toContainEqual(expect.objectContaining({ name: 'docker' }));
		for (const pkg of [...json.packages, ...json.casks]) {
			expect(pkg).toHaveProperty('name');
			expect(pkg).toHaveProperty('desc');
		}
	});

	it('handles empty packages', async () => {
		await seedPublic({ ...mockPublicConfig, packages: '[]' });

		const json = (await (await callPublic()).json()) as {
			packages: unknown[];
			casks: unknown[];
			npm: unknown[];
			taps: unknown[];
		};
		expect(json.packages).toEqual([]);
		expect(json.casks).toEqual([]);
		expect(json.npm).toEqual([]);
		expect(json.taps).toEqual([]);
	});
});

describe('error handling', () => {
	it('returns 500 when platform env missing', async () => {
		const response = await GET({
			request: new Request(baseUrl),
			platform: { env: undefined },
			url: new URL(baseUrl),
			route: { id: '/[username]/[slug]/config' },
			params: { username: 'testuser', slug: 'public-config' },
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

	it('returns 404 when user not found', async () => {
		const response = await call(GET, opts({ params: { username: 'nonexistent', slug: 'config' } }));

		expect(response.status).toBe(404);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('User not found');
	});

	it('returns 404 when config not found', async () => {
		await seed(db, { users: [userRow()] });

		const response = await call(GET, opts({ params: { username: 'testuser', slug: 'nonexistent' } }));

		expect(response.status).toBe(404);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Config not found');
	});
});
