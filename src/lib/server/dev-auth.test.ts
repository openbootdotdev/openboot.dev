/**
 * Tests for dev-auth.ts — the local-development auto-login and its safety gate.
 * Runs inside the Workers runtime with real D1 (via vitest-pool-workers).
 *
 * The security-critical property: ensureDevSession must be a no-op unless BOTH
 * DEV_AUTH === 'true' AND the request is served from localhost.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { ensureDevSession } from './dev-auth';
import { verifyToken } from './auth';
import { getUserById, countUserConfigs } from './db';
import { resetDb } from '$lib/test/seed';

const db = env.DB;
const JWT_SECRET = 'test-jwt-secret-key-32-chars-long';

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

function makeEvent(opts: { devAuth?: string; host?: string; cookies?: ReturnType<typeof makeCookies> }) {
	const host = opts.host ?? 'localhost';
	return {
		platform: { env: { DB: db, JWT_SECRET, DEV_AUTH: opts.devAuth } },
		url: new URL(`http://${host}:5173/dashboard`),
		request: new Request(`http://${host}:5173/dashboard`),
		cookies: opts.cookies ?? makeCookies()
	} as any;
}

beforeEach(async () => {
	await resetDb(db);
});

describe('ensureDevSession', () => {
	it('auto-logs in the dev user on localhost when DEV_AUTH=true', async () => {
		const cookies = makeCookies();
		await ensureDevSession(makeEvent({ devAuth: 'true', cookies }));

		const token = cookies.get('session');
		expect(token).toBeTruthy();
		const payload = await verifyToken(token!, JWT_SECRET);
		expect(payload?.userId).toBe('dev-user');

		const user = await getUserById(db, 'dev-user');
		expect(user?.username).toBe('devuser');
		expect(await countUserConfigs(db, 'dev-user')).toBe(1);
	});

	it('is a no-op when DEV_AUTH is not "true"', async () => {
		const cookies = makeCookies();
		await ensureDevSession(makeEvent({ devAuth: 'false', cookies }));

		expect(cookies.get('session')).toBeUndefined();
		expect(await getUserById(db, 'dev-user')).toBeNull();
	});

	it('is a no-op when DEV_AUTH is unset', async () => {
		const cookies = makeCookies();
		await ensureDevSession(makeEvent({ devAuth: undefined, cookies }));

		expect(cookies.get('session')).toBeUndefined();
		expect(await getUserById(db, 'dev-user')).toBeNull();
	});

	it('is a no-op when the host is not localhost (gate holds even if the flag leaks)', async () => {
		const cookies = makeCookies();
		await ensureDevSession(makeEvent({ devAuth: 'true', host: 'openboot.dev', cookies }));

		expect(cookies.get('session')).toBeUndefined();
		expect(await getUserById(db, 'dev-user')).toBeNull();
	});

	it('is idempotent — does not reseed when already authenticated', async () => {
		const cookies = makeCookies();
		await ensureDevSession(makeEvent({ devAuth: 'true', cookies }));
		const firstToken = cookies.get('session');

		await ensureDevSession(makeEvent({ devAuth: 'true', cookies }));

		expect(cookies.get('session')).toBe(firstToken);
		expect(await countUserConfigs(db, 'dev-user')).toBe(1);
	});
});
