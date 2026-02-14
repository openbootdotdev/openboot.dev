import { describe, it, expect, beforeEach } from 'vitest';
import { createMockDB } from '$lib/test/db-mock';
import { createMockPlatform, createMockRequest, mockUser, mockConfig } from '$lib/test/fixtures';

import { GET as GetHealth } from '../routes/api/health/+server';
import { GET as GetPublicConfigs } from '../routes/api/configs/public/+server';
import { GET as GetConfigJSON } from '../routes/[username]/[slug]/config/+server';
import { GET as GetInstallScript } from '../routes/[username]/[slug]/install/+server';

describe('Smoke Tests - Critical User Journeys', () => {
	let db: any;
	let platform: any;

	beforeEach(() => {
		db = createMockDB();
		platform = createMockPlatform(db);
		
		db.data.users.push(mockUser);
		db.data.configs.push(mockConfig);
	});

	describe('Health Check', () => {
		it('verifies system is operational', async () => {
			const response = await GetHealth({ platform } as any);
			const data = await response.json();
			
			expect(data.status).toBeDefined();
			expect(data.checks).toBeDefined();
			expect(data.checks.api).toBe('ok');
			expect(data.version).toBe('0.1.0');
		});
	});

	describe('Config Discovery - Browse public configs', () => {
		it('allows users to discover public configs', async () => {
			const request = createMockRequest({ method: 'GET', url: '/api/configs/public' });
			const url = new URL('https://openboot.dev/api/configs/public');
			
			const response = await GetPublicConfigs({ 
				platform, 
				request,
				url
			} as any);
			
			const data = await response.json();
			
			expect(response.status).toBe(200);
			expect(data.configs).toBeDefined();
			expect(Array.isArray(data.configs)).toBe(true);
			expect(data.total).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Config Installation Flow', () => {
		it('serves install script for curl users', async () => {
			const params = { username: 'testuser', slug: 'my-config' };
			const request = createMockRequest({ method: 'GET', url: '/testuser/my-config/install' });
			
			const response = await GetInstallScript({ 
				platform, 
				params,
				request
			} as any);
			
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toContain('text/plain');
			
			const script = await response.text();
			expect(script).toContain('#!/bin/bash');
			expect(script).toContain('OpenBoot');
		});

		it('provides config JSON for CLI', async () => {
			const params = { username: 'testuser', slug: 'my-config' };
			const request = createMockRequest({ method: 'GET', url: '/testuser/my-config/config' });
			
			const response = await GetConfigJSON({ 
				platform, 
				params,
				request
			} as any);
			
			const data = await response.json();
			
			expect(response.status).toBe(200);
			expect(data.username).toBe('testuser');
			expect(data.slug).toBe('my-config');
			expect(data.packages).toBeDefined();
			expect(Array.isArray(data.packages)).toBe(true);
		});
	});

	describe('Data Integrity', () => {
		it('verifies config query filtering works', async () => {
			db.data.configs[0].visibility = 'public';
			db.data.configs[0].featured = 1;
			
			const request = createMockRequest({ method: 'GET', url: '/api/configs/public?username=testuser' });
			const url = new URL('https://openboot.dev/api/configs/public?username=testuser');
			
			const response = await GetPublicConfigs({ 
				platform, 
				request,
				url
			} as any);
			
			const data = await response.json();
			
			expect(response.status).toBe(200);
			expect(data.configs).toBeDefined();
			expect(Array.isArray(data.configs)).toBe(true);
		});

		it('verifies package data integrity', async () => {
			const params = { username: 'testuser', slug: 'my-config' };
			const request = createMockRequest({ method: 'GET', url: '/testuser/my-config/config' });
			
			const response = await GetConfigJSON({ 
				platform, 
				params,
				request
			} as any);
			
			const data = await response.json();
			
			expect(response.status).toBe(200);
			expect(data.packages).toBeDefined();
			
			if (data.packages.length > 0) {
				expect(Array.isArray(data.packages)).toBe(true);
				expect(typeof data.packages[0]).toBe('string');
			}
			
			expect(data.casks).toBeDefined();
			expect(Array.isArray(data.casks)).toBe(true);
			
			expect(data.taps).toBeDefined();
			expect(Array.isArray(data.taps)).toBe(true);
		});
	});

	describe('Error Handling', () => {
		it('handles non-existent configs gracefully', async () => {
			const params = { username: 'nonexistent', slug: 'missing' };
			const request = createMockRequest({ method: 'GET', url: '/nonexistent/missing/config' });
			
			const response = await GetConfigJSON({ 
				platform, 
				params,
				request
			} as any);
			
			const data = await response.json();
			
			expect(response.status).toBe(404);
			expect(data.error).toBeDefined();
		});

		it('handles private configs correctly', async () => {
			db.data.configs[0].visibility = 'private';
			
			const params = { username: 'testuser', slug: 'my-config' };
			const request = createMockRequest({ method: 'GET', url: '/testuser/my-config/config' });
			
			const response = await GetConfigJSON({ 
				platform, 
				params,
				request
			} as any);
			
			const data = await response.json();
			
			expect(response.status).toBe(403);
			expect(data.error).toContain('private');
		});
	});
});
