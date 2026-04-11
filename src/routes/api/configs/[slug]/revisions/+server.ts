import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';
import { getConfig, listRevisions } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform, cookies, params, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const user = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rl = checkRateLimit(getRateLimitKey('config-read', user.id), RATE_LIMITS.CONFIG_READ);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	const config = await getConfig(env.DB, user.id, params.slug);
	if (!config) return json({ error: 'Config not found' }, { status: 404 });

	const revisions = await listRevisions(env.DB, config.id);

	return json({ revisions });
};
