import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser, slugify, generateId } from '$lib/server/auth';
import { validateCustomScript, validateDotfilesRepo } from '$lib/server/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';

export const GET: RequestHandler = async ({ platform, cookies, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const user = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rlKey = getRateLimitKey('config-read', user.id);
	const rl = checkRateLimit(rlKey, RATE_LIMITS.CONFIG_READ);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	const { results } = await env.DB.prepare('SELECT id, slug, name, description, base_preset, visibility, alias, updated_at, snapshot, snapshot_at FROM configs WHERE user_id = ? ORDER BY updated_at DESC')
		.bind(user.id)
		.all();

	const configs = results.map((config: any) => {
		let snapshot = null;
		if (config.snapshot) {
			try {
				snapshot = JSON.parse(config.snapshot);
			} catch {
				// Invalid JSON in database - return null instead of crashing
				snapshot = null;
			}
		}
		return {
			...config,
			snapshot
		};
	});

	return json({ configs, username: user.username });
};

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

	const { name, description, base_preset, packages, custom_script, visibility, alias, dotfiles_repo, snapshot, snapshot_at, forked_from } = body;

	if (visibility !== undefined && !['public', 'unlisted', 'private'].includes(visibility)) {
		return json({ error: 'Invalid visibility. Must be public, unlisted, or private' }, { status: 400 });
	}

	const rlKeyW = getRateLimitKey('config-write', user.id);
	const rlW = checkRateLimit(rlKeyW, RATE_LIMITS.CONFIG_WRITE);
	if (!rlW.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rlW.retryAfter! / 1000)) } });
	}

	if (custom_script) {
		const sv = validateCustomScript(custom_script);
		if (!sv.valid) return json({ error: sv.error }, { status: 400 });
	}
	if (dotfiles_repo) {
		const rv = validateDotfilesRepo(dotfiles_repo);
		if (!rv.valid) return json({ error: rv.error }, { status: 400 });
	}

	if (!name) return json({ error: 'Name is required' }, { status: 400 });

	const slug = slugify(name);
	if (!slug) return json({ error: 'Invalid name' }, { status: 400 });

	const existing = await env.DB.prepare('SELECT id FROM configs WHERE user_id = ? AND slug = ?').bind(user.id, slug).first();
	if (existing) return json({ error: 'Config with this name already exists' }, { status: 409 });

	let cleanAlias = null;
	if (alias) {
		cleanAlias = alias
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '')
			.substring(0, 20);
		if (cleanAlias.length < 2) return json({ error: 'Alias must be at least 2 characters' }, { status: 400 });
		if (['api', 'install', 'dashboard', 'login', 'logout'].includes(cleanAlias)) {
			return json({ error: 'This alias is reserved' }, { status: 400 });
		}
		const aliasExists = await env.DB.prepare('SELECT id FROM configs WHERE alias = ?').bind(cleanAlias).first();
		if (aliasExists) return json({ error: 'This alias is already taken' }, { status: 409 });
	}

	const configCount = await env.DB.prepare('SELECT COUNT(*) as count FROM configs WHERE user_id = ?').bind(user.id).first<{ count: number }>();
	if (configCount && configCount.count >= 20) {
		return json({ error: 'Maximum 20 configs per user' }, { status: 400 });
	}

	const id = generateId();

	try {
		await env.DB.prepare(
			`
			INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages, custom_script, visibility, alias, dotfiles_repo, snapshot, snapshot_at, forked_from)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		)
			.bind(id, user.id, slug, name, description || '', base_preset || 'developer', JSON.stringify(packages || []), custom_script || '', visibility || 'unlisted', cleanAlias, dotfiles_repo || '', snapshot ? JSON.stringify(snapshot) : null, snapshot_at || null, forked_from || null)
			.run();
	} catch (e) {
		console.error('POST /api/configs error:', e);
		return json({ error: 'Failed to create config' }, { status: 500 });
	}

	const installUrl = cleanAlias ? `${env.APP_URL}/${cleanAlias}` : `${env.APP_URL}/${user.username}/${slug}`;

	return json({ id, slug, alias: cleanAlias, install_url: installUrl }, { status: 201 });
};
