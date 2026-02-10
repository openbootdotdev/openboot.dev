import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCurrentUser } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, platform, request, cookies }) => {
	const { username, slug } = params;
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

	// 1. Find user
	const targetUser = await env.DB.prepare('SELECT id, username FROM users WHERE username = ?')
		.bind(username)
		.first<{ id: string; username: string }>();

	if (!targetUser) throw error(404, 'User not found');

	// 2. Find config
	const config = await env.DB.prepare(
		'SELECT * FROM configs WHERE user_id = ? AND slug = ?'
	)
		.bind(targetUser.id, slug)
		.first<any>();

	if (!config) throw error(404, 'Configuration not found');

	// 3. Check visibility
	if (!config.is_public) {
		const currentUser = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
		if (!currentUser || currentUser.id !== targetUser.id) {
			throw error(404, 'Configuration not found'); // Hide private configs
		}
	}

	// Parse JSON fields
	try {
		config.snapshot = JSON.parse(config.snapshot);
		config.packages = JSON.parse(config.packages);
	} catch (e) {
		console.error('Failed to parse config JSON', e);
	}

	const pkgs: {name: string; type: string; desc?: string}[] = Array.isArray(config.packages)
		? config.packages.map((p: any) => typeof p === 'string' ? {name: p, type: 'formula'} : p)
		: [];

	const missing = pkgs.filter(p => !p.desc);
	if (missing.length > 0) {
		const descResults = await Promise.allSettled(
			missing.map(async (p) => {
				try {
					if (p.type === 'npm') {
						const r = await fetch(`https://registry.npmjs.org/${p.name}`, { cf: { cacheTtl: 86400, cacheEverything: true } } as RequestInit);
						if (r.ok) { const d = await r.json() as any; return { name: p.name, desc: d.description || '' }; }
					} else {
						const kind = p.type === 'cask' ? 'cask' : 'formula';
						const r = await fetch(`https://formulae.brew.sh/api/${kind}/${p.name}.json`, { cf: { cacheTtl: 86400, cacheEverything: true } } as RequestInit);
						if (r.ok) { const d = await r.json() as any; return { name: p.name, desc: d.desc || '' }; }
					}
				} catch {}
				return { name: p.name, desc: '' };
			})
		);
		for (const r of descResults) {
			if (r.status === 'fulfilled' && r.value.desc) {
				const pkg = pkgs.find(p => p.name === r.value.name);
				if (pkg) pkg.desc = r.value.desc;
			}
		}
	}

	const packageDescriptions: Record<string, string> = {};
	for (const p of pkgs) {
		if (p.desc) packageDescriptions[p.name] = p.desc;
	}

	return {
		configUser: targetUser,
		config,
		packageDescriptions
	};
};
