import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const username = url.searchParams.get('username');
	const sort = url.searchParams.get('sort') || 'recent';
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

	const orderClause = sort === 'installs' ? 'c.install_count DESC' : 'c.updated_at DESC';

	let query: string;
	let bindings: unknown[];

	if (username) {
		query = `
			SELECT c.id, c.slug, c.name, c.description, c.base_preset, c.packages, c.install_count,
				   c.updated_at, c.created_at, c.forked_from,
				   u.username, u.avatar_url
			FROM configs c
			JOIN users u ON c.user_id = u.id
			WHERE c.visibility = 'public' AND u.username = ?
			ORDER BY ${orderClause}
			LIMIT ? OFFSET ?
		`;
		bindings = [username, limit, offset];
	} else {
		query = `
			SELECT c.id, c.slug, c.name, c.description, c.base_preset, c.packages, c.install_count,
				   c.updated_at, c.created_at, c.forked_from,
				   u.username, u.avatar_url
			FROM configs c
			JOIN users u ON c.user_id = u.id
			WHERE c.visibility = 'public'
			ORDER BY ${orderClause}
			LIMIT ? OFFSET ?
		`;
		bindings = [limit, offset];
	}

	const { results } = await env.DB.prepare(query).bind(...bindings).all();

	let total = 0;
	if (username) {
		const countResult = await env.DB.prepare(
			'SELECT COUNT(*) as count FROM configs c JOIN users u ON c.user_id = u.id WHERE c.visibility = ? AND u.username = ?'
		).bind('public', username).first<{ count: number }>();
		total = countResult?.count || 0;
	} else {
		const countResult = await env.DB.prepare(
			'SELECT COUNT(*) as count FROM configs WHERE visibility = ?'
		).bind('public').first<{ count: number }>();
		total = countResult?.count || 0;
	}

	return json({
		configs: results,
		total,
		limit,
		offset
	}, {
		headers: { 'Cache-Control': 'public, max-age=60' }
	});
};
