import type { RequestEvent } from '@sveltejs/kit';
import { signToken, getCurrentUser, generateId } from './auth';
import { upsertUser, countUserConfigs, createDefaultConfig } from './db';

// Fixed fake account used for local-development auto-login.
const DEV_USER = {
	id: 'dev-user',
	username: 'devuser',
	email: 'dev@localhost'
};

const THIRTY_DAYS = 30 * 24 * 60 * 60;

/**
 * Dev auto-login is gated twice so it can never be active in production:
 *  1. `DEV_AUTH === 'true'` — and that flag only ever lives in `.dev.vars`,
 *     which is gitignored and never deployed, so production env won't have it.
 *  2. The request must be served from localhost — production runs on
 *     openboot.dev, so even a leaked flag can't open the gate there.
 */
function isDevAuthEnabled(event: RequestEvent): boolean {
	if (event.platform?.env?.DEV_AUTH !== 'true') return false;
	const host = event.url.hostname;
	return host === 'localhost' || host === '127.0.0.1';
}

/**
 * On a gated local dev server, make every request authenticated as the fixed
 * dev user: seed it (and a default config) into the local D1 on first use and
 * issue a session cookie. No-op everywhere else, so production is untouched.
 */
export async function ensureDevSession(event: RequestEvent): Promise<void> {
	if (!isDevAuthEnabled(event)) return;
	const env = event.platform!.env;

	const existing = await getCurrentUser(event.request, event.cookies, env.DB, env.JWT_SECRET);
	if (existing) return;

	await upsertUser(env.DB, DEV_USER.id, DEV_USER.username, DEV_USER.email, '');
	if ((await countUserConfigs(env.DB, DEV_USER.id)) === 0) {
		await createDefaultConfig(env.DB, generateId(), DEV_USER.id);
	}

	const token = await signToken(
		{ userId: DEV_USER.id, username: DEV_USER.username, exp: Date.now() + THIRTY_DAYS * 1000 },
		env.JWT_SECRET
	);
	event.cookies.set('session', token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: THIRTY_DAYS
	});
}
