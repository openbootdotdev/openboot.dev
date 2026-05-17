/**
 * Tests for /api/configs GET/POST endpoints.
 * Runs inside Workers runtime with real D1 (via vitest-pool-workers).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { GET, POST } from './+server';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockConfig, mockPublicConfig, mockPrivateConfig, mockApiToken } from '$lib/test/fixtures';

const db = env.DB;
const baseUrl = 'http://localhost:5173/api/configs';

// users table has no provider/provider_id columns — that's auth-app metadata.
const userRow = () => strip(mockUser, 'provider', 'provider_id');

beforeEach(async () => {
	await resetDb(db);
});

describe('GET /api/configs', () => {
	it('rejects request without auth', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig] });

		const response = await call(GET, { url: baseUrl });

		expect(response.status).toBe(401);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Unauthorized');
	});

	it('returns empty list for user with no configs', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await call(GET, { url: baseUrl, token: mockApiToken.token });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { configs: unknown[]; username: string };
		expect(json.configs).toEqual([]);
		expect(json.username).toBe('testuser');
	});

	it('returns all user configs with visibility field', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPublicConfig, mockPrivateConfig, mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(GET, { url: baseUrl, token: mockApiToken.token });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { configs: { visibility: string }[] };
		expect(json.configs).toHaveLength(3);
		const visibilities = new Set(json.configs.map((c) => c.visibility));
		expect(visibilities).toEqual(new Set(['public', 'private', 'unlisted']));
	});

	it('parses snapshot JSON in response', async () => {
		const configWithSnapshot = {
			...mockConfig,
			snapshot: JSON.stringify({ packages: { formulas: ['git'] } })
		};
		await seed(db, {
			users: [userRow()],
			configs: [configWithSnapshot],
			api_tokens: [mockApiToken]
		});

		const response = await call(GET, { url: baseUrl, token: mockApiToken.token });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { configs: { snapshot: unknown }[] };
		expect(json.configs[0].snapshot).toEqual({ packages: { formulas: ['git'] } });
	});
});

describe('POST /api/configs', () => {
	const authed = (body: unknown) => call(POST, { url: baseUrl, method: 'POST', token: mockApiToken.token, body });

	it('rejects request without auth', async () => {
		await seed(db, { users: [userRow()] });

		const response = await call(POST, {
			url: baseUrl,
			method: 'POST',
			body: { name: 'New Config' }
		});

		expect(response.status).toBe(401);
	});

	it('rejects invalid JSON body', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await call(POST, {
			url: baseUrl,
			method: 'POST',
			token: mockApiToken.token,
			headers: { 'content-type': 'application/json' },
			body: 'invalid json {'
		});

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Invalid request body');
	});

	it('rejects POST without name field', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authed({ description: 'No name provided' });

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Name is required');
	});

	describe('visibility validation', () => {
		beforeEach(async () => {
			await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });
		});

		for (const visibility of ['public', 'unlisted', 'private'] as const) {
			it(`creates config with visibility=${visibility}`, async () => {
				const response = await authed({ name: `${visibility} Config`, visibility });
				expect(response.status).toBe(201);
				const json = (await response.json()) as { id: string };
				expect(json.id).toBeDefined();
			});
		}

		it('rejects invalid visibility value', async () => {
			const response = await authed({ name: 'Bad Config', visibility: 'invalid' });
			expect(response.status).toBe(400);
			const json = (await response.json()) as { error: string };
			expect(json.error).toContain('Invalid visibility');
			expect(json.error).toContain('public, unlisted, or private');
		});

		it('rejects visibility=secret', async () => {
			const response = await authed({ name: 'Secret Config', visibility: 'secret' });
			expect(response.status).toBe(400);
		});

		it('defaults to unlisted when visibility not provided', async () => {
			const response = await authed({ name: 'Default Visibility Config' });
			expect(response.status).toBe(201);
		});
	});

	it('rejects duplicate config name (same slug)', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authed({ name: 'My Config' });

		expect(response.status).toBe(409);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('already exists');
	});

	it('creates config with all optional fields', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authed({
			name: 'Full Config',
			description: 'Complete config with all fields',
			base_preset: 'full',
			packages: [{ name: 'git', type: 'formula' }],
			custom_script: 'echo "test"',
			visibility: 'public',
			alias: 'fullcfg',
			dotfiles_repo: 'https://github.com/user/dotfiles'
		});

		expect(response.status).toBe(201);
		const json = (await response.json()) as { id: string; slug: string; alias: string; install_url: string };
		expect(json.id).toBeDefined();
		expect(json.slug).toBe('full-config');
		expect(json.alias).toBe('fullcfg');
		expect(json.install_url).toContain('fullcfg');
	});

	it('returns install_url with alias when provided', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authed({ name: 'Aliased Config', alias: 'myalias' });

		expect(response.status).toBe(201);
		const json = (await response.json()) as { alias: string; install_url: string };
		expect(json.alias).toBe('myalias');
		expect(json.install_url).toContain('myalias');
	});

	it('returns install_url with username/slug when no alias', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authed({ name: 'No Alias Config' });

		expect(response.status).toBe(201);
		const json = (await response.json()) as { alias: string | null; install_url: string };
		expect(json.alias).toBeNull();
		expect(json.install_url).toContain('testuser');
		expect(json.install_url).toContain('no-alias-config');
	});

	it('rejects alias that is too short', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authed({ name: 'Config', alias: 'a' });

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Alias must be at least 2 characters');
	});

	it('rejects reserved alias names', async () => {
		const reserved = ['api', 'install', 'dashboard', 'login', 'docs', 'cli-auth', 'explore'];
		for (const alias of reserved) {
			await resetDb(db);
			await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

			const response = await authed({ name: `Config ${alias}`, alias });

			expect(response.status).toBe(400);
			const json = (await response.json()) as { error: string };
			expect(json.error).toContain('reserved');
		}
	});

	it('rejects duplicate alias', async () => {
		const existingConfig = { ...mockConfig, alias: 'taken' };
		await seed(db, {
			users: [userRow()],
			configs: [existingConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authed({ name: 'Another Config', alias: 'taken' });

		expect(response.status).toBe(409);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('already taken');
	});

	it('enforces max 20 configs per user', async () => {
		const configs = Array.from({ length: 20 }, (_, i) => ({
			...mockConfig,
			id: `cfg_${i}`,
			slug: `config-${i}`,
			name: `Config ${i}`,
			alias: null
		}));
		await seed(db, {
			users: [userRow()],
			configs,
			api_tokens: [mockApiToken]
		});

		const response = await authed({ name: 'Config 21' });

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Maximum 20 configs');
	});
});
