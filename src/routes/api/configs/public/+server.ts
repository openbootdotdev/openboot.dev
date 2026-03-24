import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPublicConfigs } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const username = url.searchParams.get('username');
	const sort = url.searchParams.get('sort') || 'recent';
	const visibility = url.searchParams.get('visibility');
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

	const { results, total } = await getPublicConfigs(env.DB, { username, sort, visibility, limit, offset });

	return json({
		configs: results,
		total,
		limit,
		offset
	}, {
		headers: { 'Cache-Control': 'public, max-age=60' }
	});
};
