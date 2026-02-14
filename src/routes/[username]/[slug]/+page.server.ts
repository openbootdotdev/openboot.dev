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
