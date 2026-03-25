import { generateInstallScript, generatePrivateInstallScript } from '$lib/server/install-script';
import { incrementInstallByAlias, incrementInstallBySlug } from '$lib/server/db';
import type { D1Database } from '@cloudflare/workers-types';

const SCRIPT_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' };

export function serveInstallByAlias(
	appUrl: string,
	db: D1Database,
	alias: string,
	username: string,
	slug: string,
	visibility: string
): Response {
	if (visibility === 'private') {
		return new Response(generatePrivateInstallScript(appUrl, username, slug), { headers: SCRIPT_HEADERS });
	}
	incrementInstallByAlias(db, alias);
	return new Response(generateInstallScript(username, slug), { headers: SCRIPT_HEADERS });
}

export function serveInstallBySlug(
	appUrl: string,
	db: D1Database,
	userId: string,
	username: string,
	slug: string,
	visibility: string
): Response {
	if (visibility === 'private') {
		return new Response(generatePrivateInstallScript(appUrl, username, slug), { headers: SCRIPT_HEADERS });
	}
	incrementInstallBySlug(db, userId, slug);
	return new Response(generateInstallScript(username, slug), { headers: SCRIPT_HEADERS });
}
