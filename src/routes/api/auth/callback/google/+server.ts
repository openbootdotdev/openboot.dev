import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signToken, generateId, slugify } from '$lib/server/auth';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const env = platform?.env;
	if (!env) throw new Error('Platform env not available');

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const savedState = cookies.get('auth_state');

	if (!code) {
		redirect(302, '/login?error=no_code');
	}

	if (state !== savedState) {
		redirect(302, '/login?error=invalid_state');
	}

	const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			client_id: env.GOOGLE_CLIENT_ID,
			client_secret: env.GOOGLE_CLIENT_SECRET,
			code,
			redirect_uri: `${env.APP_URL}/api/auth/callback/google`,
			grant_type: 'authorization_code'
		})
	});

	const tokenData = await tokenResponse.json();
	if (tokenData.error || !tokenData.access_token) {
		redirect(302, '/login?error=token_failed');
	}

	const userResponse = await fetch(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${tokenData.access_token}` }
	});

	const googleUser = await userResponse.json();
	if (!googleUser.id || !googleUser.email) {
		redirect(302, '/login?error=user_failed');
	}

	const userId = `google_${googleUser.id}`;
	const reservedUsernames = ['openboot', 'admin', 'api', 'dashboard', 'install', 'login', 'logout', 'settings', 'help', 'support', 'docs', 'blog'];
	
	let username = slugify(googleUser.email.split('@')[0]);
	if (reservedUsernames.includes(username.toLowerCase()) || username.length < 3) {
		username = `user-${googleUser.id.slice(-8)}`;
	}

	const existingUser = await env.DB.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
	if (existingUser) {
		username = (existingUser as { username: string }).username;
	}

	await env.DB.prepare(
		`
		INSERT INTO users (id, username, email, avatar_url, updated_at)
		VALUES (?, ?, ?, ?, datetime('now'))
		ON CONFLICT(id) DO UPDATE SET
			email = excluded.email,
			avatar_url = excluded.avatar_url,
			updated_at = datetime('now')
	`
	)
		.bind(userId, username, googleUser.email, googleUser.picture || '')
		.run();

	const existingConfig = await env.DB.prepare('SELECT id FROM configs WHERE user_id = ? AND slug = ?').bind(userId, 'default').first();

	if (!existingConfig) {
		await env.DB.prepare(
			`
			INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages)
			VALUES (?, ?, 'default', 'Default', 'My default configuration', 'developer', '[]')
		`
		)
			.bind(generateId(), userId)
			.run();
	}

	const thirtyDays = 30 * 24 * 60 * 60;
	const token = await signToken({ userId, username, exp: Date.now() + thirtyDays * 1000 }, env.JWT_SECRET);

	cookies.set('session', token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: thirtyDays
	});

	const returnTo = cookies.get('auth_return_to') || '/dashboard';
	cookies.delete('auth_state', { path: '/' });
	cookies.delete('auth_return_to', { path: '/' });

	redirect(302, returnTo);
};
