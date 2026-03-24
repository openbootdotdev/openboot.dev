import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { getUserWithAvatar, getConfig, getUserProfile, getUserPublicConfigs } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, platform, locals, request, cookies }) => {
	const { username } = params;
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

	// If hooks resolved this as an alias, load config detail instead of profile
	if (locals.aliasConfig) {
		const { username: configUsername, slug } = locals.aliasConfig;

		const targetUser = await getUserWithAvatar(env.DB, configUsername);

		if (!targetUser) throw error(404, 'User not found');

		const config = await getConfig(env.DB, targetUser.id, slug);

		if (!config) throw error(404, 'Configuration not found');

		if (config.visibility === 'private') {
			const currentUser = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
			if (!currentUser || currentUser.id !== targetUser.id) {
				throw error(404, 'Configuration not found');
			}
		}

		let parsedSnapshot: unknown = null;
		let parsedPackages: unknown[] = [];
		try {
			parsedSnapshot = config.snapshot ? JSON.parse(config.snapshot) : null;
			parsedPackages = config.packages ? JSON.parse(config.packages) : [];
		} catch {
			parsedSnapshot = null;
			parsedPackages = [];
		}

		const parsedConfig = { ...config, snapshot: parsedSnapshot, packages: parsedPackages };

		const pkgs: {name: string; type: string; desc?: string}[] = Array.isArray(parsedPackages)
			? parsedPackages.map((p: unknown) => typeof p === 'string' ? {name: p, type: 'formula'} : p as {name: string; type: string; desc?: string})
			: [];

		const packageDescriptions: Record<string, string> = {};
		for (const p of pkgs) {
			if (p.desc) packageDescriptions[p.name] = p.desc;
		}

		return {
			viewType: 'config' as const,
			configUser: targetUser,
			config: parsedConfig,
			packageDescriptions
		};
	}

	// Default: load profile page
	const profileUser = await getUserProfile(env.DB, username);

	if (!profileUser) throw error(404, 'User not found');

	const rawConfigs = await getUserPublicConfigs(env.DB, profileUser.id, 'public');

	const configs = rawConfigs.map((config) => {
		let packages: unknown[] = [];
		try {
			packages = JSON.parse(config.packages);
		} catch {
			packages = [];
		}
		return { ...config, packages };
	});

	const totalInstalls = configs.reduce((sum: number, c: { install_count?: number }) => sum + (c.install_count || 0), 0);

	return {
		viewType: 'profile' as const,
		profileUser,
		configs,
		totalInstalls
	};
};
