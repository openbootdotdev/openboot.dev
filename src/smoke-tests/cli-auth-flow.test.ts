/**
 * Smoke Test: CLI Device Auth full flow
 *
 * Verifies: start → approve → poll → use token to access private config
 * This catches regressions in the 3-step CLI authentication handshake.
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

import { POST as CliStart } from '../routes/api/auth/cli/start/+server';
import { POST as CliApprove } from '../routes/api/auth/cli/approve/+server';
import { GET as CliPoll } from '../routes/api/auth/cli/poll/+server';
import { GET as GetConfigJSON } from '../routes/[username]/[slug]/config/+server';

function handler(db: any, overrides: Record<string, any> = {}) {
	return {
		platform: createMockPlatform(db),
		url: new URL('http://localhost:5173/api/auth/cli/start'),
		route: { id: '' },
		locals: {},
		isDataRequest: false,
		isSubRequest: false,
		cookies: createMockCookies(),
		getClientAddress: () => '127.0.0.1',
		fetch: globalThis.fetch,
		...overrides
	};
}

describe('Smoke Test: CLI Auth Full Flow', () => {
	it('start → approve → poll → access private config', async () => {
		// Pre-seed auth code to avoid mock DB limitations with datetime() in INSERT/UPDATE.
		// The mock DB can't parse datetime('now', '+10 minutes') (comma splits the fn)
		// or compare space-delimited dates vs ISO format.
		const futureExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
		const preseededCode = {
			id: 'code_test1',
			code: 'TESTAB12',
			user_id: null as string | null,
			token_id: null as string | null,
			status: 'pending',
			expires_at: futureExpiry
		};

		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			configs: [{
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
			}],
			cli_auth_codes: [preseededCode]
		});

		// === 1. Verify: private config is blocked without auth ===
		const blockedRes = await GetConfigJSON({
			...handler(db, { params: { username: 'testuser', slug: 'secret-setup' } }),
			request: createMockRequest({ url: '/testuser/secret-setup/config' })
		} as any);

		expect(blockedRes.status).toBe(403);

		// === 2. CLI starts auth flow (verify endpoint works) ===
		const startRes = await CliStart({
			...handler(db),
			request: createMockRequest({
				method: 'POST',
				url: '/api/auth/cli/start',
				body: {},
				clientIp: '127.0.0.1'
			})
		} as any);

		expect(startRes.status).toBe(200);
		const startData = await getJSON(startRes);
		expect(startData.code_id).toBeDefined();
		expect(startData.code).toHaveLength(8);

		// === 3. Poll pre-seeded code — should be pending ===
		const pendingRes = await CliPoll({
			...handler(db, { url: new URL(`http://localhost:5173/api/auth/cli/poll?code_id=${preseededCode.id}`) }),
			request: createMockRequest({ url: `/api/auth/cli/poll?code_id=${preseededCode.id}` })
		} as any);

		expect(pendingRes.status).toBe(200);
		const pendingData = await getJSON(pendingRes);
		expect(pendingData.status).toBe('pending');

		// === 4. Simulate approve by directly updating mock data ===
		// The approve endpoint uses UPDATE with datetime conditions that the mock DB
		// can't handle. We simulate what the endpoint does: create token + update code.
		const newTokenValue = 'obt_' + crypto.randomUUID().replace(/-/g, '');
		const newTokenId = crypto.randomUUID();
		db.data.api_tokens.push({
			id: newTokenId,
			user_id: mockUser.id,
			token: newTokenValue,
			name: 'cli',
			expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
			created_at: new Date().toISOString()
		});
		preseededCode.status = 'approved';
		preseededCode.user_id = mockUser.id;
		preseededCode.token_id = newTokenId;

		// === 5. Poll again — should be approved with token ===
		const approvedRes = await CliPoll({
			...handler(db, { url: new URL(`http://localhost:5173/api/auth/cli/poll?code_id=${preseededCode.id}`) }),
			request: createMockRequest({ url: `/api/auth/cli/poll?code_id=${preseededCode.id}` })
		} as any);

		expect(approvedRes.status).toBe(200);
		const approvedData = await getJSON(approvedRes);
		expect(approvedData.status).toBe('approved');
		expect(approvedData.token).toBe(newTokenValue);
		expect(approvedData.token).toMatch(/^obt_/);
		expect(approvedData.username).toBe('testuser');

		// === 6. Use new CLI token to access private config ===
		const privateRes = await GetConfigJSON({
			...handler(db, { params: { username: 'testuser', slug: 'secret-setup' } }),
			request: createMockRequest({
				url: '/testuser/secret-setup/config',
				headers: { authorization: `Bearer ${newTokenValue}` }
			})
		} as any);

		expect(privateRes.status).toBe(200);
		const configData = await getJSON(privateRes);
		expect(configData.username).toBe('testuser');
		expect(configData.slug).toBe('secret-setup');
		expect(configData.packages).toContainEqual(expect.objectContaining({ name: 'git' }));
	});

	it('expired code cannot be approved', async () => {
		const db = createMockDB({
			users: [mockUser],
			api_tokens: [mockApiToken],
			cli_auth_codes: [{
				id: 'code_expired',
				code: 'EXPIRED1',
				user_id: null,
				token_id: null,
				status: 'pending',
				expires_at: '2020-01-01 00:00:00'
			}]
		});

		const res = await CliApprove({
			...handler(db),
			request: createMockRequest({
				method: 'POST',
				url: '/api/auth/cli/approve',
				body: { code: 'EXPIRED1' },
				headers: { authorization: createBearerToken(mockApiToken.token) }
			})
		} as any);

		expect(res.status).toBe(400);
		const data = await getJSON(res);
		expect(data.error).toContain('Invalid or expired');
	});

	it('poll without code_id returns 400', async () => {
		const db = createMockDB({});

		const res = await CliPoll({
			...handler(db, { url: new URL('http://localhost:5173/api/auth/cli/poll') }),
			request: createMockRequest({ url: '/api/auth/cli/poll' })
		} as any);

		expect(res.status).toBe(400);
		const data = await getJSON(res);
		expect(data.error).toContain('code_id is required');
	});

	it('poll with nonexistent code_id returns expired', async () => {
		const db = createMockDB({});

		const res = await CliPoll({
			...handler(db, { url: new URL('http://localhost:5173/api/auth/cli/poll?code_id=nonexistent') }),
			request: createMockRequest({ url: '/api/auth/cli/poll?code_id=nonexistent' })
		} as any);

		expect(res.status).toBe(200);
		const data = await getJSON(res);
		expect(data.status).toBe('expired');
	});

	it('approve requires authentication', async () => {
		const db = createMockDB({});

		const res = await CliApprove({
			...handler(db),
			request: createMockRequest({
				method: 'POST',
				url: '/api/auth/cli/approve',
				body: { code: 'TESTCODE' }
			})
		} as any);

		expect(res.status).toBe(401);
	});
});
