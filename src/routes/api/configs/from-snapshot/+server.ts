import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser, slugify, generateId } from '$lib/server/auth';
import { validatePackages } from '$lib/server/validation';
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

	const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
	if (contentLength > 1_048_576) {
		return json({ error: 'Snapshot payload too large (max 1MB)' }, { status: 413 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { name, description, snapshot, config_slug, visibility } = body;

	if (!name) return json({ error: 'Name is required' }, { status: 400 });
	if (typeof name !== 'string' || name.length > 100) return json({ error: 'Name must be a string of 100 characters or less' }, { status: 400 });
	if (description !== undefined && description !== '' && (typeof description !== 'string' || description.length > 500)) return json({ error: 'Description must be a string of 500 characters or less' }, { status: 400 });
	if (!snapshot) return json({ error: 'Snapshot is required' }, { status: 400 });

	const validVisibilities = ['public', 'unlisted', 'private'];
	const validVisibility = validVisibilities.includes(visibility) ? visibility : 'unlisted';

	// Post-parse size check as a fallback (Content-Length can be spoofed or absent).
	const snapshotSize = JSON.stringify(snapshot).length;
	if (snapshotSize > 1_048_576) {
		return json({ error: 'Snapshot payload too large (max 1MB)' }, { status: 413 });
	}

	const base_preset = snapshot.matched_preset || 'developer';

	// Validate snapshot.packages is the canonical structured format:
	// { formulae: string[], casks: string[], taps: string[], npm: string[] }
	if (!snapshot.packages || typeof snapshot.packages !== 'object' || Array.isArray(snapshot.packages)) {
		return json({ error: 'snapshot.packages must be an object with formulae, casks, taps, npm arrays' }, { status: 400 });
	}

	// Build typed package objects from the full snapshot.
	// Read directly from snapshot.packages.* so every installed package
	// is preserved regardless of whether it appears in the catalog.
	const snapshotFormulae: string[] = snapshot.packages?.formulae || [];
	const snapshotCasks: string[] = snapshot.packages?.casks || [];
	const snapshotNpm: string[] = snapshot.packages?.npm || [];
	const snapshotTaps: string[] = snapshot.packages?.taps || [];

	// Build a set of formula names that are already covered by a tap entry
	// (e.g. "argoproj/tap/kubectl-argo-rollouts" covers "kubectl-argo-rollouts")
	// so they don't appear in both CLI and TAPS sections.
	// Only consider three-segment tap entries (owner/tap/formula) to avoid
	// false-positive collisions with two-segment tap names like "homebrew/cask".
	const tapFormulaNames = new Set<string>();
	for (const t of snapshotTaps) {
		const parts = t.split('/');
		if (parts.length === 3) {
			tapFormulaNames.add(parts[2]);
		}
	}

	const packages = [
		...snapshotFormulae
			.filter((name) => !tapFormulaNames.has(name))
			.map((name) => ({ name, type: 'formula' })),
		...snapshotCasks.map((name) => ({ name, type: 'cask' })),
		...snapshotNpm.map((name) => ({ name, type: 'npm' })),
		...snapshotTaps.map((name) => ({ name, type: 'tap' })),
	];

	const pv = validatePackages(packages);
	if (!pv.valid) return json({ error: pv.error }, { status: 400 });

	if (config_slug) {
		const existing = await env.DB.prepare(
			'SELECT * FROM configs WHERE user_id = ? AND slug = ?'
		).bind(user.id, config_slug).first();

		if (!existing) {
			return json({ error: 'Config not found' }, { status: 404 });
		}

		await env.DB.prepare(
			`UPDATE configs
			SET snapshot = ?, snapshot_at = datetime('now'), packages = ?, visibility = ?, updated_at = datetime('now')
			WHERE user_id = ? AND slug = ?`
		)
			.bind(
				JSON.stringify(snapshot),
				JSON.stringify(packages),
				validVisibility,
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
	const MAX_SLUG_ATTEMPTS = 100;
	while (suffix <= MAX_SLUG_ATTEMPTS + 1) {
		const existing = await env.DB.prepare(
			'SELECT id FROM configs WHERE user_id = ? AND slug = ?'
		).bind(user.id, finalSlug).first();

		if (!existing) break;

		finalSlug = `${slug}-${suffix}`;
		suffix++;
	}
	if (suffix > MAX_SLUG_ATTEMPTS + 1) {
		return json({ error: 'Unable to generate unique slug' }, { status: 409 });
	}

	const id = generateId();

	try {
		await env.DB.prepare(
			`INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages, snapshot, snapshot_at, visibility)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`
		)
			.bind(
				id,
				user.id,
				finalSlug,
				name,
				description || '',
				base_preset,
				JSON.stringify(packages),
				JSON.stringify(snapshot),
				validVisibility
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

// The CLI sends PUT for updates — route to the same handler.
export const PUT: RequestHandler = POST;
