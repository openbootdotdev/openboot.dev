import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';
import { getCliCode, getTokenById, getUserById, markCliCodeUsed } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const code_id = url.searchParams.get('code_id');
	if (!code_id) return json({ error: 'code_id is required' }, { status: 400 });

	const rl = checkRateLimit(getRateLimitKey('cli-poll', code_id), RATE_LIMITS.CLI_POLL);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	const row = await getCliCode(env.DB, code_id);

	if (!row) return json({ status: 'expired' });

	// SQLite returns date as "YYYY-MM-DD HH:MM:SS" (UTC)
	// We need to convert to ISO format for comparison to avoid string comparison issues
	// where "YYYY-MM-DD HH:MM:SS" < "YYYY-MM-DDTHH:MM:SS.sssZ" due to space < T
	const expiresAt = new Date(row.expires_at.replace(' ', 'T') + 'Z');
	if (expiresAt < new Date()) {
		return json({ status: 'expired' });
	}

	if (row.status === 'pending') {
		return json({ status: 'pending' });
	}

	// Handle both 'approved' and 'used' status - CLI may need to poll multiple times
	if ((row.status === 'approved' || row.status === 'used') && row.token_id && row.user_id) {
		const token = await getTokenById(env.DB, row.token_id);

		const user = await getUserById(env.DB, row.user_id);

		// Atomically mark as used to prevent double-redemption
		if (row.status === 'approved') {
			const updateResult = await markCliCodeUsed(env.DB, code_id);

			// If no rows were updated, another request already redeemed this code
			if (!updateResult.changes) {
				return json({ status: 'used' });
			}
		}

		return json({
			status: 'approved',
			token: token?.token,
			username: user?.username,
			// Ensure strict RFC3339 format for Go client
			expires_at: token?.expires_at ? token.expires_at.replace(' ', 'T') + 'Z' : null
		});
	}

	return json({ status: 'expired' });
};
