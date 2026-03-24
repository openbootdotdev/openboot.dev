import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConfigByAliasForAPI } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform, params }) => {
	const env = platform?.env;
	if (!env) {
		return json({ error: 'Platform env not available' }, { status: 500 });
	}

	const config = await getConfigByAliasForAPI(env.DB, params.alias);

	if (!config) {
		return json({ error: 'Alias not found' }, { status: 404 });
	}

	if (config.visibility === 'private') {
		return json({ error: 'Config is private' }, { status: 403 });
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
					(p: unknown): p is Record<string, unknown> =>
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
			console.error(`[config] failed to parse snapshot for alias ${params.alias}:`, err);
		}
	}

	const rawPackages: any[] = JSON.parse(config.packages || '[]');
	const packageNames: string[] = [];
	const caskNames: string[] = [];
	const npmNames: string[] = [];

	for (const pkg of rawPackages) {
		if (typeof pkg === 'string') {
			if (snapshotCasks.has(pkg)) {
				caskNames.push(pkg);
			} else {
				packageNames.push(pkg);
			}
		} else {
			if (pkg.type === 'npm') {
				npmNames.push(pkg.name);
			} else if (pkg.type === 'cask') {
				caskNames.push(pkg.name);
			} else {
				packageNames.push(pkg.name);
			}
		}
	}

	for (const pkg of packageNames) {
		const parts = pkg.split('/');
		if (parts.length === 3) {
			tapsSet.add(`${parts[0]}/${parts[1]}`);
		}
	}

	const taps = Array.from(tapsSet);

	return json({
		username: config.username,
		slug: config.slug,
		name: config.name,
		preset: config.base_preset,
		packages: packageNames,
		casks: caskNames,
		taps: taps,
		npm: npmNames,
		dotfiles_repo: config.dotfiles_repo || '',
		post_install: config.custom_script
			? config.custom_script.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
			: [],
		macos_prefs: macosPrefs
	});
};
