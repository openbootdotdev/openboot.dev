/**
 * Tests for revision endpoints:
 *   GET /api/configs/[slug]/revisions
 *   GET /api/configs/[slug]/revisions/[id]
 *   POST /api/configs/[slug]/revisions/[id]/restore
 */

import { describe, it, expect } from 'vitest';
import { GET as _LIST } from './+server';
import { GET as _GET } from './[id]/+server';
import { POST as _RESTORE } from './[id]/restore/+server';
const LIST = _LIST as (event: any) => Promise<Response>;
const GET = _GET as (event: any) => Promise<Response>;
const RESTORE = _RESTORE as (event: any) => Promise<Response>;

import { createMockDB } from '$lib/test/db-mock';
import {
	mockUser,
	mockConfig,
	mockApiToken,
	mockRevision,
	mockRevisionOlder,
	createMockRequest,
	createMockPlatform,
	createMockCookies
} from '$lib/test/fixtures';
import { createBearerToken, getJSON } from '$lib/test/helpers';

function makeEvent(db: any, params: Record<string, string>, method = 'GET', body?: any) {
	return {
		request: createMockRequest({
			method,
			url: `http://localhost:5173/api/configs/${params.slug || 'my-config'}/revisions`,
			headers: { authorization: createBearerToken(mockApiToken.token) },
			body: body ?? (method === 'POST' ? {} : null)
		}),
		platform: createMockPlatform(db),
		params,
		url: new URL('http://localhost:5173'),
		route: { id: '' },
		locals: {},
		isDataRequest: false,
		isSubRequest: false,
		cookies: createMockCookies(),
		getClientAddress: () => '127.0.0.1',
		fetch: globalThis.fetch
	};
}

function makeUnauthEvent(db: any, params: Record<string, string>, method = 'GET') {
	return {
		...makeEvent(db, params, method),
		request: createMockRequest({ method, url: 'http://localhost:5173' })
	};
}

// ─── GET /api/configs/[slug]/revisions ──────────────────────────────────────

describe('GET /api/configs/[slug]/revisions', () => {
	it('rejects unauthenticated request', async () => {
		const db = createMockDB({ users: [mockUser], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await LIST(makeUnauthEvent(db, { slug: 'my-config' }));
		expect(res.status).toBe(401);
	});

	it('returns 404 for unknown config', async () => {
		const db = createMockDB({ users: [mockUser], configs: [], api_tokens: [mockApiToken] });
		const res = await LIST(makeEvent(db, { slug: 'nonexistent' }));
		expect(res.status).toBe(404);
	});

	it('returns empty list when no revisions exist', async () => {
		const db = createMockDB({
			users: [mockUser],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: []
		});
		const res = await LIST(makeEvent(db, { slug: 'my-config' }));
		expect(res.status).toBe(200);
		const body = await getJSON(res);
		expect(body.revisions).toEqual([]);
	});

	it('returns revisions list with id, message, created_at, package_count', async () => {
		const db = createMockDB({
			users: [mockUser],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: [mockRevision, mockRevisionOlder]
		});
		const res = await LIST(makeEvent(db, { slug: 'my-config' }));
		expect(res.status).toBe(200);
		const body = await getJSON(res);
		expect(body.revisions).toHaveLength(2);
		const first = body.revisions[0];
		expect(first.id).toBe(mockRevision.id);
		expect(first.message).toBe('before adding rust');
		expect(first.package_count).toBe(2);
		expect(first.created_at).toBeDefined();
	});
});

// ─── GET /api/configs/[slug]/revisions/[id] ─────────────────────────────────

describe('GET /api/configs/[slug]/revisions/[id]', () => {
	it('rejects unauthenticated request', async () => {
		const db = createMockDB({ users: [mockUser], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await GET(makeUnauthEvent(db, { slug: 'my-config', id: mockRevision.id }));
		expect(res.status).toBe(401);
	});

	it('returns 404 for unknown config', async () => {
		const db = createMockDB({ users: [mockUser], configs: [], api_tokens: [mockApiToken] });
		const res = await GET(makeEvent(db, { slug: 'nonexistent', id: mockRevision.id }));
		expect(res.status).toBe(404);
	});

	it('returns 404 for unknown revision', async () => {
		const db = createMockDB({
			users: [mockUser],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: []
		});
		const res = await GET(makeEvent(db, { slug: 'my-config', id: 'rev_nonexistent' }));
		expect(res.status).toBe(404);
	});

	it('returns revision with parsed packages array', async () => {
		const db = createMockDB({
			users: [mockUser],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: [mockRevision]
		});
		const res = await GET(makeEvent(db, { slug: 'my-config', id: mockRevision.id }));
		expect(res.status).toBe(200);
		const body = await getJSON(res);
		expect(body.id).toBe(mockRevision.id);
		expect(body.message).toBe('before adding rust');
		// packages should be a parsed array, not a JSON string
		expect(Array.isArray(body.packages)).toBe(true);
		expect(body.packages).toHaveLength(2);
		expect(body.packages[0]).toEqual({ name: 'git', type: 'formula' });
	});

	it('returns empty packages array when packages JSON is invalid', async () => {
		const badRevision = { ...mockRevision, id: 'rev_bad', packages: 'not-json' };
		const db = createMockDB({
			users: [mockUser],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: [badRevision]
		});
		const res = await GET(makeEvent(db, { slug: 'my-config', id: 'rev_bad' }));
		expect(res.status).toBe(200);
		const body = await getJSON(res);
		expect(body.packages).toEqual([]);
	});
});

// ─── POST /api/configs/[slug]/revisions/[id]/restore ────────────────────────

describe('POST /api/configs/[slug]/revisions/[id]/restore', () => {
	it('rejects unauthenticated request', async () => {
		const db = createMockDB({ users: [mockUser], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await RESTORE(makeUnauthEvent(db, { slug: 'my-config', id: mockRevision.id }, 'POST'));
		expect(res.status).toBe(401);
	});

	it('returns 404 for unknown config', async () => {
		const db = createMockDB({ users: [mockUser], configs: [], api_tokens: [mockApiToken] });
		const res = await RESTORE(makeEvent(db, { slug: 'nonexistent', id: mockRevision.id }, 'POST'));
		expect(res.status).toBe(404);
	});

	it('returns 404 for unknown revision', async () => {
		const db = createMockDB({
			users: [mockUser],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: []
		});
		const res = await RESTORE(makeEvent(db, { slug: 'my-config', id: 'rev_nonexistent' }, 'POST'));
		expect(res.status).toBe(404);
	});

	it('returns 200 with restored packages on success', async () => {
		const db = createMockDB({
			users: [mockUser],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: [mockRevision]
		});
		const res = await RESTORE(makeEvent(db, { slug: 'my-config', id: mockRevision.id }, 'POST'));
		expect(res.status).toBe(200);
		const body = await getJSON(res);
		expect(body.restored).toBe(true);
		expect(body.revision_id).toBe(mockRevision.id);
		expect(Array.isArray(body.packages)).toBe(true);
		expect(body.packages).toHaveLength(2);
		expect(body.packages[0]).toEqual({ name: 'git', type: 'formula' });
	});
});
