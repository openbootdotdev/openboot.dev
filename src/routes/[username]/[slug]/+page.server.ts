import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { getUserWithAvatar, getConfig } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, platform, request, cookies }) => {
	try {
		const { username, slug } = params;
		const env = platform?.env;
		if (!env) throw error(500, 'Platform env not available');

		// 1. Find user
		const targetUser = await getUserWithAvatar(env.DB, username);

		if (!targetUser) throw error(404, 'User not found');

		// 2. Find config
		const config = await getConfig(env.DB, targetUser.id, slug);

		if (!config) throw error(404, 'Configuration not found');

		if (config.visibility === 'private') {
			const currentUser = await getCurrentUser(request, cookies, env.DB, env.JWT_SECRET);
			if (!currentUser || currentUser.id !== targetUser.id) {
				throw error(404, 'Configuration not found');
			}
		}

		// Parse JSON fields
		let parsedSnapshot: unknown = null;
		let parsedPackages: unknown[] = [];
		try {
			parsedSnapshot = config.snapshot ? JSON.parse(config.snapshot) : null;
			parsedPackages = config.packages ? JSON.parse(config.packages) : [];
		} catch (e) {
			console.error('Failed to parse config JSON', e);
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
			configUser: targetUser,
			config: parsedConfig,
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
