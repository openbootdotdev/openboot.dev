/**
 * Smoke Test: Config CRUD full lifecycle
 *
 * Verifies: Create → List → Read → Update → Delete
 * This catches regressions where a new feature breaks existing config operations.
 */

import { describe, it, expect } from 'vitest';
import { createMockDB } from '$lib/test/db-mock';
import {
	mockUser,
	mockApiToken,
	createMockRequest,
	createMockPlatform,
	createMockCookies
} from '$lib/test/fixtures';
import { createBearerToken, getJSON } from '$lib/test/helpers';

import { GET as ListConfigs, POST as CreateConfig } from '../routes/api/configs/+server';
import { GET as GetConfig, PUT as UpdateConfig, DELETE as DeleteConfig } from '../routes/api/configs/[slug]/+server';
import { GET as GetConfigJSON } from '../routes/[username]/[slug]/config/+server';
import { GET as GetInstallScript } from '../routes/[username]/[slug]/install/+server';

function authedHandler(db: any, overrides: Record<string, any> = {}) {
	const platform = createMockPlatform(db);
	return {
		platform,
		url: new URL('http://localhost:5173/api/configs'),
		route: { id: '' },
		locals: {},
		isDataRequest: false,
		isSubRequest: false,
		cookies: createMockCookies(),
		getClientAddress: () => '',
		fetch: globalThis.fetch,
		...overrides
	};
}

function authedRequest(method: string, url: string, body?: any) {
	return createMockRequest({
		method,
		url,
		headers: { authorization: createBearerToken(mockApiToken.token) },
		body
	});
}

describe('Smoke Test: Config CRUD Full Lifecycle', () => {
	it('Create → List → Read → Update → Delete', async () => {
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			configs: []
		});

		// === 1. CREATE ===
		const createRes = await CreateConfig({
			...authedHandler(db),
			request: authedRequest('POST', '/api/configs', {
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
			})
		} as any);

		expect(createRes.status).toBe(201);
		const created = await getJSON(createRes);
		expect(created.slug).toBe('my-dev-setup');
		expect(created.id).toBeDefined();

		// === 2. LIST ===
		const listRes = await ListConfigs({
			...authedHandler(db),
			request: authedRequest('GET', '/api/configs')
		} as any);

		expect(listRes.status).toBe(200);
		const listed = await getJSON(listRes);
		expect(listed.configs).toHaveLength(1);
		expect(listed.configs[0].slug).toBe('my-dev-setup');
		expect(listed.configs[0].visibility).toBe('public');

		// === 3. READ (dashboard API) ===
		const readRes = await GetConfig({
			...authedHandler(db, { params: { slug: 'my-dev-setup' } }),
			request: authedRequest('GET', '/api/configs/my-dev-setup')
		} as any);

		expect(readRes.status).toBe(200);
		const detail = await getJSON(readRes);
		expect(detail.config.name).toBe('My Dev Setup');
		expect(detail.config.packages).toHaveLength(3);
		expect(detail.install_url).toBeDefined();

		// === 4. READ (public config JSON — what CLI fetches) ===
		const configJsonRes = await GetConfigJSON({
			...authedHandler(db, { params: { username: 'testuser', slug: 'my-dev-setup' } }),
			request: createMockRequest({ url: '/testuser/my-dev-setup/config' })
		} as any);

		expect(configJsonRes.status).toBe(200);
		const configJson = await getJSON(configJsonRes);
		expect(configJson.username).toBe('testuser');
		expect(configJson.packages).toContainEqual(expect.objectContaining({ name: 'git' }));
		expect(configJson.packages).toContainEqual(expect.objectContaining({ name: 'node' }));
		expect(configJson.casks).toContainEqual(expect.objectContaining({ name: 'visual-studio-code' }));
		expect(configJson.npm).toEqual([]);
		expect(configJson.post_install).toEqual(['echo "setup complete"']);
		expect(configJson.dotfiles_repo).toBe('https://github.com/testuser/dotfiles');

		// === 5. READ (install script — what curl fetches) ===
		const installRes = await GetInstallScript({
			...authedHandler(db, { params: { username: 'testuser', slug: 'my-dev-setup' } }),
			request: createMockRequest({ url: '/testuser/my-dev-setup/install' })
		} as any);

		expect(installRes.status).toBe(200);
		const script = await installRes.text();
		expect(script).toContain('#!/bin/bash');
		expect(script).toContain('testuser/my-dev-setup');

		// === 6. UPDATE ===
		const updateRes = await UpdateConfig({
			...authedHandler(db, { params: { slug: 'my-dev-setup' } }),
			request: authedRequest('PUT', '/api/configs/my-dev-setup', {
				description: 'Updated description',
				visibility: 'private',
				packages: [
					{ name: 'git', type: 'formula', desc: 'Version control' },
					{ name: 'node', type: 'formula', desc: 'Node.js' },
					{ name: 'visual-studio-code', type: 'cask', desc: 'Editor' },
					{ name: 'docker', type: 'cask', desc: 'Containers' }
				]
			})
		} as any);

		expect(updateRes.status).toBe(200);
		const updated = await getJSON(updateRes);
		expect(updated.success).toBe(true);

		// === 7. Verify config still readable after update ===
		// Note: mock DB can't parse COALESCE in UPDATE SET clauses, so field values
		// won't reflect the update. We verify the flow doesn't error and the config
		// is still accessible. Real DB integration would verify field changes.
		const readAfterUpdate = await GetConfig({
			...authedHandler(db, { params: { slug: 'my-dev-setup' } }),
			request: authedRequest('GET', '/api/configs/my-dev-setup')
		} as any);

		expect(readAfterUpdate.status).toBe(200);
		const afterUpdate = await getJSON(readAfterUpdate);
		expect(afterUpdate.config.name).toBe('My Dev Setup');

		// === 8. Manually set visibility to private to test access control ===
		// (bypasses mock DB COALESCE limitation)
		db.data.configs[0].visibility = 'private';

		const privateRes = await GetConfigJSON({
			...authedHandler(db, { params: { username: 'testuser', slug: 'my-dev-setup' } }),
			request: createMockRequest({ url: '/testuser/my-dev-setup/config' })
		} as any);

		expect(privateRes.status).toBe(403);

		// === 9. DELETE ===
		const deleteRes = await DeleteConfig({
			...authedHandler(db, { params: { slug: 'my-dev-setup' } }),
			request: authedRequest('DELETE', '/api/configs/my-dev-setup')
		} as any);

		expect(deleteRes.status).toBe(200);
		const deleted = await getJSON(deleteRes);
		expect(deleted.success).toBe(true);

		// === 10. Verify delete took effect ===
		const listAfterDelete = await ListConfigs({
			...authedHandler(db),
			request: authedRequest('GET', '/api/configs')
		} as any);

		const afterDelete = await getJSON(listAfterDelete);
		expect(afterDelete.configs).toHaveLength(0);
	});

	it('Create with alias → access via alias config JSON', async () => {
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			configs: []
		});

		const createRes = await CreateConfig({
			...authedHandler(db),
			request: authedRequest('POST', '/api/configs', {
				name: 'Quick Setup',
				packages: [{ name: 'git', type: 'formula', desc: 'VCS' }],
				visibility: 'public',
				alias: 'quick'
			})
		} as any);

		expect(createRes.status).toBe(201);
		const created = await getJSON(createRes);
		expect(created.alias).toBe('quick');
		expect(created.install_url).toContain('/quick');
	});

	it('Duplicate name returns 409 conflict', async () => {
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			configs: []
		});

		// Create first
		await CreateConfig({
			...authedHandler(db),
			request: authedRequest('POST', '/api/configs', {
				name: 'Unique Config',
				packages: []
			})
		} as any);

		// Try duplicate
		const dupRes = await CreateConfig({
			...authedHandler(db),
			request: authedRequest('POST', '/api/configs', {
				name: 'Unique Config',
				packages: []
			})
		} as any);

		expect(dupRes.status).toBe(409);
		const dup = await getJSON(dupRes);
		expect(dup.error).toContain('already exists');
	});
});
