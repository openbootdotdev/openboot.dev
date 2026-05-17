/**
 * Tests for auth.ts — JWT signing/verification, getCurrentUser, slugify, generateId.
 * Runs inside Workers runtime with real D1 (via vitest-pool-workers).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { signToken, verifyToken, getCookie, getCurrentUser, slugify, generateId } from './auth';
import { resetDb, seed, strip } from '$lib/test/seed';
import { mockUser, mockApiToken } from '$lib/test/fixtures';

const db = env.DB;
const TEST_SECRET = 'test-jwt-secret-key-32-chars-long';
const userRow = () => strip(mockUser, 'provider', 'provider_id');

function makeCookies(values: Record<string, string> = {}) {
	const store = { ...values };
	return {
		get: (n: string) => store[n],
		set: (n: string, v: string) => {
			store[n] = v;
		},
		delete: (n: string) => {
			delete store[n];
		},
		getAll: () => Object.entries(store).map(([name, value]) => ({ name, value })),
		serialize: () => ''
	} as any;
}

beforeEach(async () => {
	await resetDb(db);
});

describe('signToken / verifyToken', () => {
	it('signs and verifies a valid token', async () => {
		const payload = { userId: 'u1', username: 'alice', exp: Date.now() + 60_000 };
		const token = await signToken(payload, TEST_SECRET);

		expect(token).toContain('.');
		const parts = token.split('.');
		expect(parts).toHaveLength(2);

		const result = await verifyToken(token, TEST_SECRET);
		expect(result).toEqual(payload);
	});

	it('rejects token signed with wrong secret', async () => {
		const payload = { userId: 'u1', username: 'alice', exp: Date.now() + 60_000 };
		const token = await signToken(payload, TEST_SECRET);

		const result = await verifyToken(token, 'wrong-secret-key-32-chars-long!!');
		expect(result).toBeNull();
	});

	it('rejects expired token', async () => {
		const payload = { userId: 'u1', username: 'alice', exp: Date.now() - 1000 };
		const token = await signToken(payload, TEST_SECRET);

		const result = await verifyToken(token, TEST_SECRET);
		expect(result).toBeNull();
	});

	it('rejects token without exp', async () => {
		const payload = { userId: 'u1', username: 'alice', exp: 0 };
		const token = await signToken(payload, TEST_SECRET);

		const result = await verifyToken(token, TEST_SECRET);
		expect(result).toBeNull();
	});

	it('rejects malformed token — no dot', async () => {
		const result = await verifyToken('nodottoken', TEST_SECRET);
		expect(result).toBeNull();
	});

	it('rejects malformed token — empty parts', async () => {
		const result = await verifyToken('.', TEST_SECRET);
		expect(result).toBeNull();
	});

	it('rejects token with tampered data', async () => {
		const payload = { userId: 'u1', username: 'alice', exp: Date.now() + 60_000 };
		const token = await signToken(payload, TEST_SECRET);
		const [, sig] = token.split('.');

		const tampered = { userId: 'u1', username: 'evil', exp: Date.now() + 60_000 };
		const tamperedData = btoa(JSON.stringify(tampered));

		const result = await verifyToken(`${tamperedData}.${sig}`, TEST_SECRET);
		expect(result).toBeNull();
	});

	it('rejects token with invalid base64', async () => {
		const result = await verifyToken('not!valid!base64.also!not!valid', TEST_SECRET);
		expect(result).toBeNull();
	});
});

describe('getCookie', () => {
	it('returns cookie value when present', () => {
		expect(getCookie(makeCookies({ session: 'abc123' }), 'session')).toBe('abc123');
	});

	it('returns undefined when cookie missing', () => {
		expect(getCookie(makeCookies({}), 'session')).toBeUndefined();
	});
});

describe('getCurrentUser', () => {
	it('authenticates via Bearer obt_ API token', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const request = new Request('http://x/', {
			headers: { Authorization: `Bearer ${mockApiToken.token}` }
		});
		const user = await getCurrentUser(request, makeCookies(), db, TEST_SECRET);
		expect(user).not.toBeNull();
		expect((user as any).username).toBe('testuser');
	});

	it('updates last_used_at on valid API token auth', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const request = new Request('http://x/', {
			headers: { Authorization: `Bearer ${mockApiToken.token}` }
		});
		await getCurrentUser(request, makeCookies(), db, TEST_SECRET);

		const row = await db
			.prepare('SELECT last_used_at FROM api_tokens WHERE id = ?')
			.bind(mockApiToken.id)
			.first<{ last_used_at: string | null }>();
		expect(row?.last_used_at).toBeTruthy();
	});

	it('returns null for invalid API token', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });

		const request = new Request('http://x/', {
			headers: { Authorization: 'Bearer obt_nonexistent_token_value_here' }
		});
		const user = await getCurrentUser(request, makeCookies(), db, TEST_SECRET);
		expect(user).toBeNull();
	});

	it('returns null for expired API token', async () => {
		const expiredToken = {
			...mockApiToken,
			id: 'tok_expired',
			token: 'obt_expired1234567890abcdefghijklmnopqr',
			expires_at: '2020-01-01T00:00:00Z'
		};
		await seed(db, { users: [userRow()], api_tokens: [expiredToken] });

		const request = new Request('http://x/', {
			headers: { Authorization: `Bearer ${expiredToken.token}` }
		});
		const user = await getCurrentUser(request, makeCookies(), db, TEST_SECRET);
		expect(user).toBeNull();
	});

	it('returns null for API token with non-existent user', async () => {
		// Orphan token isn't actually possible with FK enforcement — D1 rejects the insert.
		// Cover the same code path by deleting the user after the token exists.
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });
		await db.prepare('DELETE FROM users WHERE id = ?').bind(mockUser.id).run();

		const request = new Request('http://x/', {
			headers: { Authorization: `Bearer ${mockApiToken.token}` }
		});
		const user = await getCurrentUser(request, makeCookies(), db, TEST_SECRET);
		expect(user).toBeNull();
	});

	it('authenticates via session cookie with valid JWT', async () => {
		await seed(db, { users: [userRow()] });
		const payload = { userId: mockUser.id, username: mockUser.username, exp: Date.now() + 60_000 };
		const jwt = await signToken(payload, TEST_SECRET);

		const request = new Request('http://x/');
		const user = await getCurrentUser(request, makeCookies({ session: jwt }), db, TEST_SECRET);
		expect(user).not.toBeNull();
		expect((user as any).username).toBe('testuser');
	});

	it('returns null when no session cookie', async () => {
		await seed(db, { users: [userRow()] });

		const user = await getCurrentUser(new Request('http://x/'), makeCookies(), db, TEST_SECRET);
		expect(user).toBeNull();
	});

	it('returns null for invalid session JWT', async () => {
		await seed(db, { users: [userRow()] });

		const user = await getCurrentUser(
			new Request('http://x/'),
			makeCookies({ session: 'invalid.jwt.token' }),
			db,
			TEST_SECRET
		);
		expect(user).toBeNull();
	});

	it('returns null for expired session JWT', async () => {
		await seed(db, { users: [userRow()] });
		const payload = { userId: mockUser.id, username: mockUser.username, exp: Date.now() - 1000 };
		const jwt = await signToken(payload, TEST_SECRET);

		const user = await getCurrentUser(new Request('http://x/'), makeCookies({ session: jwt }), db, TEST_SECRET);
		expect(user).toBeNull();
	});

	it('prefers API token over session cookie', async () => {
		await seed(db, { users: [userRow()], api_tokens: [mockApiToken] });
		const payload = { userId: mockUser.id, username: mockUser.username, exp: Date.now() + 60_000 };
		const jwt = await signToken(payload, TEST_SECRET);

		const request = new Request('http://x/', {
			headers: { Authorization: `Bearer ${mockApiToken.token}` }
		});
		const user = await getCurrentUser(request, makeCookies({ session: jwt }), db, TEST_SECRET);
		expect(user).not.toBeNull();
		expect((user as any).username).toBe('testuser');
	});

	it('skips non-obt Bearer tokens and falls through to cookie', async () => {
		await seed(db, { users: [userRow()] });

		const request = new Request('http://x/', {
			headers: { Authorization: 'Bearer some-regular-jwt-token' }
		});
		const user = await getCurrentUser(request, makeCookies(), db, TEST_SECRET);
		expect(user).toBeNull();
	});
});

describe('slugify', () => {
	it('lowercases and replaces non-alphanumeric chars', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});

	it('collapses multiple hyphens', () => {
		expect(slugify('a---b')).toBe('a-b');
	});

	it('trims leading/trailing hyphens', () => {
		expect(slugify('--hello--')).toBe('hello');
	});

	it('handles special characters', () => {
		expect(slugify('My Config! @2024')).toBe('my-config-2024');
	});

	it('truncates to 50 characters', () => {
		expect(slugify('a'.repeat(60)).length).toBe(50);
	});

	it('handles empty string', () => {
		expect(slugify('')).toBe('');
	});
});

describe('generateId', () => {
	it('returns a valid UUID', () => {
		const id = generateId();
		expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});

	it('generates unique IDs', () => {
		const ids = new Set(Array.from({ length: 10 }, () => generateId()));
		expect(ids.size).toBe(10);
	});
});
