import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const username = url.searchParams.get('username');
	const sort = url.searchParams.get('sort') || 'recent';
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

	let orderClause: string;
	let whereClause = `c.visibility = 'public'`;

	if (sort === 'featured') {
		orderClause = 'c.featured DESC, c.install_count DESC, c.updated_at DESC';
	} else if (sort === 'installs') {
		orderClause = 'c.install_count DESC, c.updated_at DESC';
	} else if (sort === 'trending') {
		// This Week: only configs updated in last 7 days, sorted by installs
		whereClause += ` AND c.updated_at >= datetime('now', '-7 days')`;
		orderClause = 'c.install_count DESC, c.updated_at DESC';
	} else if (sort === 'new') {
		// Newest: sort by created_at descending
		orderClause = 'c.created_at DESC';
	} else {
		// recent (default)
		orderClause = 'c.updated_at DESC, c.install_count DESC';
	}

	let query: string;
	let bindings: unknown[];

	if (username) {
		query = `
			SELECT c.id, c.slug, c.name, c.description, c.base_preset, c.packages, c.install_count,
				   c.updated_at, c.created_at, c.forked_from, c.featured,
				   u.username, u.avatar_url
			FROM configs c
			JOIN users u ON c.user_id = u.id
			WHERE ${whereClause} AND u.username = ?
			ORDER BY ${orderClause}
			LIMIT ? OFFSET ?
		`;
		bindings = [username, limit, offset];
	} else {
		query = `
			SELECT c.id, c.slug, c.name, c.description, c.base_preset, c.packages, c.install_count,
				   c.updated_at, c.created_at, c.forked_from, c.featured,
				   u.username, u.avatar_url
			FROM configs c
			JOIN users u ON c.user_id = u.id
			WHERE ${whereClause}
			  AND (
			    c.install_count > 0
			    OR (
			      c.name != 'Default'
			      AND c.description IS NOT NULL
			      AND c.description != ''
			      AND c.description != 'My default configuration'
			      AND json_array_length(c.packages) >= 5
			    )
			  )
			ORDER BY ${orderClause}
			LIMIT ? OFFSET ?
		`;
		bindings = [limit, offset];
	}

	const { results } = await env.DB.prepare(query).bind(...bindings).all();

	let total = 0;
	if (username) {
		const countQuery = `SELECT COUNT(*) as count FROM configs c JOIN users u ON c.user_id = u.id WHERE ${whereClause} AND u.username = ?`;
		const countResult = await env.DB.prepare(countQuery).bind(username).first<{ count: number }>();
		total = countResult?.count || 0;
	} else {
		const countQuery = `
			SELECT COUNT(*) as count 
			FROM configs c 
			WHERE ${whereClause}
			  AND (
			    c.install_count > 0
			    OR (
			      c.name != 'Default'
			      AND c.description IS NOT NULL
			      AND c.description != ''
			      AND c.description != 'My default configuration'
			      AND json_array_length(c.packages) >= 5
			    )
			  )
		`;
		const countResult = await env.DB.prepare(countQuery).first<{ count: number }>();
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
