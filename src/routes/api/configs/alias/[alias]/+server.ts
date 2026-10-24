import { json } from '@sveltejs/kit';
import { normalizePackages, resolvePackages, type PackageInput, type SnapshotPackages } from '$lib/packages';
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

	let snapshotPackages: SnapshotPackages | undefined;
	type MacOSPrefOut = { domain: string; key: string; type: string; value: string; desc: string; host?: string };
	let macosPrefs: MacOSPrefOut[] | null = null;

	if (config.snapshot) {
		try {
			const snapshot = JSON.parse(config.snapshot);
			snapshotPackages = snapshot.packages;
			if (Array.isArray(snapshot.macos_prefs) && snapshot.macos_prefs.length > 0) {
				const filtered = snapshot.macos_prefs
					.filter(
						(p: unknown): p is Record<string, unknown> =>
							typeof p === 'object' &&
							p !== null &&
							typeof (p as Record<string, unknown>).domain === 'string' &&
							typeof (p as Record<string, unknown>).key === 'string' &&
							typeof (p as Record<string, unknown>).value === 'string'
					)
					.map((p: Record<string, unknown>) => {
						const out: MacOSPrefOut = {
							domain: p.domain as string,
							key: p.key as string,
							type: typeof p.type === 'string' ? p.type : '',
							value: p.value as string,
							desc: typeof p.desc === 'string' ? p.desc : ''
						};
						// `host` selects the ByHost scope (defaults -currentHost). Mirrors Go `omitempty`:
						// only emit when non-empty so payloads stay clean for the common main-domain case.
						if (typeof p.host === 'string' && p.host !== '') out.host = p.host;
						return out;
					});
				if (filtered.length > 0) macosPrefs = filtered;
			}
		} catch (err) {
			console.error(`[config] failed to parse snapshot for alias ${params.alias}:`, err);
		}
	}

	const rawPackages: PackageInput[] = JSON.parse(config.packages || '[]');
	const groups = resolvePackages(normalizePackages(rawPackages, snapshotPackages));
	const packageNames = groups.formulae.map((pkg) => pkg.name);
	const caskNames = groups.casks.map((pkg) => pkg.name);
	const npmNames = groups.npm.map((pkg) => pkg.name);
	const taps = groups.taps.map((tap) => tap.name);

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
			? config.custom_script
					.split('\n')
					.map((s: string) => s.trim())
					.filter((s: string) => s.length > 0)
			: [],
		macos_prefs: macosPrefs
	});
};
