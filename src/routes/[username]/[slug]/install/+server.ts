import type { RequestHandler } from './$types';
import { generateInstallScript } from '$lib/server/install-script';

export const GET: RequestHandler = async ({ platform, params }) => {
	const env = platform?.env;
	if (!env) {
		return new Response('Platform env not available', { status: 500 });
	}

	const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(params.username).first<{ id: string }>();
	if (!user) {
		return new Response('User not found', { status: 404 });
	}

	const config = await env.DB.prepare('SELECT custom_script, is_public, dotfiles_repo FROM configs WHERE user_id = ? AND slug = ?')
		.bind(user.id, params.slug)
		.first<{ custom_script: string; is_public: number; dotfiles_repo: string }>();

	if (!config) {
		return new Response('Config not found', { status: 404 });
	}

	if (!config.is_public) {
		return new Response('Config is private', { status: 403 });
	}

	const script = generateInstallScript(params.username, params.slug, config.custom_script, config.dotfiles_repo || '');

	return new Response(script, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-cache'
		}
	});
};
