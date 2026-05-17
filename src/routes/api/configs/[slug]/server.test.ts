/**
 * Tests for /api/configs/[slug] GET/PUT/DELETE endpoints.
 * Runs inside Workers runtime with real D1 (via vitest-pool-workers).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { GET, PUT, DELETE } from './+server';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockConfig, mockPublicConfig, mockApiToken } from '$lib/test/fixtures';

const db = env.DB;
const baseUrl = 'http://localhost:5173/api/configs/my-config';
const userRow = () => strip(mockUser, 'provider', 'provider_id');

const callOpts = (overrides: Record<string, unknown> = {}) => ({
	url: baseUrl,
	route: { id: '/api/configs/[slug]' },
	params: { slug: 'my-config' },
	...overrides
});

beforeEach(async () => {
	await resetDb(db);
});

describe('GET /api/configs/[slug]', () => {
	it('rejects request without auth', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig] });

		const response = await call(GET, callOpts());

		expect(response.status).toBe(401);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Unauthorized');
	});

	it('returns 404 for non-existent config', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await call(GET, callOpts({ token: mockApiToken.token, params: { slug: 'nonexistent' } }));

		expect(response.status).toBe(404);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Config not found');
	});

	it('returns config with all fields', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(GET, callOpts({ token: mockApiToken.token }));

		expect(response.status).toBe(200);
		const json = (await response.json()) as {
			config: { id: string; slug: string; name: string; visibility: string };
			install_url: string;
		};
		expect(json.config.id).toBe('cfg_test123');
		expect(json.config.slug).toBe('my-config');
		expect(json.config.name).toBe('My Test Config');
		expect(json.config.visibility).toBe('unlisted');
		expect(json.install_url).toBeDefined();
	});

	it('returns install_url with alias when present', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(GET, callOpts({ token: mockApiToken.token }));

		expect(response.status).toBe(200);
		const json = (await response.json()) as { install_url: string };
		expect(json.install_url).toContain('myconfig');
	});

	it('parses packages correctly', async () => {
		const configWithPackages = {
			...mockConfig,
			packages: JSON.stringify([
				{ name: 'git', type: 'formula' },
				{ name: 'visual-studio-code', type: 'cask' }
			])
		};
		await seed(db, {
			users: [userRow()],
			configs: [configWithPackages],
			api_tokens: [mockApiToken]
		});

		const response = await call(GET, callOpts({ token: mockApiToken.token }));

		expect(response.status).toBe(200);
		const json = (await response.json()) as {
			config: { packages: { name: string; type: string }[] };
		};
		expect(json.config.packages).toHaveLength(2);
		expect(json.config.packages[0].name).toBe('git');
		expect(json.config.packages[1].type).toBe('cask');
	});
});

describe('PUT /api/configs/[slug]', () => {
	const authedPut = (body: unknown, overrides: Record<string, unknown> = {}) =>
		call(PUT, callOpts({ method: 'PUT', token: mockApiToken.token, body, ...overrides }));

	it('rejects request without auth', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig] });

		const response = await call(PUT, callOpts({ method: 'PUT', body: { name: 'Updated' } }));

		expect(response.status).toBe(401);
	});

	it('rejects invalid JSON body', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(
			PUT,
			callOpts({
				method: 'PUT',
				token: mockApiToken.token,
				headers: { 'content-type': 'application/json' },
				body: 'invalid json {'
			})
		);

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Invalid request body');
	});

	it('returns 404 for non-existent config', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authedPut({ name: 'Updated' }, { params: { slug: 'nonexistent' } });

		expect(response.status).toBe(404);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('Config not found');
	});

	describe('visibility validation', () => {
		beforeEach(async () => {
			await seed(db, {
				users: [userRow()],
				configs: [mockConfig],
				api_tokens: [mockApiToken]
			});
		});

		for (const visibility of ['public', 'private'] as const) {
			it(`updates config with visibility=${visibility}`, async () => {
				const response = await authedPut({ visibility });
				expect(response.status).toBe(200);
				const json = (await response.json()) as { success: boolean };
				expect(json.success).toBe(true);
			});
		}

		it('rejects invalid visibility value', async () => {
			const response = await authedPut({ visibility: 'invalid' });
			expect(response.status).toBe(400);
			const json = (await response.json()) as { error: string };
			expect(json.error).toContain('Invalid visibility');
			expect(json.error).toContain('public, unlisted, or private');
		});

		it('rejects visibility=secret', async () => {
			const response = await authedPut({ visibility: 'secret' });
			expect(response.status).toBe(400);
		});

		it('allows undefined visibility (no change)', async () => {
			const response = await authedPut({ name: 'Updated Name' });
			expect(response.status).toBe(200);
			const json = (await response.json()) as { success: boolean };
			expect(json.success).toBe(true);
		});
	});

	it('updates visibility=unlisted on a public config', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPublicConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authedPut({ visibility: 'unlisted' }, { params: { slug: 'public-config' } });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { success: boolean };
		expect(json.success).toBe(true);
	});

	it('updates config name and slug', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authedPut({ name: 'Renamed Config' });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { success: boolean; slug: string };
		expect(json.success).toBe(true);
		expect(json.slug).toBe('renamed-config');
	});

	it('rejects duplicate name (slug conflict)', async () => {
		const config2 = {
			...mockConfig,
			id: 'cfg_2',
			slug: 'other-config',
			name: 'Other Config',
			alias: null
		};
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig, config2],
			api_tokens: [mockApiToken]
		});

		const response = await authedPut({ name: 'Other Config' });

		expect(response.status).toBe(409);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('already exists');
	});

	it('updates alias', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authedPut({ alias: 'newalias' });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { alias: string };
		expect(json.alias).toBe('newalias');
	});

	it('clears alias when set to empty string', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authedPut({ alias: '' });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { alias: string | null };
		expect(json.alias).toBeNull();
	});

	it('rejects duplicate alias', async () => {
		const config2 = { ...mockConfig, id: 'cfg_2', slug: 'other-config', alias: 'taken' };
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig, config2],
			api_tokens: [mockApiToken]
		});

		const response = await authedPut({ alias: 'taken' });

		expect(response.status).toBe(409);
		const json = (await response.json()) as { error: string };
		expect(json.error).toContain('already taken');
	});

	it('updates description', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authedPut({ description: 'New description' });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { success: boolean };
		expect(json.success).toBe(true);
	});

	it('updates multiple fields at once', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authedPut({
			name: 'Multi Update',
			description: 'Updated description',
			visibility: 'public',
			alias: 'multiupdate'
		});

		expect(response.status).toBe(200);
		const json = (await response.json()) as { success: boolean; slug: string; alias: string };
		expect(json.success).toBe(true);
		expect(json.slug).toBe('multi-update');
		expect(json.alias).toBe('multiupdate');
	});
});

describe('DELETE /api/configs/[slug]', () => {
	const authedDelete = (overrides: Record<string, unknown> = {}) =>
		call(DELETE, callOpts({ method: 'DELETE', token: mockApiToken.token, ...overrides }));

	it('rejects request without auth', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig] });

		const response = await call(DELETE, callOpts({ method: 'DELETE' }));

		expect(response.status).toBe(401);
	});

	it('deletes config successfully', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken]
		});

		const response = await authedDelete();

		expect(response.status).toBe(200);
		const remaining = await db.prepare('SELECT id FROM configs WHERE id = ?').bind(mockConfig.id).first();
		expect(remaining).toBeNull();
	});

	it('silently succeeds for non-existent config', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const response = await authedDelete({ params: { slug: 'nonexistent' } });

		expect(response.status).toBe(200);
		const json = (await response.json()) as { success: boolean };
		expect(json.success).toBe(true);
	});

	it('deletes only the specified config', async () => {
		const config2 = { ...mockConfig, id: 'cfg_2', slug: 'other-config', alias: null };
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig, config2],
			api_tokens: [mockApiToken]
		});

		const response = await authedDelete();

		expect(response.status).toBe(200);
		const survivor = await db.prepare('SELECT id FROM configs WHERE id = ?').bind('cfg_2').first();
		expect(survivor).not.toBeNull();
	});
});
