/**
 * In-memory sliding window rate limiter (per Worker isolate).
 *
 * PRODUCTION NOTE: This is NOT globally consistent across Cloudflare Workers isolates.
 * For production-grade global rate limiting, configure Cloudflare Rate Limiting rules:
 * https://developers.cloudflare.com/waf/rate-limiting-rules/
 *
 * Recommended Cloudflare rule:
 *   - Rate: 100 requests per minute per IP
 *   - Action: Block with 429 status
 *   - Scope: /api/*
 */

interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
}

interface RateLimitResult {
	allowed: boolean;
	retryAfter?: number;
}

class RateLimiter {
	private requests: Map<string, number[]> = new Map();
	private lastCleanup: number = Date.now();
	private readonly CLEANUP_INTERVAL_MS = 60000;

	check(key: string, config: RateLimitConfig): RateLimitResult {
		const now = Date.now();
		const windowStart = now - config.windowMs;

		if (now - this.lastCleanup > this.CLEANUP_INTERVAL_MS) {
			this.cleanup(now);
		}

		let timestamps = this.requests.get(key) || [];
		timestamps = timestamps.filter((ts) => ts > windowStart);

		if (timestamps.length >= config.maxRequests) {
			const oldestInWindow = timestamps[0];
			const retryAfter = oldestInWindow + config.windowMs - now;
			return { allowed: false, retryAfter: Math.max(retryAfter, 0) };
		}

		timestamps.push(now);
		this.requests.set(key, timestamps);
		return { allowed: true };
	}

	private cleanup(now: number): void {
		const cutoff = now - 600000;
		for (const [key, timestamps] of this.requests.entries()) {
			const recent = timestamps.filter((ts) => ts > cutoff);
			if (recent.length === 0) {
				this.requests.delete(key);
			} else {
				this.requests.set(key, recent);
			}
		}
		this.lastCleanup = now;
	}
}

const rateLimiter = new RateLimiter();

export function getRateLimitKey(endpoint: string, identifier: string): string {
	return `${endpoint}:${identifier}`;
}

export const RATE_LIMITS = {
	AUTH_LOGIN: { maxRequests: 10, windowMs: 60000 },
	AUTH_CALLBACK: { maxRequests: 10, windowMs: 60000 },
	CLI_START: { maxRequests: 5, windowMs: 60000 },
	CLI_APPROVE: { maxRequests: 10, windowMs: 60000 },
	CLI_POLL: { maxRequests: 20, windowMs: 60000 },
	CONFIG_READ: { maxRequests: 30, windowMs: 60000 },
	CONFIG_WRITE: { maxRequests: 30, windowMs: 60000 }
} as const;

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
	return rateLimiter.check(key, config);
}
