import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';
import { getConfig, getRevision, restoreConfigToRevision } from '$lib/server/db';

export const POST: RequestHandler = async ({ platform, cookies, params, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const user = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rl = checkRateLimit(getRateLimitKey('config-write', user.id), RATE_LIMITS.CONFIG_WRITE);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	const config = await getConfig(env.DB, user.id, params.slug);
	if (!config) return json({ error: 'Config not found' }, { status: 404 });

	// Verify the revision exists for this config before restoring.
	const revision = await getRevision(env.DB, params.id, config.id);
	if (!revision) return json({ error: 'Revision not found' }, { status: 404 });

	const result = await restoreConfigToRevision(env.DB, config.id, params.id);
	if (!result) return json({ error: 'Revision not found' }, { status: 404 });

	let packages: unknown[] = [];
	try {
		packages = JSON.parse((revision as { packages: string }).packages);
	} catch {
		packages = [];
	}

	return json({ restored: true, revision_id: params.id, packages });
};
