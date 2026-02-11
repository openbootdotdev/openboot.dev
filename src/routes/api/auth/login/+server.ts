import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateReturnTo } from '$lib/server/validation';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const env = platform?.env;
	if (!env) throw new Error('Platform env not available');

	const provider = url.searchParams.get('provider') || 'github';
	const returnToParam = url.searchParams.get('return_to');
	const returnTo = returnToParam && validateReturnTo(returnToParam) ? returnToParam : '/dashboard';
	const state = crypto.randomUUID();

	const cookieOptions = {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax' as const,
		maxAge: 600
	};

	cookies.set('auth_return_to', returnTo, cookieOptions);
	cookies.set('auth_state', state, cookieOptions);

	if (provider === 'google') {
		const params = new URLSearchParams({
			client_id: env.GOOGLE_CLIENT_ID,
			redirect_uri: `${env.APP_URL}/api/auth/callback/google`,
			response_type: 'code',
			scope: 'openid email profile',
			state,
			access_type: 'online',
			prompt: 'select_account'
		});
		redirect(302, `${GOOGLE_AUTHORIZE_URL}?${params}`);
	}

	const params = new URLSearchParams({
		client_id: env.GITHUB_CLIENT_ID,
		redirect_uri: `${env.APP_URL}/api/auth/callback/github`,
		scope: 'read:user user:email',
		state
	});

	redirect(302, `${GITHUB_AUTHORIZE_URL}?${params}`);
};
