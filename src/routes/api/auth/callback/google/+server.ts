import { redirect, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signToken, generateId, slugify } from '$lib/server/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';
import { validateReturnTo } from '$lib/server/validation';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export const GET: RequestHandler = async ({ url, platform, cookies, request }) => {
	const env = platform?.env;
	if (!env) throw new Error('Platform env not available');

	const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
	const rl = checkRateLimit(getRateLimitKey('auth-callback-google', clientIp), RATE_LIMITS.AUTH_CALLBACK);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const savedState = cookies.get('auth_state');

	if (!code) {
		redirect(302, '/login?error=no_code');
	}

	if (state !== savedState) {
		redirect(302, '/login?error=invalid_state');
	}

	try {
		const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
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
		} else {
			const usernameTaken = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
			if (usernameTaken) {
				username = `${username}-${googleUser.id.slice(-6)}`;
			}
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

		const configCount = await env.DB.prepare('SELECT COUNT(*) as count FROM configs WHERE user_id = ?').bind(userId).first<{ count: number }>();

		if (!configCount || configCount.count === 0) {
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

		const returnToRaw = cookies.get('auth_return_to') || '/dashboard';
		const returnTo = validateReturnTo(returnToRaw) ? returnToRaw : '/dashboard';
		cookies.delete('auth_state', { path: '/' });
		cookies.delete('auth_return_to', { path: '/' });

		redirect(302, returnTo);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
			throw err;
		}
		console.error('Google auth callback error:', err);
		redirect(302, '/login?error=server_error');
	}
};
