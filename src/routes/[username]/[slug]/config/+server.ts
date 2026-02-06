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
		'SELECT slug, name, base_preset, packages, is_public, dotfiles_repo FROM configs WHERE user_id = ? AND slug = ?'
	)
		.bind(user.id, params.slug)
		.first<{ slug: string; name: string; base_preset: string; packages: string; is_public: number; dotfiles_repo: string }>();

	if (!config) {
		return json({ error: 'Config not found' }, { status: 404 });
	}

	if (!config.is_public) {
		return json({ error: 'Config is private' }, { status: 403 });
	}

	const packages: string[] = JSON.parse(config.packages || '[]');

	const tapsSet = new Set<string>();

	for (const pkg of packages) {
		const parts = pkg.split('/');
		if (parts.length === 3) {
			tapsSet.add(`${parts[0]}/${parts[1]}`);
		}
	}

	const snapshotRow = await env.DB.prepare(
		'SELECT snapshot FROM configs WHERE user_id = ? AND slug = ?'
	)
		.bind(user.id, params.slug)
		.first<{ snapshot: string }>();

	if (snapshotRow?.snapshot) {
		try {
			const snapshot = JSON.parse(snapshotRow.snapshot);
			const snapshotTaps = snapshot.packages?.taps || [];
			for (const tap of snapshotTaps) {
				tapsSet.add(tap);
			}
		} catch {
		}
	}

	const taps = Array.from(tapsSet);

	return json({
		username: user.username,
		slug: config.slug,
		name: config.name,
		preset: config.base_preset,
		packages: packages,
		taps: taps,
		dotfiles_repo: config.dotfiles_repo || ''
	});
};
