import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser, slugify } from '$lib/server/auth';
import { validateCustomScript, validateDotfilesRepo, validatePackages, validateMacOSPrefs, RESERVED_ALIASES } from '$lib/server/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';
import { getConfig, getConfigIdAndAlias, slugConflict, aliasExistsExcluding, updateConfig, deleteConfig } from '$lib/server/db';

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

	const config = await getConfig(env.DB, user.id, params.slug);
	if (!config) return json({ error: 'Config not found' }, { status: 404 });

	const installUrl = config.alias ? `${env.APP_URL}/${config.alias}` : `${env.APP_URL}/${user.username}/${params.slug}`;

	const rawPkgs = JSON.parse((config.packages as string) || '[]');
	const needsTypeInference = rawPkgs.length > 0 && typeof rawPkgs[0] === 'string';

	// Parse snapshot once and reuse for cask inference and macos_prefs extraction.
	let parsedSnapshot: Record<string, unknown> | null = null;
	if (config.snapshot) {
		try {
			parsedSnapshot = JSON.parse(config.snapshot as string);
		} catch (err) {
			console.error(`[api/configs] failed to parse snapshot for slug ${params.slug}:`, err);
		}
	}

	let caskSet = new Set<string>();
	if (needsTypeInference && parsedSnapshot) {
		const casks: string[] = (parsedSnapshot as any).packages?.casks || [];
		for (const c of casks) {
			caskSet.add(c);
		}
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

	let macosPrefs: { domain: string; key: string; type?: string; value: string; desc?: string }[] | null = null;
	if (parsedSnapshot) {
		const rawPrefs = (parsedSnapshot as any).macos_prefs;
		if (Array.isArray(rawPrefs) && rawPrefs.length > 0) {
			const filtered = rawPrefs
				.filter(
					(p: unknown): p is Record<string, unknown> =>
						typeof p === 'object' &&
						p !== null &&
						typeof (p as Record<string, unknown>).domain === 'string' &&
						typeof (p as Record<string, unknown>).key === 'string' &&
						typeof (p as Record<string, unknown>).value === 'string'
				)
				.map((p: Record<string, unknown>) => ({
					domain: p.domain as string,
					key: p.key as string,
					type: typeof p.type === 'string' ? p.type : '',
					value: p.value as string,
					desc: typeof p.desc === 'string' ? p.desc : ''
				}));
			if (filtered.length > 0) macosPrefs = filtered;
		}
	}

	return json({
		config: {
			...config,
			packages,
			snapshot: parsedSnapshot,
			macos_prefs: macosPrefs
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
	if (snapshot !== undefined && snapshot !== null && snapshot.macos_prefs !== undefined) {
		const pv = validateMacOSPrefs(snapshot.macos_prefs);
		if (!pv.valid) return json({ error: pv.error }, { status: 400 });
	}

	const slug = params.slug;

	const existing = await getConfigIdAndAlias(env.DB, user.id, slug);
	if (!existing) return json({ error: 'Config not found' }, { status: 404 });

	let newSlug = slug;
	if (name && slugify(name) !== slug) {
		newSlug = slugify(name);
		const conflict = await slugConflict(env.DB, user.id, newSlug, existing.id);
		if (conflict) return json({ error: 'Config with this name already exists' }, { status: 409 });
	}

	let newAlias = existing.alias;
	if (alias !== undefined) {
		if (alias === '' || alias === null) {
			newAlias = null;
		} else {
			const cleanedAlias = alias
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, '')
				.substring(0, 20);
			if (cleanedAlias.length < 2) return json({ error: 'Alias must be at least 2 characters' }, { status: 400 });
			if ((RESERVED_ALIASES as readonly string[]).includes(cleanedAlias)) {
				return json({ error: 'This alias is reserved' }, { status: 400 });
			}
			const aliasExistsRow = await aliasExistsExcluding(env.DB, cleanedAlias, existing.id);
			if (aliasExistsRow) return json({ error: 'This alias is already taken' }, { status: 409 });
			newAlias = cleanedAlias;
		}
	}

	try {
		await updateConfig(env.DB, {
			newSlug,
			name: name || null,
			description: description !== undefined ? description : null,
			base_preset: base_preset || null,
			packages: packages ? JSON.stringify(packages) : null,
			custom_script: custom_script !== undefined ? custom_script : null,
			visibility: visibility !== undefined ? visibility : null,
			alias: newAlias,
			dotfiles_repo: dotfiles_repo !== undefined ? dotfiles_repo : null,
			snapshot: snapshot !== undefined ? (snapshot ? JSON.stringify(snapshot) : null) : null,
			snapshot_at: snapshot_at !== undefined ? snapshot_at : null,
			userId: user.id,
			slug
		});
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

	await deleteConfig(env.DB, user.id, params.slug);

	return json({ success: true });
};
