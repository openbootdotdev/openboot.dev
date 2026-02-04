import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser, slugify, generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ platform, cookies, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const user = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { name, description, snapshot, config_slug } = body;

	if (!name) return json({ error: 'Name is required' }, { status: 400 });
	if (!snapshot) return json({ error: 'Snapshot is required' }, { status: 400 });

	const packages = snapshot.catalog_match?.matched || [];
	const base_preset = snapshot.matched_preset || 'developer';

	if (config_slug) {
		const existing = await env.DB.prepare(
			'SELECT * FROM configs WHERE user_id = ? AND slug = ?'
		).bind(user.id, config_slug).first();

		if (!existing) {
			return json({ error: 'Config not found' }, { status: 404 });
		}

		await env.DB.prepare(
			`UPDATE configs 
			SET snapshot = ?, snapshot_at = datetime('now'), packages = ?
			WHERE user_id = ? AND slug = ?`
		)
			.bind(
				JSON.stringify(snapshot),
				JSON.stringify(packages),
				user.id,
				config_slug
			)
			.run();

		const updated = await env.DB.prepare(
			'SELECT id, slug, name, description, base_preset, packages, snapshot, snapshot_at, is_public FROM configs WHERE user_id = ? AND slug = ?'
		).bind(user.id, config_slug).first();

		return json({
			...updated,
			snapshot: JSON.parse((updated as any).snapshot),
			packages: JSON.parse((updated as any).packages)
		});
	}

	const configCount = await env.DB.prepare(
		'SELECT COUNT(*) as count FROM configs WHERE user_id = ?'
	).bind(user.id).first<{ count: number }>();

	if (configCount && configCount.count >= 20) {
		return json({ error: 'Maximum 20 configs per user' }, { status: 400 });
	}

	let slug = slugify(name);
	if (!slug) return json({ error: 'Invalid name' }, { status: 400 });

	let finalSlug = slug;
	let suffix = 2;
	while (true) {
		const existing = await env.DB.prepare(
			'SELECT id FROM configs WHERE user_id = ? AND slug = ?'
		).bind(user.id, finalSlug).first();

		if (!existing) break;

		finalSlug = `${slug}-${suffix}`;
		suffix++;
	}

	const id = generateId();

	try {
		await env.DB.prepare(
			`INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages, snapshot, snapshot_at, is_public)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 1)`
		)
			.bind(
				id,
				user.id,
				finalSlug,
				name,
				description || '',
				base_preset,
				JSON.stringify(packages),
				JSON.stringify(snapshot)
			)
			.run();
	} catch (e) {
		return json({ error: 'Database error: ' + (e as Error).message }, { status: 500 });
	}

	const created = await env.DB.prepare(
		'SELECT id, slug, name, description, base_preset, packages, snapshot, snapshot_at, is_public FROM configs WHERE id = ?'
	).bind(id).first();

	return json({
		...created,
		snapshot: JSON.parse((created as any).snapshot),
		packages: JSON.parse((created as any).packages)
	}, { status: 201 });
};
