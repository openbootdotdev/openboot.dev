import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, params }) => {
	const env = platform?.env;
	if (!env) {
		return json({ error: 'Platform env not available' }, { status: 500 });
	}

	const config = await env.DB.prepare(
		`SELECT c.slug, c.name, c.base_preset, c.packages, c.snapshot, c.visibility, c.dotfiles_repo, c.custom_script,
		        u.username
		 FROM configs c
		 JOIN users u ON c.user_id = u.id
		 WHERE c.alias = ?`
	)
		.bind(params.alias)
		.first<{ slug: string; name: string; base_preset: string; packages: string; snapshot: string; visibility: string; dotfiles_repo: string; custom_script: string; username: string }>();

	if (!config) {
		return json({ error: 'Alias not found' }, { status: 404 });
	}

	if (config.visibility === 'private') {
		return json({ error: 'Config is private' }, { status: 403 });
	}

	const tapsSet = new Set<string>();
	const snapshotCasks = new Set<string>();

	if (config.snapshot) {
		try {
			const snapshot = JSON.parse(config.snapshot);
			for (const tap of snapshot.packages?.taps || []) {
				tapsSet.add(tap);
			}
			for (const cask of snapshot.packages?.casks || []) {
				snapshotCasks.add(cask);
			}
		} catch {
		}
	}

	const rawPackages: any[] = JSON.parse(config.packages || '[]');
	const packageNames: string[] = [];
	const caskNames: string[] = [];
	const npmNames: string[] = [];

	for (const pkg of rawPackages) {
		if (typeof pkg === 'string') {
			packageNames.push(pkg);
			if (snapshotCasks.has(pkg)) {
				caskNames.push(pkg);
			}
		} else {
			if (pkg.type === 'npm') {
				npmNames.push(pkg.name);
			} else {
				packageNames.push(pkg.name);
				if (pkg.type === 'cask') {
					caskNames.push(pkg.name);
				}
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
			: []
	});
};
