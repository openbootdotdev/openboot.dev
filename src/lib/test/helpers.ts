/**
 * Test helper functions
 */

import { sign } from '$lib/server/auth';
import type { D1Database } from '@cloudflare/workers-types';

/**
 * Creates a valid JWT token for testing
 */
export async function createTestJWT(userId: string, username: string): Promise<string> {
	return await sign(
		{
			sub: userId,
			username,
			iat: Math.floor(Date.now() / 1000)
		},
		'test-jwt-secret-key-32-chars-long'
	);
}

/**
 * Creates a Bearer token string
 */
export function createBearerToken(token: string): string {
	return `Bearer ${token}`;
}

/**
 * Extracts JSON from Response
 */
export async function getJSON(response: Response): Promise<any> {
	return await response.json();
}

/**
 * Assert response status
 */
export function assertStatus(response: Response, expectedStatus: number) {
	if (response.status !== expectedStatus) {
		throw new Error(
			`Expected status ${expectedStatus}, got ${response.status}. ` +
				`Response: ${response.statusText}`
		);
	}
}

/**
 * Assert response has error
 */
export async function assertError(response: Response, expectedMessage?: string) {
	const json = await getJSON(response);
	if (!json.error) {
		throw new Error('Expected error property in response');
	}
	if (expectedMessage && !json.error.includes(expectedMessage)) {
		throw new Error(`Expected error to include "${expectedMessage}", got: ${json.error}`);
	}
}

/**
 * Wait for a promise to resolve with a timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
		)
	]);
}

/**
 * Sleep for testing async flows
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random string for testing
 */
export function randomString(length: number = 8): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Query helper that safely extracts data from D1Database
 */
export async function queryFirst<T = unknown>(
	db: D1Database,
	sql: string,
	...bindings: any[]
): Promise<T | null> {
	const result = await db.prepare(sql).bind(...bindings).first<T>();
	return result;
}

/**
 * Query helper that safely extracts all rows from D1Database
 */
export async function queryAll<T = unknown>(
	db: D1Database,
	sql: string,
	...bindings: any[]
): Promise<T[]> {
	const result = await db.prepare(sql).bind(...bindings).all<T>();
	return result.results || [];
}
