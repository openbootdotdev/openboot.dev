import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser, generateId } from '$lib/server/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';
import { claimCliCode, getProcessingCliCode, prepareCreateApiToken, prepareApproveCliCode } from '$lib/server/db';

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
		const claimResult = await claimCliCode(env.DB, code);

		if (!claimResult.changes) {
			return json({ error: 'Invalid or expired code' }, { status: 400 });
		}

		const row = await getProcessingCliCode(env.DB, code);

		if (!row) return json({ error: 'Invalid or expired code' }, { status: 400 });

		await env.DB.batch([
			prepareCreateApiToken(env.DB, tokenId, user.id, tokenValue),
			prepareApproveCliCode(env.DB, user.id, tokenId, row.id)
		]);
	} catch (e) {
		console.error('POST /api/auth/cli/approve error:', e);
		return json({ error: 'Failed to approve authentication' }, { status: 500 });
	}

	return json({ success: true });
};
