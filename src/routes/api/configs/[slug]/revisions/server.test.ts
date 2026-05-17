/**
 * Tests for revision endpoints:
 *   GET /api/configs/[slug]/revisions
 *   GET /api/configs/[slug]/revisions/[id]
 *   POST /api/configs/[slug]/revisions/[id]/restore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { GET as LIST } from './+server';
import { GET } from './[id]/+server';
import { POST as RESTORE } from './[id]/restore/+server';

import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockConfig, mockApiToken, mockRevision, mockRevisionOlder } from '$lib/test/fixtures';

const db = env.DB;
const userRow = () => strip(mockUser, 'provider', 'provider_id');

// Mock-only fixture field; real schema doesn't have it (json_array_length computes).
function asRevisionRow(r: typeof mockRevision | typeof mockRevisionOlder) {
	const { package_count: _omit, ...rest } = r;
	return rest;
}

function authedCall(
	handler: (event: any) => Response | Promise<Response>,
	params: Record<string, string>,
	method: 'GET' | 'POST' = 'GET',
	body?: unknown
) {
	return call(handler, {
		url: `http://localhost:5173/api/configs/${params.slug}/revisions`,
		method,
		params,
		token: mockApiToken.token,
		body: method === 'POST' ? (body ?? {}) : body
	});
}

function unauthCall(
	handler: (event: any) => Response | Promise<Response>,
	params: Record<string, string>,
	method: 'GET' | 'POST' = 'GET'
) {
	return call(handler, {
		url: `http://localhost:5173/api/configs/${params.slug}/revisions`,
		method,
		params
	});
}

beforeEach(async () => {
	await resetDb(db);
});

describe('GET /api/configs/[slug]/revisions', () => {
	it('rejects unauthenticated request', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await unauthCall(LIST, { slug: 'my-config' });
		expect(res.status).toBe(401);
	});

	it('returns 404 for unknown config', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });
		const res = await authedCall(LIST, { slug: 'nonexistent' });
		expect(res.status).toBe(404);
	});

	it('returns empty list when no revisions exist', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await authedCall(LIST, { slug: 'my-config' });
		expect(res.status).toBe(200);
		const body = (await res.json()) as { revisions: unknown[] };
		expect(body.revisions).toEqual([]);
	});

	it('returns revisions list with id, message, created_at, package_count', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: [asRevisionRow(mockRevision), asRevisionRow(mockRevisionOlder)]
		});
		const res = await authedCall(LIST, { slug: 'my-config' });
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			revisions: { id: string; message: string; package_count: number; created_at: string }[];
		};
		expect(body.revisions).toHaveLength(2);
		const first = body.revisions[0];
		expect(first.id).toBe(mockRevision.id);
		expect(first.message).toBe('before adding rust');
		expect(first.package_count).toBe(2);
		expect(first.created_at).toBeDefined();
	});
});

describe('GET /api/configs/[slug]/revisions/[id]', () => {
	it('rejects unauthenticated request', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await unauthCall(GET, { slug: 'my-config', id: mockRevision.id });
		expect(res.status).toBe(401);
	});

	it('returns 404 for unknown config', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });
		const res = await authedCall(GET, { slug: 'nonexistent', id: mockRevision.id });
		expect(res.status).toBe(404);
	});

	it('returns 404 for unknown revision', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await authedCall(GET, { slug: 'my-config', id: 'rev_nonexistent' });
		expect(res.status).toBe(404);
	});

	it('returns revision with parsed packages array', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: [asRevisionRow(mockRevision)]
		});
		const res = await authedCall(GET, { slug: 'my-config', id: mockRevision.id });
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			id: string;
			message: string;
			packages: { name: string; type: string }[];
		};
		expect(body.id).toBe(mockRevision.id);
		expect(body.message).toBe('before adding rust');
		expect(Array.isArray(body.packages)).toBe(true);
		expect(body.packages).toHaveLength(2);
		expect(body.packages[0]).toEqual({ name: 'git', type: 'formula' });
	});

	it('returns empty packages array when packages JSON is invalid', async () => {
		const badRevision = { ...asRevisionRow(mockRevision), id: 'rev_bad', packages: 'not-json' };
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: [badRevision]
		});
		const res = await authedCall(GET, { slug: 'my-config', id: 'rev_bad' });
		expect(res.status).toBe(200);
		const body = (await res.json()) as { packages: unknown[] };
		expect(body.packages).toEqual([]);
	});
});

describe('POST /api/configs/[slug]/revisions/[id]/restore', () => {
	it('rejects unauthenticated request', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await unauthCall(RESTORE, { slug: 'my-config', id: mockRevision.id }, 'POST');
		expect(res.status).toBe(401);
	});

	it('returns 404 for unknown config', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });
		const res = await authedCall(RESTORE, { slug: 'nonexistent', id: mockRevision.id }, 'POST');
		expect(res.status).toBe(404);
	});

	it('returns 404 for unknown revision', async () => {
		await seed(db, { users: [userRow()], configs: [mockConfig], api_tokens: [mockApiToken] });
		const res = await authedCall(RESTORE, { slug: 'my-config', id: 'rev_nonexistent' }, 'POST');
		expect(res.status).toBe(404);
	});

	it('returns 200 with restored packages on success', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockConfig],
			api_tokens: [mockApiToken],
			config_revisions: [asRevisionRow(mockRevision)]
		});
		const res = await authedCall(RESTORE, { slug: 'my-config', id: mockRevision.id }, 'POST');
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			restored: boolean;
			revision_id: string;
			packages: { name: string; type: string }[];
		};
		expect(body.restored).toBe(true);
		expect(body.revision_id).toBe(mockRevision.id);
		expect(Array.isArray(body.packages)).toBe(true);
		expect(body.packages).toHaveLength(2);
		expect(body.packages[0]).toEqual({ name: 'git', type: 'formula' });
	});
});
