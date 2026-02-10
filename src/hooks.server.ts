import type { Handle } from '@sveltejs/kit';
import { generateInstallScript } from '$lib/server/install-script';

const INSTALL_SCRIPT_URL = 'https://raw.githubusercontent.com/openbootdotdev/openboot/main/scripts/install.sh';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	if (path === '/install.sh') {
		return Response.redirect(INSTALL_SCRIPT_URL, 302);
	}

	const shortAliasMatch = path.match(/^\/([a-z0-9-]+)$/);
	if (shortAliasMatch && !['dashboard', 'api', 'install', 'docs', 'cli-auth'].includes(shortAliasMatch[1])) {
		const alias = shortAliasMatch[1];
		const env = event.platform?.env;

		if (env) {
			const config = await env.DB.prepare('SELECT c.slug, c.custom_script, c.dotfiles_repo, u.username FROM configs c JOIN users u ON c.user_id = u.id WHERE c.alias = ? AND c.is_public = 1')
				.bind(alias)
				.first<{ slug: string; username: string; custom_script: string; dotfiles_repo: string }>();

			if (config) {
				const ua = event.request.headers.get('user-agent') || '';
				const isCurl = /^(curl|wget)\//i.test(ua);
				const accept = event.request.headers.get('accept') || '';
				const isBrowser = accept.includes('text/html');

				if (isCurl || !isBrowser) {
					const script = generateInstallScript(config.username, config.slug, config.custom_script, config.dotfiles_repo || '');

					env.DB.prepare('UPDATE configs SET install_count = install_count + 1 WHERE alias = ?').bind(alias).run().catch(() => {});

					return new Response(script, {
						headers: {
							'Content-Type': 'text/plain; charset=utf-8',
							'Cache-Control': 'no-cache'
						}
					});
				} else if (isBrowser) {
					return Response.redirect(`/${config.username}/${config.slug}`, 302);
				}
			}
		}
	}

	const twoSegMatch = path.match(/^\/([a-z0-9_-]+)\/([a-z0-9_-]+)$/i);
	if (twoSegMatch) {
		const ua = event.request.headers.get('user-agent') || '';
		const isCurl = /^(curl|wget)\//i.test(ua);
		if (isCurl) {
			const env = event.platform?.env;
			if (env) {
				const username = twoSegMatch[1];
				const slug = twoSegMatch[2];

				const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first<{ id: string }>();
				if (user) {
					const config = await env.DB.prepare('SELECT custom_script, is_public, dotfiles_repo FROM configs WHERE user_id = ? AND slug = ?')
						.bind(user.id, slug)
						.first<{ custom_script: string; is_public: number; dotfiles_repo: string }>();

					if (config && config.is_public) {
						const script = generateInstallScript(username, slug, config.custom_script, config.dotfiles_repo || '');

						env.DB.prepare('UPDATE configs SET install_count = install_count + 1 WHERE user_id = ? AND slug = ?').bind(user.id, slug).run().catch(() => {});

						return new Response(script, {
							headers: {
								'Content-Type': 'text/plain; charset=utf-8',
								'Cache-Control': 'no-cache'
							}
						});
					}
				}
			}
		}
	}

	return resolve(event);
};
