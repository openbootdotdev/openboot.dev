import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { username } = params;
	const env = platform?.env;
	if (!env) throw error(500, 'Platform env not available');

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
		profileUser,
		configs,
		totalInstalls
	};
};
