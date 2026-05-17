/**
 * Smoke Test: CLI Device Auth full flow.
 * start → approve → poll → use token to access private config, end-to-end on real D1.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockApiToken } from '$lib/test/fixtures';

import { POST as CliStart } from '../routes/api/auth/cli/start/+server';
import { POST as CliApprove } from '../routes/api/auth/cli/approve/+server';
import { GET as CliPoll } from '../routes/api/auth/cli/poll/+server';
import { GET as GetConfigJSON } from '../routes/[username]/[slug]/config/+server';

const db = env.DB;
const userRow = () => strip(mockUser, 'provider', 'provider_id');

beforeEach(async () => {
	await resetDb(db);
});

describe('Smoke — CLI Auth full flow', () => {
	it('start → approve → poll → access private config', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [mockApiToken],
			configs: [
				{
					id: 'cfg_private1',
					user_id: mockUser.id,
					slug: 'secret-setup',
					name: 'Secret Setup',
					base_preset: 'developer',
					packages: JSON.stringify([{ name: 'git', type: 'formula', desc: 'VCS' }]),
					visibility: 'private',
					custom_script: '',
					dotfiles_repo: '',
					snapshot: null,
					alias: null,
					install_count: 0,
					created_at: '2026-01-01T00:00:00Z',
					updated_at: '2026-01-01T00:00:00Z'
				}
			]
		});

		// 1. Verify private config is blocked without auth.
		const blockedRes = await call(GetConfigJSON, {
			url: 'http://localhost:5173/testuser/secret-setup/config',
			params: { username: 'testuser', slug: 'secret-setup' }
		});
		expect(blockedRes.status).toBe(403);

		// 2. CLI starts auth flow.
		const startRes = await call(CliStart, {
			url: 'http://localhost:5173/api/auth/cli/start',
			method: 'POST',
			body: {},
			clientAddress: '127.0.0.42'
		});
		expect(startRes.status).toBe(200);
		const startData = (await startRes.json()) as { code_id: string; code: string };
		expect(startData.code_id).toBeDefined();
		expect(startData.code).toHaveLength(8);

		// 3. Poll — pending.
		const pendingRes = await call(CliPoll, {
			url: `http://localhost:5173/api/auth/cli/poll?code_id=${startData.code_id}`
		});
		expect(pendingRes.status).toBe(200);
		const pendingData = (await pendingRes.json()) as { status: string };
		expect(pendingData.status).toBe('pending');

		// 4. Approve via the real endpoint (browser-side approval, authed as user).
		const approveRes = await call(CliApprove, {
			url: 'http://localhost:5173/api/auth/cli/approve',
			method: 'POST',
			token: mockApiToken.token,
			body: { code: startData.code }
		});
		expect(approveRes.status).toBe(200);

		// 5. Poll again — approved, with token.
		const approvedRes = await call(CliPoll, {
			url: `http://localhost:5173/api/auth/cli/poll?code_id=${startData.code_id}`
		});
		expect(approvedRes.status).toBe(200);
		const approvedData = (await approvedRes.json()) as {
			status: string;
			token: string;
			username: string;
		};
		expect(approvedData.status).toBe('approved');
		expect(approvedData.token).toMatch(/^obt_/);
		expect(approvedData.username).toBe('testuser');

		// 6. Use the new CLI token to access the private config.
		const privateRes = await call(GetConfigJSON, {
			url: 'http://localhost:5173/testuser/secret-setup/config',
			params: { username: 'testuser', slug: 'secret-setup' },
			token: approvedData.token
		});
		expect(privateRes.status).toBe(200);
		const configData = (await privateRes.json()) as {
			username: string;
			slug: string;
			packages: { name: string }[];
		};
		expect(configData.username).toBe('testuser');
		expect(configData.slug).toBe('secret-setup');
		expect(configData.packages).toContainEqual(expect.objectContaining({ name: 'git' }));
	});

	it('expired code cannot be approved', async () => {
		await seed(db, {
			users: [userRow()],
			api_tokens: [mockApiToken],
			cli_auth_codes: [
				{
					id: 'code_expired',
					code: 'EXPIRED1',
					user_id: null,
					token_id: null,
					status: 'pending',
					expires_at: '2020-01-01 00:00:00'
				}
			]
		});

		const res = await call(CliApprove, {
			url: 'http://localhost:5173/api/auth/cli/approve',
			method: 'POST',
			token: mockApiToken.token,
			body: { code: 'EXPIRED1' }
		});

		expect(res.status).toBe(400);
		const data = (await res.json()) as { error: string };
		expect(data.error).toContain('Invalid or expired');
	});

	it('poll without code_id returns 400', async () => {
		const res = await call(CliPoll, { url: 'http://localhost:5173/api/auth/cli/poll' });

		expect(res.status).toBe(400);
		const data = (await res.json()) as { error: string };
		expect(data.error).toContain('code_id is required');
	});

	it('poll with nonexistent code_id returns expired', async () => {
		const res = await call(CliPoll, {
			url: 'http://localhost:5173/api/auth/cli/poll?code_id=nonexistent'
		});

		expect(res.status).toBe(200);
		const data = (await res.json()) as { status: string };
		expect(data.status).toBe('expired');
	});

	it('approve requires authentication', async () => {
		const res = await call(CliApprove, {
			url: 'http://localhost:5173/api/auth/cli/approve',
			method: 'POST',
			body: { code: 'TESTCODE' }
		});

		expect(res.status).toBe(401);
	});
});
