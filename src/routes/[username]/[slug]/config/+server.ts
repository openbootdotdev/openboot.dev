import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPackageDescription } from '$lib/package-metadata';
import { getUserIdAndName, getConfigCLIData, getValidToken } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform, params, request }) => {
	const env = platform?.env;
	if (!env) {
		return json({ error: 'Platform env not available' }, { status: 500 });
	}

	const user = await getUserIdAndName(env.DB, params.username);

	if (!user) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const config = await getConfigCLIData(env.DB, user.id, params.slug);

	if (!config) {
		return json({ error: 'Config not found' }, { status: 404 });
	}

	if (config.visibility === 'private') {
		const authHeader = request.headers.get('authorization') || '';
		const token = authHeader.replace(/^Bearer\s+/i, '');
		if (!token) {
			return json({ error: 'Config is private' }, { status: 403 });
		}
		const tokenRow = await getValidToken(env.DB, token);
		if (!tokenRow || tokenRow.user_id !== user.id) {
			return json({ error: 'Config is private' }, { status: 403 });
		}
	}

	const tapsSet = new Set<string>();
	const snapshotCasks = new Set<string>();
	let macosPrefs: { domain: string; key: string; type: string; value: string; desc: string }[] | null = null;

	if (config.snapshot) {
		try {
			const snapshot = JSON.parse(config.snapshot);
			for (const tap of snapshot.packages?.taps || []) {
				tapsSet.add(tap);
			}
			for (const cask of snapshot.packages?.casks || []) {
				snapshotCasks.add(cask);
			}
			if (Array.isArray(snapshot.macos_prefs) && snapshot.macos_prefs.length > 0) {
				const filtered = snapshot.macos_prefs.filter(
					(p: unknown): p is { domain: string; key: string; type: string; value: string; desc: string } =>
						typeof p === 'object' &&
						p !== null &&
						typeof (p as Record<string, unknown>).domain === 'string' &&
						typeof (p as Record<string, unknown>).key === 'string' &&
						typeof (p as Record<string, unknown>).value === 'string'
				).map((p: Record<string, unknown>) => ({
					domain: p.domain as string,
					key: p.key as string,
					type: typeof p.type === 'string' ? p.type : '',
					value: p.value as string,
					desc: typeof p.desc === 'string' ? p.desc : ''
				}));
				if (filtered.length > 0) macosPrefs = filtered;
			}
		} catch (err) {
			console.error(`[config] failed to parse snapshot for ${params.username}/${params.slug}:`, err);
		}
	}

	const rawPackages: any[] = JSON.parse(config.packages || '[]');
	const formulae: { name: string; desc: string }[] = [];
	const casks: { name: string; desc: string }[] = [];
	const npms: { name: string; desc: string }[] = [];

	for (const pkg of rawPackages) {
		const name = typeof pkg === 'string' ? pkg : pkg.name;
		const desc = (typeof pkg === 'object' && pkg.desc) || getPackageDescription(name);

		if (typeof pkg === 'string') {
			if (snapshotCasks.has(pkg)) {
				casks.push({ name, desc });
			} else {
				formulae.push({ name, desc });
			}
		} else {
			if (pkg.type === 'npm') {
				npms.push({ name, desc });
			} else if (pkg.type === 'cask') {
				casks.push({ name, desc });
			} else {
				formulae.push({ name, desc });
			}
		}
	}

	for (const pkg of formulae) {
		const parts = pkg.name.split('/');
		if (parts.length === 3) {
			tapsSet.add(`${parts[0]}/${parts[1]}`);
		}
	}

	const taps = Array.from(tapsSet);

	return json({
		username: user.username,
		slug: config.slug,
		name: config.name,
		preset: config.base_preset,
		packages: formulae,
		casks,
		taps,
		npm: npms,
		dotfiles_repo: config.dotfiles_repo || '',
		post_install: config.custom_script
			? config.custom_script.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
			: [],
		macos_prefs: macosPrefs
	});
};
