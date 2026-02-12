import type { RequestHandler } from './$types';
import { generateInstallScript } from '$lib/server/install-script';

export const GET: RequestHandler = async ({ platform, params, request }) => {
	const env = platform?.env;
	if (!env) {
		return new Response('Platform env not available', { status: 500 });
	}

	const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(params.username).first<{ id: string }>();
	if (!user) {
		return new Response('User not found', { status: 404 });
	}

	const config = await env.DB.prepare('SELECT custom_script, visibility, dotfiles_repo FROM configs WHERE user_id = ? AND slug = ?')
		.bind(user.id, params.slug)
		.first<{ custom_script: string; visibility: string; dotfiles_repo: string }>();

	if (!config) {
		return new Response('Config not found', { status: 404 });
	}

	if (config.visibility === 'private') {
		const authHeader = request.headers.get('authorization') || '';
		const token = authHeader.replace(/^Bearer\s+/i, '');
		if (!token) {
			return new Response('Config is private', { status: 403 });
		}
		const tokenRow = await env.DB.prepare(
			"SELECT user_id FROM api_tokens WHERE token = ? AND expires_at > datetime('now')"
		).bind(token).first<{ user_id: string }>();
		if (!tokenRow || tokenRow.user_id !== user.id) {
			return new Response('Config is private', { status: 403 });
		}
	}

	const script = generateInstallScript(params.username, params.slug, config.custom_script, config.dotfiles_repo || '');

	return new Response(script, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-cache'
		}
	});
};
