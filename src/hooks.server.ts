import type { Handle } from '@sveltejs/kit';
import { RESERVED_ALIASES } from '$lib/server/validation';
import { getConfigForHookAlias, getConfigForInstall, getConfigForHookSlug } from '$lib/server/db';
import { serveInstallByAlias, serveInstallBySlug } from '$lib/server/alias';

const INSTALL_SCRIPT_URL = 'https://raw.githubusercontent.com/openbootdotdev/openboot/main/scripts/install.sh';

// Minimum CLI version that is compatible with the current API.
// Bump this when a breaking API change is deployed.
const MIN_CLI_VERSION = '0.25.0';

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

function isVersionOlderThan(version: string, minVersion: string): boolean {
	const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
	const [aMaj = 0, aMin = 0, aPat = 0] = parse(version);
	const [bMaj = 0, bMin = 0, bPat = 0] = parse(minVersion);
	return aMaj < bMaj || (aMaj === bMaj && (aMin < bMin || (aMin === bMin && aPat < bPat)));
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	if (path === '/install.sh') {
		return withSecurityHeaders(Response.redirect(INSTALL_SCRIPT_URL, 302));
	}

	const shortAliasMatch = path.match(/^\/([a-z0-9-]+)$/);
	if (shortAliasMatch && !(RESERVED_ALIASES as readonly string[]).includes(shortAliasMatch[1])) {
		const alias = shortAliasMatch[1];
		const env = event.platform?.env;
		if (env) {
			const config = await getConfigForHookAlias(env.DB, alias);
			if (config) {
				const ua = event.request.headers.get('user-agent') || '';
				const isCurl = /^(curl|wget)\//i.test(ua);
				const isBrowser = (event.request.headers.get('accept') || '').includes('text/html');
				if (isCurl || !isBrowser) {
					return withSecurityHeaders(
						serveInstallByAlias(env.APP_URL, env.DB, alias, config.username, config.slug, config.visibility)
					);
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
			const [, username, slug] = installShMatch;
			const config = await getConfigForInstall(env.DB, username, slug);
			if (config) {
				return withSecurityHeaders(
					serveInstallBySlug(env.APP_URL, env.DB, config.user_id, username, slug, config.visibility)
				);
			}
		}
	}

	const twoSegMatch = path.match(/^\/([a-z0-9_-]+)\/([a-z0-9_-]+)$/i);
	if (twoSegMatch && /^(curl|wget)\//i.test(event.request.headers.get('user-agent') || '')) {
		const env = event.platform?.env;
		if (env) {
			const [, username, slug] = twoSegMatch;
			const config = await getConfigForHookSlug(env.DB, username, slug);
			if (config) {
				return withSecurityHeaders(
					serveInstallBySlug(env.APP_URL, env.DB, config.user_id, username, slug, config.visibility)
				);
			}
		}
	}

	const response = await resolve(event);
	const securedResponse = withSecurityHeaders(response);

	// Version negotiation: if CLI sends X-OpenBoot-Version, check compatibility.
	const cliVersion = event.request.headers.get('x-openboot-version');
	if (cliVersion && cliVersion !== 'dev') {
		securedResponse.headers.set('X-OpenBoot-Min-Version', MIN_CLI_VERSION);
		if (isVersionOlderThan(cliVersion, MIN_CLI_VERSION)) {
			securedResponse.headers.set('X-OpenBoot-Upgrade', 'true');
		}
	}

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
