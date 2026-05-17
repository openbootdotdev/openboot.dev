/**
 * Tests for install script endpoint.
 * Runs inside Workers runtime with real D1 (via vitest-pool-workers).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { GET } from './+server';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockPublicConfig, mockPrivateConfig, mockApiToken, mockExpiredApiToken } from '$lib/test/fixtures';

const db = env.DB;
const baseUrl = 'http://localhost:5173/testuser/my-config/install';
const userRow = () => strip(mockUser, 'provider', 'provider_id');

const opts = (overrides: Record<string, unknown> = {}) => ({
	url: baseUrl,
	route: { id: '/[username]/[slug]/install' },
	params: { username: 'testuser', slug: 'my-config' },
	...overrides
});

beforeEach(async () => {
	await resetDb(db);
});

describe('public configs', () => {
	it('returns install script without auth', async () => {
		await seed(db, { users: [userRow()], configs: [mockPublicConfig] });

		const response = await call(GET, opts({ params: { username: 'testuser', slug: 'public-config' } }));

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/plain');
		const text = await response.text();
		expect(text).toContain('#!/bin/bash');
		expect(text).toContain('openboot');
	});
});

describe('private configs — auth required', () => {
	it('rejects private config without auth header', async () => {
		await seed(db, { users: [userRow()], configs: [mockPrivateConfig] });

		const response = await call(GET, opts({ params: { username: 'testuser', slug: 'private-config' } }));

		expect(response.status).toBe(403);
		const text = await response.text();
		expect(text).toContain('Config is private');
	});

	it('rejects private config with empty Bearer token', async () => {
		await seed(db, { users: [userRow()], configs: [mockPrivateConfig] });

		const response = await call(
			GET,
			opts({
				params: { username: 'testuser', slug: 'private-config' },
				headers: { authorization: 'Bearer ' }
			})
		);

		expect(response.status).toBe(403);
	});

	it('rejects private config with invalid token', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPrivateConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(
			GET,
			opts({
				params: { username: 'testuser', slug: 'private-config' },
				token: 'obt_invalid_token_123'
			})
		);

		expect(response.status).toBe(403);
	});

	it('rejects private config with expired token', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPrivateConfig],
			api_tokens: [mockExpiredApiToken]
		});

		const response = await call(
			GET,
			opts({
				params: { username: 'testuser', slug: 'private-config' },
				token: mockExpiredApiToken.token
			})
		);

		expect(response.status).toBe(403);
	});

	it('rejects private config with token from different user', async () => {
		const otherUser = { ...userRow(), id: 'user_other', username: 'otheruser' };
		const otherToken = {
			...mockApiToken,
			id: 'tok_other',
			user_id: 'user_other',
			token: 'obt_other_token_xxxxxxxxxxxxxxxxxxxx'
		};
		await seed(db, {
			users: [userRow(), otherUser],
			configs: [mockPrivateConfig],
			api_tokens: [otherToken]
		});

		const response = await call(
			GET,
			opts({
				params: { username: 'testuser', slug: 'private-config' },
				token: otherToken.token
			})
		);

		expect(response.status).toBe(403);
	});

	it('returns install script with valid owner token', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPrivateConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(
			GET,
			opts({
				params: { username: 'testuser', slug: 'private-config' },
				token: mockApiToken.token
			})
		);

		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain('#!/bin/bash');
		expect(text).toContain('openboot');
	});

	it('handles Bearer token with mixed case', async () => {
		await seed(db, {
			users: [userRow()],
			configs: [mockPrivateConfig],
			api_tokens: [mockApiToken]
		});

		const response = await call(
			GET,
			opts({
				params: { username: 'testuser', slug: 'private-config' },
				headers: { authorization: `bearer ${mockApiToken.token}` }
			})
		);

		expect(response.status).toBe(200);
	});
});

describe('404 cases', () => {
	it('returns 404 for non-existent user', async () => {
		const response = await call(GET, opts({ params: { username: 'nonexistent', slug: 'config' } }));

		expect(response.status).toBe(404);
		const text = await response.text();
		expect(text).toContain('User not found');
	});

	it('returns 404 for non-existent config', async () => {
		await seed(db, { users: [userRow()] });

		const response = await call(GET, opts({ params: { username: 'testuser', slug: 'nonexistent' } }));

		expect(response.status).toBe(404);
		const text = await response.text();
		expect(text).toContain('Config not found');
	});
});
