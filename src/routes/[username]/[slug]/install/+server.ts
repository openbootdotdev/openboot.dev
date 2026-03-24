import type { RequestHandler } from './$types';
import { generateInstallScript } from '$lib/server/install-script';
import { getUserByUsername, getConfigVisibility, getValidToken } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform, params, request }) => {
	const env = platform?.env;
	if (!env) {
		return new Response('Platform env not available', { status: 500 });
	}

	const user = await getUserByUsername(env.DB, params.username);
	if (!user) {
		return new Response('User not found', { status: 404 });
	}

	const config = await getConfigVisibility(env.DB, user.id, params.slug);

	if (!config) {
		return new Response('Config not found', { status: 404 });
	}

	if (config.visibility === 'private') {
		const authHeader = request.headers.get('authorization') || '';
		const token = authHeader.replace(/^Bearer\s+/i, '');
		if (!token) {
			return new Response('Config is private', { status: 403 });
		}
		const tokenRow = await getValidToken(env.DB, token);
		if (!tokenRow || tokenRow.user_id !== user.id) {
			return new Response('Config is private', { status: 403 });
		}
	}

	const script = generateInstallScript(params.username, params.slug);

	return new Response(script, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-cache'
		}
	});
};
