import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, params }) => {
	const env = platform?.env;
	if (!env) {
		return json({ error: 'Platform env not available' }, { status: 500 });
	}

	const user = await env.DB.prepare('SELECT id, username FROM users WHERE username = ?')
		.bind(params.username)
		.first<{ id: string; username: string }>();

	if (!user) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const config = await env.DB.prepare(
		'SELECT slug, name, base_preset, packages, snapshot, is_public, dotfiles_repo FROM configs WHERE user_id = ? AND slug = ?'
	)
		.bind(user.id, params.slug)
		.first<{ slug: string; name: string; base_preset: string; packages: string; snapshot: string; is_public: number; dotfiles_repo: string }>();

	if (!config) {
		return json({ error: 'Config not found' }, { status: 404 });
	}

	if (!config.is_public) {
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
		username: user.username,
		slug: config.slug,
		name: config.name,
		preset: config.base_preset,
		packages: packageNames,
		casks: caskNames,
		taps: taps,
		npm: npmNames,
		dotfiles_repo: config.dotfiles_repo || ''
	});
};
