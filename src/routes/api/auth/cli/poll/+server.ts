import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const code_id = url.searchParams.get('code_id');
	if (!code_id) return json({ error: 'code_id is required' }, { status: 400 });

	const row = await env.DB.prepare('SELECT * FROM cli_auth_codes WHERE id = ?')
		.bind(code_id)
		.first<{ id: string; code: string; user_id: string | null; token_id: string | null; status: string; expires_at: string }>();

	if (!row) return json({ status: 'expired' });

	if (row.expires_at < new Date().toISOString()) {
		return json({ status: 'expired' });
	}

	if (row.status === 'pending') {
		return json({ status: 'pending' });
	}

	if (row.status === 'approved' && row.token_id && row.user_id) {
		const token = await env.DB.prepare('SELECT * FROM api_tokens WHERE id = ?')
			.bind(row.token_id)
			.first<{ id: string; token: string; expires_at: string }>();

		const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?')
			.bind(row.user_id)
			.first<{ username: string }>();

		await env.DB.prepare("UPDATE cli_auth_codes SET status = 'used' WHERE id = ?")
			.bind(code_id)
			.run();

		return json({
			status: 'approved',
			token: token?.token,
			username: user?.username,
			expires_at: token?.expires_at
		});
	}

	return json({ status: 'expired' });
};
