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

	return {
		configUser: targetUser,
		config
	};
};
