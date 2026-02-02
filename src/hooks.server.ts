import type { Handle } from '@sveltejs/kit';
import { generateInstallScript } from '$lib/server/install-script';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	const shortAliasMatch = path.match(/^\/([a-z0-9-]+)$/);
	if (shortAliasMatch && !['dashboard', 'api', 'install'].includes(shortAliasMatch[1])) {
		const alias = shortAliasMatch[1];
		const env = event.platform?.env;

		if (env) {
			const config = await env.DB.prepare('SELECT c.slug, c.custom_script, c.dotfiles_repo, u.username FROM configs c JOIN users u ON c.user_id = u.id WHERE c.alias = ? AND c.is_public = 1')
				.bind(alias)
				.first<{ slug: string; username: string; custom_script: string; dotfiles_repo: string }>();

			if (config) {
				const script = generateInstallScript(config.username, config.slug, config.custom_script, config.dotfiles_repo || '');

				return new Response(script, {
					headers: {
						'Content-Type': 'text/plain; charset=utf-8',
						'Cache-Control': 'no-cache'
					}
				});
			}
		}
	}

	return resolve(event);
};
