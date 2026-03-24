import { redirect, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signToken, generateId, slugify } from '$lib/server/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';
import { validateReturnTo } from '$lib/server/validation';
import { getUserById, getUserByUsername, upsertUser, countUserConfigs, createDefaultConfig } from '$lib/server/db';

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
		cookies.delete('auth_state', { path: '/' });
		cookies.delete('auth_return_to', { path: '/' });
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

		const existingUser = await getUserById(env.DB, userId);
		if (existingUser) {
			username = existingUser.username;
		} else {
			const usernameTaken = await getUserByUsername(env.DB, username);
			if (usernameTaken) {
				username = `${username}-${googleUser.id.slice(-6)}`;
			}
		}

		await upsertUser(env.DB, userId, username, googleUser.email, googleUser.picture || '');

		const configCount = await countUserConfigs(env.DB, userId);

		if (configCount === 0) {
			await createDefaultConfig(env.DB, generateId(), userId);
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
