import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser, generateId } from '$lib/server/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ platform, cookies, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const user = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rl = checkRateLimit(getRateLimitKey('cli-approve', user.id), RATE_LIMITS.CLI_APPROVE);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { code } = body;
	if (!code || typeof code !== 'string') {
		return json({ error: 'Code is required' }, { status: 400 });
	}

	const tokenId = generateId();
	const tokenValue = 'obt_' + crypto.randomUUID().replace(/-/g, '');

	try {
		const claimResult = await env.DB.prepare(
			"UPDATE cli_auth_codes SET status = 'processing' WHERE code = ? AND status = 'pending' AND expires_at > datetime('now')"
		)
			.bind(code)
			.run();

		if (!claimResult.meta.changes) {
			return json({ error: 'Invalid or expired code' }, { status: 400 });
		}

		const row = await env.DB.prepare(
			"SELECT id FROM cli_auth_codes WHERE code = ? AND status = 'processing'"
		)
			.bind(code)
			.first<{ id: string }>();

		if (!row) return json({ error: 'Invalid or expired code' }, { status: 400 });

		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO api_tokens (id, user_id, token, name, expires_at)
				VALUES (?, ?, ?, 'cli', datetime('now', '+90 days'))`
			).bind(tokenId, user.id, tokenValue),
			env.DB.prepare(
				"UPDATE cli_auth_codes SET user_id = ?, token_id = ?, status = 'approved' WHERE id = ?"
			).bind(user.id, tokenId, row.id)
		]);
	} catch (e) {
		console.error('POST /api/auth/cli/approve error:', e);
		return json({ error: 'Failed to approve authentication' }, { status: 500 });
	}

	return json({ success: true });
};
