import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { resetDb, seed, strip } from '$lib/test/seed';
import { call } from '$lib/test/call';
import { mockUser, mockConfig } from '$lib/test/fixtures';

import { GET as GetHealth } from '../routes/api/health/+server';
import { GET as GetPublicConfigs } from '../routes/api/configs/public/+server';
import { GET as GetConfigJSON } from '../routes/[username]/[slug]/config/+server';
import { GET as GetInstallScript } from '../routes/[username]/[slug]/install/+server';

const db = env.DB;
const userRow = () => strip(mockUser, 'provider', 'provider_id');

beforeEach(async () => {
	await resetDb(db);
	await seed(db, { users: [userRow()], configs: [mockConfig] });
});

describe('Smoke — Critical user journeys', () => {
	describe('Health check', () => {
		it('verifies system is operational', async () => {
			const response = await GetHealth({ platform: { env } } as any);
			const data = (await response.json()) as { status: string; checks: any; version: string };

			expect(data.status).toBeDefined();
			expect(data.checks).toBeDefined();
			expect(data.checks.api).toBe('ok');
			expect(data.version).toBe('0.1.0');
		});
	});

	describe('Config discovery — browse public configs', () => {
		it('allows users to discover public configs', async () => {
			const response = await call(GetPublicConfigs, {
				url: 'https://openboot.dev/api/configs/public'
			});

			expect(response.status).toBe(200);
			const data = (await response.json()) as { configs: unknown[]; total: number };
			expect(Array.isArray(data.configs)).toBe(true);
			expect(data.total).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Config installation flow', () => {
		it('serves install script for curl users', async () => {
			const response = await call(GetInstallScript, {
				url: 'http://localhost/testuser/my-config/install',
				params: { username: 'testuser', slug: 'my-config' }
			});

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toContain('text/plain');
			const script = await response.text();
			expect(script).toContain('#!/bin/bash');
			expect(script).toContain('OpenBoot');
		});

		it('provides config JSON for CLI', async () => {
			const response = await call(GetConfigJSON, {
				url: 'http://localhost/testuser/my-config/config',
				params: { username: 'testuser', slug: 'my-config' }
			});

			expect(response.status).toBe(200);
			const data = (await response.json()) as {
				username: string;
				slug: string;
				packages: unknown[];
			};
			expect(data.username).toBe('testuser');
			expect(data.slug).toBe('my-config');
			expect(Array.isArray(data.packages)).toBe(true);
		});
	});

	describe('Data integrity', () => {
		it('verifies config query filtering works', async () => {
			await db.prepare(`UPDATE configs SET visibility = 'public', featured = 1 WHERE id = ?`).bind(mockConfig.id).run();

			const response = await call(GetPublicConfigs, {
				url: 'https://openboot.dev/api/configs/public?username=testuser'
			});

			expect(response.status).toBe(200);
			const data = (await response.json()) as { configs: unknown[] };
			expect(Array.isArray(data.configs)).toBe(true);
		});

		it('verifies package data integrity', async () => {
			const response = await call(GetConfigJSON, {
				url: 'http://localhost/testuser/my-config/config',
				params: { username: 'testuser', slug: 'my-config' }
			});

			expect(response.status).toBe(200);
			const data = (await response.json()) as {
				packages: { name: string; desc: string }[];
				casks: unknown[];
				taps: unknown[];
			};
			expect(Array.isArray(data.packages)).toBe(true);
			if (data.packages.length > 0) {
				expect(data.packages[0]).toHaveProperty('name');
				expect(data.packages[0]).toHaveProperty('desc');
			}
			expect(Array.isArray(data.casks)).toBe(true);
			expect(Array.isArray(data.taps)).toBe(true);
		});
	});

	describe('Error handling', () => {
		it('handles non-existent configs gracefully', async () => {
			const response = await call(GetConfigJSON, {
				url: 'http://localhost/nonexistent/missing/config',
				params: { username: 'nonexistent', slug: 'missing' }
			});

			expect(response.status).toBe(404);
			const data = (await response.json()) as { error: string };
			expect(data.error).toBeDefined();
		});

		it('handles private configs correctly', async () => {
			await db.prepare(`UPDATE configs SET visibility = 'private' WHERE id = ?`).bind(mockConfig.id).run();

			const response = await call(GetConfigJSON, {
				url: 'http://localhost/testuser/my-config/config',
				params: { username: 'testuser', slug: 'my-config' }
			});

			expect(response.status).toBe(403);
			const data = (await response.json()) as { error: string };
			expect(data.error).toContain('private');
		});
	});
});
