import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCurrentUser } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, platform, request, cookies }) => {
	try {
		const { username, slug } = params;
		const env = platform?.env;
		if (!env) throw error(500, 'Platform env not available');

		// 1. Find user
		const targetUser = await env.DB.prepare('SELECT id, username, avatar_url FROM users WHERE username = ?')
			.bind(username)
			.first<{ id: string; username: string; avatar_url: string | null }>();

		if (!targetUser) throw error(404, 'User not found');

		// 2. Find config
		const config = await env.DB.prepare(
			'SELECT * FROM configs WHERE user_id = ? AND slug = ?'
		)
			.bind(targetUser.id, slug)
			.first<any>();

		if (!config) throw error(404, 'Configuration not found');

		if (config.visibility === 'private') {
			const currentUser = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
			if (!currentUser || currentUser.id !== targetUser.id) {
				throw error(404, 'Configuration not found');
			}
		}

		// Parse JSON fields
		try {
			config.snapshot = config.snapshot ? JSON.parse(config.snapshot) : null;
			config.packages = config.packages ? JSON.parse(config.packages) : [];
		} catch (e) {
			console.error('Failed to parse config JSON', e);
			config.snapshot = null;
			config.packages = [];
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
				if (r.status === 'fulfilled' && r.value && r.value.desc) {
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
	} catch (e) {
		console.error('Error loading config page:', e);
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		throw error(500, 'Failed to load configuration');
	}
};
