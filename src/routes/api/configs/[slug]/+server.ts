import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser, slugify } from '$lib/server/auth';
import { validateCustomScript, validateDotfilesRepo, validatePackages, RESERVED_ALIASES } from '$lib/server/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';

export const GET: RequestHandler = async ({ platform, cookies, params, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const user = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rlKey = getRateLimitKey('config-read', user.id);
	const rl = checkRateLimit(rlKey, RATE_LIMITS.CONFIG_READ);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	const config = await env.DB.prepare('SELECT * FROM configs WHERE user_id = ? AND slug = ?').bind(user.id, params.slug).first();
	if (!config) return json({ error: 'Config not found' }, { status: 404 });

	const installUrl = config.alias ? `${env.APP_URL}/${config.alias}` : `${env.APP_URL}/${user.username}/${params.slug}`;

	const rawPkgs = JSON.parse((config.packages as string) || '[]');
	const needsTypeInference = rawPkgs.length > 0 && typeof rawPkgs[0] === 'string';

	let caskSet = new Set<string>();
	if (needsTypeInference && config.snapshot) {
		try {
			const snapshot = JSON.parse(config.snapshot as string);
			const casks: string[] = snapshot.packages?.casks || [];
			for (const c of casks) {
				caskSet.add(c);
			}
		} catch {}
	}

	const packages = rawPkgs.map((p: any) => {
		if (typeof p === 'string') {
			const parts = p.split('/');
			if (parts.length === 3) return { name: p, type: 'tap' };
			if (caskSet.has(p)) return { name: p, type: 'cask' };
			return { name: p, type: 'formula' };
		}
		return p;
	});

	let parsedSnapshot = null;
	if (config.snapshot) {
		try {
			parsedSnapshot = JSON.parse(config.snapshot as string);
		} catch {
			parsedSnapshot = null;
		}
	}

	return json({
		config: {
			...config,
			packages,
			snapshot: parsedSnapshot
		},
		install_url: installUrl
	});
};

export const PUT: RequestHandler = async ({ platform, cookies, params, request }) => {
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

	const { name, description, base_preset, packages, custom_script, visibility, alias, dotfiles_repo, snapshot, snapshot_at } = body;

	if (visibility !== undefined && !['public', 'unlisted', 'private'].includes(visibility)) {
		return json({ error: 'Invalid visibility. Must be public, unlisted, or private' }, { status: 400 });
	}

	const rlKeyW = getRateLimitKey('config-write', user.id);
	const rlW = checkRateLimit(rlKeyW, RATE_LIMITS.CONFIG_WRITE);
	if (!rlW.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rlW.retryAfter! / 1000)) } });
	}

	if (packages !== undefined) {
		const pv = validatePackages(packages);
		if (!pv.valid) return json({ error: pv.error }, { status: 400 });
	}

	if (custom_script !== undefined && custom_script !== null && custom_script !== '') {
		const sv = validateCustomScript(custom_script);
		if (!sv.valid) return json({ error: sv.error }, { status: 400 });
	}
	if (dotfiles_repo !== undefined && dotfiles_repo !== null && dotfiles_repo !== '') {
		const rv = validateDotfilesRepo(dotfiles_repo);
		if (!rv.valid) return json({ error: rv.error }, { status: 400 });
	}

	const slug = params.slug;

	const existing = await env.DB.prepare('SELECT id, alias FROM configs WHERE user_id = ? AND slug = ?').bind(user.id, slug).first<{ id: string; alias: string | null }>();
	if (!existing) return json({ error: 'Config not found' }, { status: 404 });

	let newSlug = slug;
	if (name && slugify(name) !== slug) {
		newSlug = slugify(name);
		const conflict = await env.DB.prepare('SELECT id FROM configs WHERE user_id = ? AND slug = ? AND id != ?').bind(user.id, newSlug, existing.id).first();
		if (conflict) return json({ error: 'Config with this name already exists' }, { status: 409 });
	}

	let newAlias = existing.alias;
	if (alias !== undefined) {
		if (alias === '' || alias === null) {
			newAlias = null;
		} else {
			newAlias = alias
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, '')
				.substring(0, 20);
			if (newAlias.length < 2) return json({ error: 'Alias must be at least 2 characters' }, { status: 400 });
			if ((RESERVED_ALIASES as readonly string[]).includes(newAlias)) {
				return json({ error: 'This alias is reserved' }, { status: 400 });
			}
			const aliasExists = await env.DB.prepare('SELECT id FROM configs WHERE alias = ? AND id != ?').bind(newAlias, existing.id).first();
			if (aliasExists) return json({ error: 'This alias is already taken' }, { status: 409 });
		}
	}

	try {
		await env.DB.prepare(
			`
			UPDATE configs SET
				slug = ?,
				name = COALESCE(?, name),
				description = COALESCE(?, description),
				base_preset = COALESCE(?, base_preset),
				packages = COALESCE(?, packages),
				custom_script = COALESCE(?, custom_script),
				visibility = COALESCE(?, visibility),
				alias = ?,
				dotfiles_repo = COALESCE(?, dotfiles_repo),
				snapshot = ?,
				snapshot_at = ?,
				updated_at = datetime('now')
			WHERE user_id = ? AND slug = ?
		`
		)
			.bind(
				newSlug,
				name || null,
				description !== undefined ? description : null,
				base_preset || null,
				packages ? JSON.stringify(packages) : null,
				custom_script !== undefined ? custom_script : null,
				visibility !== undefined ? visibility : null,
				newAlias,
				dotfiles_repo !== undefined ? dotfiles_repo : null,
				snapshot !== undefined ? (snapshot ? JSON.stringify(snapshot) : null) : null,
				snapshot_at !== undefined ? snapshot_at : null,
				user.id,
				slug
			)
			.run();
	} catch (e) {
		console.error('PUT /api/configs/[slug] error:', e);
		return json({ error: 'Failed to update config' }, { status: 500 });
	}

	const installUrl = newAlias ? `${env.APP_URL}/${newAlias}` : `${env.APP_URL}/${user.username}/${newSlug}`;

	return json({ success: true, slug: newSlug, alias: newAlias, install_url: installUrl });
};

export const DELETE: RequestHandler = async ({ platform, cookies, params, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const user = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rlKeyD = getRateLimitKey('config-write', user.id);
	const rlD = checkRateLimit(rlKeyD, RATE_LIMITS.CONFIG_WRITE);
	if (!rlD.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rlD.retryAfter! / 1000)) } });
	}

	await env.DB.prepare('DELETE FROM configs WHERE user_id = ? AND slug = ?').bind(user.id, params.slug).run();

	return json({ success: true });
};
