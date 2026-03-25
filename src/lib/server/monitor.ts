/**
 * Production health monitoring for Cloudflare Workers cron trigger.
 *
 * Checks three critical signals on every run:
 *   1. /api/packages returns a non-empty array
 *   2. /api/health returns status "healthy"
 *   3. DB is reachable (via health endpoint)
 *
 * If any check fails, posts a JSON alert to ALERT_WEBHOOK_URL (if set).
 * Works with Discord, Slack, PagerDuty, or any webhook receiver.
 */

interface CheckResult {
	name: string;
	ok: boolean;
	detail: string;
}

interface MonitorEnv {
	APP_URL: string;
	ALERT_WEBHOOK_URL?: string;
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

async function sendAlert(webhookUrl: string, failures: CheckResult[]): Promise<void> {
	const lines = failures.map((f) => `• **${f.name}**: ${f.detail}`).join('\n');
	const payload = {
		// Discord-compatible format; Slack ignores unknown fields
		content: `🚨 **openboot.dev health alert** — ${failures.length} check(s) failed:\n${lines}`,
		// Slack-compatible fallback
		text: `openboot.dev health alert — ${failures.length} check(s) failed:\n${failures.map((f) => `• ${f.name}: ${f.detail}`).join('\n')}`,
	};
	await fetch(webhookUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
		signal: AbortSignal.timeout(10_000),
	});
}

export async function runHealthChecks(env: MonitorEnv): Promise<void> {
	const appUrl = env.APP_URL ?? 'https://openboot.dev';

	const results = await Promise.all([checkPackages(appUrl), checkHealth(appUrl)]);

	const failures = results.filter((r) => !r.ok);

	if (failures.length > 0 && env.ALERT_WEBHOOK_URL) {
		await sendAlert(env.ALERT_WEBHOOK_URL, failures);
	}

	// Always log — visible in Workers dashboard → Logs
	for (const r of results) {
		const icon = r.ok ? '✓' : '✗';
		console.log(`[monitor] ${icon} ${r.name}: ${r.detail}`);
	}

	if (failures.length > 0) {
		// Non-fatal: don't throw, just log. Workers cron retries on exceptions
		// which could flood alerts. Log and return instead.
		console.error(`[monitor] ${failures.length} check(s) failed`);
	}
}
