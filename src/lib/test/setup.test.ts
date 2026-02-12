/**
 * Test to verify vitest setup is working
 */

import { describe, it, expect } from 'vitest';
import { createMockDB } from './db-mock';
import { mockUser, mockConfig } from './fixtures';
import { randomString } from './helpers';

describe('Test Infrastructure', () => {
	it('should import vitest correctly', () => {
		expect(true).toBe(true);
	});

	it('should create mock DB', async () => {
		const db = createMockDB({
			users: [mockUser]
		});

		const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(mockUser.id).first();

		expect(result).toEqual(mockUser);
	});

	it('should use fixtures', () => {
		expect(mockUser.username).toBe('testuser');
		expect(mockConfig.slug).toBe('my-config');
	});

	it('should generate random strings', () => {
		const str1 = randomString(8);
		const str2 = randomString(8);

		expect(str1).toHaveLength(8);
		expect(str2).toHaveLength(8);
		expect(str1).not.toBe(str2);
	});
});
