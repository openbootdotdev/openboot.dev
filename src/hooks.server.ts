import type { Handle } from '@sveltejs/kit';
import { generateInstallScript, generatePrivateInstallScript } from '$lib/server/install-script';

const INSTALL_SCRIPT_URL = 'https://raw.githubusercontent.com/openbootdotdev/openboot/main/scripts/install.sh';

const SECURITY_HEADERS: Record<string, string> = {
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'X-XSS-Protection': '0',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' https: data:",
		"font-src 'self' https://fonts.gstatic.com",
		"connect-src 'self' https://api.github.com https://accounts.google.com https://oauth2.googleapis.com https://formulae.brew.sh https://registry.npmjs.org",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self' https://github.com https://accounts.google.com"
	].join('; ')
};

function withSecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		headers.set(key, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	if (path === '/install.sh') {
		return withSecurityHeaders(Response.redirect(INSTALL_SCRIPT_URL, 302));
	}

	const shortAliasMatch = path.match(/^\/([a-z0-9-]+)$/);
	if (shortAliasMatch && !['dashboard', 'api', 'install', 'docs', 'cli-auth', 'explore'].includes(shortAliasMatch[1])) {
		const alias = shortAliasMatch[1];
		const env = event.platform?.env;

		if (env) {
			const config = await env.DB.prepare('SELECT c.slug, c.custom_script, c.dotfiles_repo, c.visibility, u.username FROM configs c JOIN users u ON c.user_id = u.id WHERE c.alias = ?')
				.bind(alias)
				.first<{ slug: string; username: string; custom_script: string; dotfiles_repo: string; visibility: string }>();

			if (config) {
				const ua = event.request.headers.get('user-agent') || '';
				const isCurl = /^(curl|wget)\//i.test(ua);
				const accept = event.request.headers.get('accept') || '';
				const isBrowser = accept.includes('text/html');

				if (isCurl || !isBrowser) {
					if (config.visibility === 'private') {
						const script = generatePrivateInstallScript(env.APP_URL, config.username, config.slug);
						return withSecurityHeaders(new Response(script, {
							headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
						}));
					}

					const script = generateInstallScript(config.username, config.slug, config.custom_script, config.dotfiles_repo || '');

					env.DB.prepare('UPDATE configs SET install_count = install_count + 1 WHERE alias = ?').bind(alias).run().catch(() => {});

					return withSecurityHeaders(new Response(script, {
						headers: {
							'Content-Type': 'text/plain; charset=utf-8',
							'Cache-Control': 'no-cache'
						}
					}));
				} else if (isBrowser) {
					event.locals.aliasConfig = { username: config.username, slug: config.slug };
				}
			}
		}
	}

	const installShMatch = path.match(/^\/([a-z0-9_-]+)\/([a-z0-9_-]+)\/install\.sh$/i);
	if (installShMatch) {
		const env = event.platform?.env;
		if (env) {
			const username = installShMatch[1];
			const slug = installShMatch[2];

			const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first<{ id: string }>();
			if (user) {
				const config = await env.DB.prepare('SELECT custom_script, visibility, dotfiles_repo FROM configs WHERE user_id = ? AND slug = ?')
					.bind(user.id, slug)
					.first<{ custom_script: string; visibility: string; dotfiles_repo: string }>();

				if (config) {
					if (config.visibility === 'private') {
						const script = generatePrivateInstallScript(env.APP_URL, username, slug);
						return withSecurityHeaders(new Response(script, {
							headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
						}));
					}

					const script = generateInstallScript(username, slug, config.custom_script, config.dotfiles_repo || '');

					env.DB.prepare('UPDATE configs SET install_count = install_count + 1 WHERE user_id = ? AND slug = ?').bind(user.id, slug).run().catch(() => {});

					return withSecurityHeaders(new Response(script, {
						headers: {
							'Content-Type': 'text/plain; charset=utf-8',
							'Cache-Control': 'no-cache'
						}
					}));
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
				const config = await env.DB.prepare('SELECT custom_script, visibility, dotfiles_repo FROM configs WHERE user_id = ? AND slug = ?')
					.bind(user.id, slug)
					.first<{ custom_script: string; visibility: string; dotfiles_repo: string }>();

				if (config) {
						if (config.visibility === 'private') {
							const script = generatePrivateInstallScript(env.APP_URL, username, slug);
							return withSecurityHeaders(new Response(script, {
								headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
							}));
						}

						const script = generateInstallScript(username, slug, config.custom_script, config.dotfiles_repo || '');

						env.DB.prepare('UPDATE configs SET install_count = install_count + 1 WHERE user_id = ? AND slug = ?').bind(user.id, slug).run().catch(() => {});

						return withSecurityHeaders(new Response(script, {
							headers: {
								'Content-Type': 'text/plain; charset=utf-8',
								'Cache-Control': 'no-cache'
							}
						}));
					}
				}
			}
		}
	}

	const response = await resolve(event);
	const securedResponse = withSecurityHeaders(response);

	// Prevent indexing of non-content routes
	const noindexPrefixes = ['/api/', '/dashboard/', '/cli-auth/', '/install'];
	const noindexSuffixes = ['/install', '/config', '/og'];
	const shouldNoindex =
		noindexPrefixes.some((p) => path.startsWith(p)) ||
		noindexSuffixes.some((s) => path.endsWith(s));

	if (shouldNoindex) {
		const headers = new Headers(securedResponse.headers);
		headers.set('X-Robots-Tag', 'noindex');
		return new Response(securedResponse.body, {
			status: securedResponse.status,
			statusText: securedResponse.statusText,
			headers
		});
	}

	return securedResponse;
};
