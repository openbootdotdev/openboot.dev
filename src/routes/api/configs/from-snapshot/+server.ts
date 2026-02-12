import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser, slugify, generateId } from '$lib/server/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ platform, cookies, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const user = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rl = checkRateLimit(getRateLimitKey('config-write', user.id), RATE_LIMITS.CONFIG_WRITE);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { name, description, snapshot, config_slug } = body;

	if (!name) return json({ error: 'Name is required' }, { status: 400 });
	if (!snapshot) return json({ error: 'Snapshot is required' }, { status: 400 });

	const snapshotSize = JSON.stringify(snapshot).length;
	if (snapshotSize > 100000) {
		return json({ error: 'Snapshot payload too large (max 100KB)' }, { status: 400 });
	}

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
		'SELECT id, slug, name, description, base_preset, packages, snapshot, snapshot_at, visibility FROM configs WHERE user_id = ? AND slug = ?'
	).bind(user.id, config_slug).first();

	let parsedSnapshot = null;
	let parsedPackages = [];
	try {
		parsedSnapshot = JSON.parse((updated as any).snapshot);
	} catch {
		parsedSnapshot = null;
	}
	try {
		parsedPackages = JSON.parse((updated as any).packages);
	} catch {
		parsedPackages = [];
	}

	return json({
		...updated,
		snapshot: parsedSnapshot,
		packages: parsedPackages
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
			`INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages, snapshot, snapshot_at, visibility)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'unlisted')`
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
		console.error('POST /api/configs/from-snapshot error:', e);
		return json({ error: 'Failed to create config from snapshot' }, { status: 500 });
	}

	const created = await env.DB.prepare(
		'SELECT id, slug, name, description, base_preset, packages, snapshot, snapshot_at, visibility FROM configs WHERE id = ?'
	).bind(id).first();

	let createdSnapshot = null;
	let createdPackages = [];
	try {
		createdSnapshot = JSON.parse((created as any).snapshot);
	} catch {
		createdSnapshot = null;
	}
	try {
		createdPackages = JSON.parse((created as any).packages);
	} catch {
		createdPackages = [];
	}

	return json({
		...created,
		snapshot: createdSnapshot,
		packages: createdPackages
	}, { status: 201 });
};
