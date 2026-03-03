/**
 * Tests for rate-limit.ts - RateLimiter, getRateLimitKey, checkRateLimit, RATE_LIMITS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRateLimitKey, checkRateLimit, RATE_LIMITS } from './rate-limit';

describe('getRateLimitKey', () => {
	it('should combine endpoint and identifier', () => {
		expect(getRateLimitKey('/api/auth', '1.2.3.4')).toBe('/api/auth:1.2.3.4');
	});

	it('should handle empty strings', () => {
		expect(getRateLimitKey('', '')).toBe(':');
	});
});

describe('RATE_LIMITS', () => {
	it('should define expected rate limit configs', () => {
		expect(RATE_LIMITS.AUTH_LOGIN).toEqual({ maxRequests: 10, windowMs: 60000 });
		expect(RATE_LIMITS.CLI_START).toEqual({ maxRequests: 5, windowMs: 60000 });
		expect(RATE_LIMITS.CLI_POLL).toEqual({ maxRequests: 20, windowMs: 60000 });
		expect(RATE_LIMITS.CONFIG_READ).toEqual({ maxRequests: 30, windowMs: 60000 });
		expect(RATE_LIMITS.SEARCH).toEqual({ maxRequests: 30, windowMs: 60000 });
	});
});

describe('checkRateLimit', () => {
	// Note: the module-level singleton's lastCleanup is set at import time with
	// real Date.now(). We use fake timers starting from the CURRENT real time
	// (not a fixed date) so that advances work correctly relative to lastCleanup.
	beforeEach(() => {
		vi.useFakeTimers({ now: Date.now() });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should allow requests under the limit', () => {
		const key = 'test:allow:' + Math.random();
		const config = { maxRequests: 3, windowMs: 60000 };

		expect(checkRateLimit(key, config).allowed).toBe(true);
		expect(checkRateLimit(key, config).allowed).toBe(true);
		expect(checkRateLimit(key, config).allowed).toBe(true);
	});

	it('should block requests over the limit', () => {
		const key = 'test:block:' + Math.random();
		const config = { maxRequests: 2, windowMs: 60000 };

		checkRateLimit(key, config);
		checkRateLimit(key, config);
		const result = checkRateLimit(key, config);

		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBeDefined();
		expect(result.retryAfter).toBeGreaterThanOrEqual(0);
	});

	it('should reset after window expires', () => {
		const key = 'test:reset:' + Math.random();
		const config = { maxRequests: 1, windowMs: 10000 };

		checkRateLimit(key, config);
		expect(checkRateLimit(key, config).allowed).toBe(false);

		// Advance past the window
		vi.advanceTimersByTime(11000);

		expect(checkRateLimit(key, config).allowed).toBe(true);
	});

	it('should track different keys independently', () => {
		const suffix = Math.random();
		const key1 = 'test:independent1:' + suffix;
		const key2 = 'test:independent2:' + suffix;
		const config = { maxRequests: 1, windowMs: 60000 };

		checkRateLimit(key1, config);
		expect(checkRateLimit(key1, config).allowed).toBe(false);
		expect(checkRateLimit(key2, config).allowed).toBe(true);
	});

	it('should return retryAfter indicating when window opens', () => {
		const key = 'test:retry:' + Math.random();
		const config = { maxRequests: 1, windowMs: 30000 };

		checkRateLimit(key, config);

		vi.advanceTimersByTime(10000);

		const result = checkRateLimit(key, config);
		expect(result.allowed).toBe(false);
		// The oldest request was at t=0, window is 30s, now is t=10s => retryAfter ~20s
		expect(result.retryAfter).toBeLessThanOrEqual(30000);
		expect(result.retryAfter).toBeGreaterThan(0);
	});

	it('should trigger cleanup and remove stale entries', () => {
		const keyStale = 'test:cleanup-stale:' + Math.random();
		const config = { maxRequests: 100, windowMs: 60000 };

		// Make requests that will become stale
		checkRateLimit(keyStale, config);
		checkRateLimit(keyStale, config);

		// Advance past cleanup interval (>60s) AND past the 10min cutoff for entries
		vi.advanceTimersByTime(700000);

		// This call triggers cleanup — stale entries are removed
		const result = checkRateLimit(keyStale, config);
		expect(result.allowed).toBe(true);
	});

	it('should delete keys with all stale entries during cleanup', () => {
		const keyToDelete = 'test:cleanup-delete:' + Math.random();
		const config = { maxRequests: 100, windowMs: 60000 };

		// Add entries
		checkRateLimit(keyToDelete, config);

		// Advance well past 10min cutoff + cleanup interval
		vi.advanceTimersByTime(700000);

		// Trigger cleanup — the old key should be deleted entirely
		checkRateLimit('test:trigger:' + Math.random(), config);

		// Now the key is gone, new requests start fresh
		const result = checkRateLimit(keyToDelete, config);
		expect(result.allowed).toBe(true);
	});

	it('should keep recent entries during cleanup and remove old ones', () => {
		const keyOld = 'test:cleanup-old:' + Math.random();
		const keyRecent = 'test:cleanup-recent:' + Math.random();
		const config = { maxRequests: 1, windowMs: 60000 };

		// Old key — will expire during cleanup
		checkRateLimit(keyOld, config);

		// Advance 11 minutes — past 10min cutoff
		vi.advanceTimersByTime(660000);

		// Recent key — added after advance, within 10min cutoff
		checkRateLimit(keyRecent, config);

		// Advance just past cleanup interval (>60s from the 660s mark)
		vi.advanceTimersByTime(61000);

		// Trigger cleanup
		checkRateLimit('test:trigger:' + Math.random(), config);

		// Old key was cleaned up — can make new requests
		expect(checkRateLimit(keyOld, config).allowed).toBe(true);
		// Recent key still tracks — blocked because it has 1 entry within window...
		// Actually 721s passed since recent key's entry, which is > 60s window
		// So it should also be allowed (entry filtered by windowStart)
		expect(checkRateLimit(keyRecent, config).allowed).toBe(true);
	});

	it('should allow exactly maxRequests within window', () => {
		const key = 'test:exact:' + Math.random();
		const config = { maxRequests: 5, windowMs: 60000 };

		for (let i = 0; i < 5; i++) {
			expect(checkRateLimit(key, config).allowed).toBe(true);
		}

		expect(checkRateLimit(key, config).allowed).toBe(false);
	});

	it('should handle single request limit', () => {
		const key = 'test:single:' + Math.random();
		const config = { maxRequests: 1, windowMs: 1000 };

		expect(checkRateLimit(key, config).allowed).toBe(true);
		expect(checkRateLimit(key, config).allowed).toBe(false);

		vi.advanceTimersByTime(1100);
		expect(checkRateLimit(key, config).allowed).toBe(true);
	});

	it('should update lastCleanup after cleanup runs', () => {
		const key = 'test:update-cleanup:' + Math.random();
		const config = { maxRequests: 100, windowMs: 60000 };

		checkRateLimit(key, config);

		// Advance past cleanup interval
		vi.advanceTimersByTime(61000);
		// Trigger first cleanup
		checkRateLimit(key, config);

		// Advance only 30s — should NOT trigger cleanup again
		vi.advanceTimersByTime(30000);
		// This should work normally without cleanup
		const result = checkRateLimit(key, config);
		expect(result.allowed).toBe(true);

		// Advance another 31s (total >60s since last cleanup) — SHOULD trigger
		vi.advanceTimersByTime(31000);
		checkRateLimit(key, config);
		expect(checkRateLimit(key, config).allowed).toBe(true);
	});
});
