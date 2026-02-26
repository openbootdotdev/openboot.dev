import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCurrentUser } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, platform, locals, request, cookies }) => {
	const { username } = params;
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

	// If hooks resolved this as an alias, load config detail instead of profile
	if (locals.aliasConfig) {
		const { username: configUsername, slug } = locals.aliasConfig;

		const targetUser = await env.DB.prepare('SELECT id, username, avatar_url FROM users WHERE username = ?')
			.bind(configUsername)
			.first<{ id: string; username: string; avatar_url: string | null }>();

		if (!targetUser) throw error(404, 'User not found');

		const config = await env.DB.prepare('SELECT * FROM configs WHERE user_id = ? AND slug = ?')
			.bind(targetUser.id, slug)
			.first<any>();

		if (!config) throw error(404, 'Configuration not found');

		if (config.visibility === 'private') {
			const currentUser = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
			if (!currentUser || currentUser.id !== targetUser.id) {
				throw error(404, 'Configuration not found');
			}
		}

		try {
			config.snapshot = config.snapshot ? JSON.parse(config.snapshot) : null;
			config.packages = config.packages ? JSON.parse(config.packages) : [];
		} catch {
			config.snapshot = null;
			config.packages = [];
		}

		const pkgs: {name: string; type: string; desc?: string}[] = Array.isArray(config.packages)
			? config.packages.map((p: any) => typeof p === 'string' ? {name: p, type: 'formula'} : p)
			: [];

		const packageDescriptions: Record<string, string> = {};
		for (const p of pkgs) {
			if (p.desc) packageDescriptions[p.name] = p.desc;
		}

		return {
			viewType: 'config' as const,
			configUser: targetUser,
			config,
			packageDescriptions
		};
	}

	// Default: load profile page
	const profileUser = await env.DB.prepare(
		'SELECT id, username, avatar_url, created_at FROM users WHERE username = ?'
	)
		.bind(username)
		.first<{ id: string; username: string; avatar_url: string | null; created_at: string }>();

	if (!profileUser) throw error(404, 'User not found');

	const configsResult = await env.DB.prepare(
		'SELECT id, slug, name, description, base_preset, packages, install_count, updated_at FROM configs WHERE user_id = ? AND visibility = ? ORDER BY install_count DESC'
	)
		.bind(profileUser.id, 'public')
		.all<any>();

	const configs = configsResult.results || [];

	for (const config of configs) {
		try {
			config.packages = JSON.parse(config.packages);
		} catch {
			config.packages = [];
		}
	}

	const totalInstalls = configs.reduce((sum: number, c: { install_count?: number }) => sum + (c.install_count || 0), 0);

	return {
		viewType: 'profile' as const,
		profileUser,
		configs,
		totalInstalls
	};
};
