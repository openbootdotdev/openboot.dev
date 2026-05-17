/**
 * Smoke Test: Config CRUD full lifecycle.
 * Create → List → Read → Update → Delete, end-to-end on real D1.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockApiToken } from '$lib/test/fixtures';

import { GET as ListConfigs, POST as CreateConfig } from '../routes/api/configs/+server';
import { GET as GetConfig, PUT as UpdateConfig, DELETE as DeleteConfig } from '../routes/api/configs/[slug]/+server';
import { GET as GetConfigJSON } from '../routes/[username]/[slug]/config/+server';
import { GET as GetInstallScript } from '../routes/[username]/[slug]/install/+server';

const db = env.DB;
const userRow = () => strip(mockUser, 'provider', 'provider_id');

beforeEach(async () => {
	await resetDb(db);
	await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });
});

describe('Smoke — Config CRUD full lifecycle', () => {
	it('Create → List → Read → Update → Delete', async () => {
		const baseUrl = 'http://localhost:5173/api/configs';

		// CREATE
		const createRes = await call(CreateConfig, {
			url: baseUrl,
			method: 'POST',
			token: mockApiToken.token,
			body: {
				name: 'My Dev Setup',
				description: 'Full stack dev config',
				base_preset: 'developer',
				packages: [
					{ name: 'git', type: 'formula', desc: 'Version control' },
					{ name: 'node', type: 'formula', desc: 'Node.js' },
					{ name: 'visual-studio-code', type: 'cask', desc: 'Editor' }
				],
				visibility: 'public',
				custom_script: 'echo "setup complete"',
				dotfiles_repo: 'https://github.com/testuser/dotfiles'
			}
		});
		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as { slug: string; id: string };
		expect(created.slug).toBe('my-dev-setup');
		expect(created.id).toBeDefined();

		// LIST
		const listRes = await call(ListConfigs, { url: baseUrl, token: mockApiToken.token });
		expect(listRes.status).toBe(200);
		const listed = (await listRes.json()) as {
			configs: { slug: string; visibility: string }[];
		};
		expect(listed.configs).toHaveLength(1);
		expect(listed.configs[0].slug).toBe('my-dev-setup');
		expect(listed.configs[0].visibility).toBe('public');

		// READ (dashboard API)
		const readRes = await call(GetConfig, {
			url: `${baseUrl}/my-dev-setup`,
			token: mockApiToken.token,
			params: { slug: 'my-dev-setup' }
		});
		expect(readRes.status).toBe(200);
		const detail = (await readRes.json()) as {
			config: { name: string; packages: unknown[] };
			install_url: string;
		};
		expect(detail.config.name).toBe('My Dev Setup');
		expect(detail.config.packages).toHaveLength(3);
		expect(detail.install_url).toBeDefined();

		// READ (CLI config JSON)
		const configJsonRes = await call(GetConfigJSON, {
			url: 'http://localhost:5173/testuser/my-dev-setup/config',
			params: { username: 'testuser', slug: 'my-dev-setup' }
		});
		expect(configJsonRes.status).toBe(200);
		const configJson = (await configJsonRes.json()) as {
			username: string;
			packages: { name: string }[];
			casks: { name: string }[];
			npm: unknown[];
			post_install: string[];
			dotfiles_repo: string;
		};
		expect(configJson.username).toBe('testuser');
		expect(configJson.packages).toContainEqual(expect.objectContaining({ name: 'git' }));
		expect(configJson.packages).toContainEqual(expect.objectContaining({ name: 'node' }));
		expect(configJson.casks).toContainEqual(expect.objectContaining({ name: 'visual-studio-code' }));
		expect(configJson.npm).toEqual([]);
		expect(configJson.post_install).toEqual(['echo "setup complete"']);
		expect(configJson.dotfiles_repo).toBe('https://github.com/testuser/dotfiles');

		// READ (install script)
		const installRes = await call(GetInstallScript, {
			url: 'http://localhost:5173/testuser/my-dev-setup/install',
			params: { username: 'testuser', slug: 'my-dev-setup' }
		});
		expect(installRes.status).toBe(200);
		const script = await installRes.text();
		expect(script).toContain('#!/bin/bash');
		expect(script).toContain('testuser/my-dev-setup');

		// UPDATE — real D1 honors COALESCE so we can verify field values changed.
		const updateRes = await call(UpdateConfig, {
			url: `${baseUrl}/my-dev-setup`,
			method: 'PUT',
			token: mockApiToken.token,
			params: { slug: 'my-dev-setup' },
			body: {
				description: 'Updated description',
				visibility: 'private',
				packages: [
					{ name: 'git', type: 'formula', desc: 'Version control' },
					{ name: 'node', type: 'formula', desc: 'Node.js' },
					{ name: 'visual-studio-code', type: 'cask', desc: 'Editor' },
					{ name: 'docker', type: 'cask', desc: 'Containers' }
				]
			}
		});
		expect(updateRes.status).toBe(200);

		// Verify the update actually happened in the DB
		const updatedRow = await db
			.prepare('SELECT description, visibility FROM configs WHERE id = ?')
			.bind(created.id)
			.first<{ description: string; visibility: string }>();
		expect(updatedRow?.description).toBe('Updated description');
		expect(updatedRow?.visibility).toBe('private');

		// Verify private access control kicks in
		const privateRes = await call(GetConfigJSON, {
			url: 'http://localhost:5173/testuser/my-dev-setup/config',
			params: { username: 'testuser', slug: 'my-dev-setup' }
		});
		expect(privateRes.status).toBe(403);

		// DELETE
		const deleteRes = await call(DeleteConfig, {
			url: `${baseUrl}/my-dev-setup`,
			method: 'DELETE',
			token: mockApiToken.token,
			params: { slug: 'my-dev-setup' }
		});
		expect(deleteRes.status).toBe(200);

		// Verify delete took effect
		const listAfterDelete = await call(ListConfigs, { url: baseUrl, token: mockApiToken.token });
		const afterDelete = (await listAfterDelete.json()) as { configs: unknown[] };
		expect(afterDelete.configs).toHaveLength(0);
	});

	it('Create with alias → access via alias config JSON', async () => {
		const createRes = await call(CreateConfig, {
			url: 'http://localhost:5173/api/configs',
			method: 'POST',
			token: mockApiToken.token,
			body: {
				name: 'Quick Setup',
				packages: [{ name: 'git', type: 'formula', desc: 'VCS' }],
				visibility: 'public',
				alias: 'quick'
			}
		});

		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as { alias: string; install_url: string };
		expect(created.alias).toBe('quick');
		expect(created.install_url).toContain('/quick');
	});

	it('Duplicate name returns 409 conflict', async () => {
		const baseUrl = 'http://localhost:5173/api/configs';
		const body = { name: 'Unique Config', packages: [] };

		await call(CreateConfig, { url: baseUrl, method: 'POST', token: mockApiToken.token, body });

		const dupRes = await call(CreateConfig, {
			url: baseUrl,
			method: 'POST',
			token: mockApiToken.token,
			body
		});

		expect(dupRes.status).toBe(409);
		const dup = (await dupRes.json()) as { error: string };
		expect(dup.error).toContain('already exists');
	});
});
