/**
 * Production health monitoring for Cloudflare Workers cron trigger.
 *
 * Checks two critical signals on every run:
 *   1. /api/packages returns a non-empty array
 *   2. /api/health returns status "healthy" (DB reachable)
 *
 * Results are logged to Workers dashboard. Runtime errors are captured
 * via Sentry (configured in hooks.server.ts).
 */

interface CheckResult {
	name: string;
	ok: boolean;
	detail: string;
}

interface MonitorEnv {
	APP_URL: string;
}

async function checkPackages(appUrl: string): Promise<CheckResult> {
	try {
		const res = await fetch(`${appUrl}/api/packages`, { signal: AbortSignal.timeout(10_000) });
		if (!res.ok) {
			return { name: 'packages', ok: false, detail: `HTTP ${res.status}` };
		}
		const body = (await res.json()) as { packages?: unknown[] };
		const count = body?.packages?.length ?? 0;
		if (count === 0) {
			return { name: 'packages', ok: false, detail: 'returned empty array' };
		}
		return { name: 'packages', ok: true, detail: `${count} packages` };
	} catch (err) {
		return { name: 'packages', ok: false, detail: String(err) };
	}
}

async function checkHealth(appUrl: string): Promise<CheckResult> {
	try {
		const res = await fetch(`${appUrl}/api/health`, { signal: AbortSignal.timeout(10_000) });
		const body = (await res.json()) as { status?: string; checks?: Record<string, string> };
		if (body?.status !== 'healthy') {
			const detail = body?.checks
				? Object.entries(body.checks)
						.filter(([, v]) => v !== 'ok')
						.map(([k, v]) => `${k}=${v}`)
						.join(', ')
				: `status=${body?.status}`;
			return { name: 'health', ok: false, detail: detail || 'degraded' };
		}
		return { name: 'health', ok: true, detail: 'healthy' };
	} catch (err) {
		return { name: 'health', ok: false, detail: String(err) };
	}
}

export async function runHealthChecks(env: MonitorEnv): Promise<void> {
	const appUrl = env.APP_URL ?? 'https://openboot.dev';

	const results = await Promise.all([checkPackages(appUrl), checkHealth(appUrl)]);

	for (const r of results) {
		const icon = r.ok ? '✓' : '✗';
		console.log(`[monitor] ${icon} ${r.name}: ${r.detail}`);
	}

	const failures = results.filter((r) => !r.ok);
	if (failures.length > 0) {
		// Throw so Sentry (via handleError / uncaught exception) captures the alert.
		throw new Error(
			`Health check failed: ${failures.map((f) => `${f.name}=${f.detail}`).join(', ')}`
		);
	}
}
