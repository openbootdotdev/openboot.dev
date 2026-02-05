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

	// SQLite returns date as "YYYY-MM-DD HH:MM:SS" (UTC)
	// We need to convert to ISO format for comparison to avoid string comparison issues
	// where "YYYY-MM-DD HH:MM:SS" < "YYYY-MM-DDTHH:MM:SS.sssZ" due to space < T
	const expiresAt = new Date(row.expires_at.replace(' ', 'T') + 'Z');
	if (expiresAt < new Date()) {
		return json({ status: 'expired' });
	}

	if (row.status === 'pending') {
		return json({ status: 'pending' });
	}

	// Handle both 'approved' and 'used' status - CLI may need to poll multiple times
	if ((row.status === 'approved' || row.status === 'used') && row.token_id && row.user_id) {
		const token = await env.DB.prepare('SELECT * FROM api_tokens WHERE id = ?')
			.bind(row.token_id)
			.first<{ id: string; token: string; expires_at: string }>();

		const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?')
			.bind(row.user_id)
			.first<{ username: string }>();

		// Mark as used after first successful fetch (idempotent)
		if (row.status === 'approved') {
			await env.DB.prepare("UPDATE cli_auth_codes SET status = 'used' WHERE id = ?")
				.bind(code_id)
				.run();
		}

		return json({
			status: 'approved',
			token: token?.token,
			username: user?.username,
			// Ensure strict RFC3339 format for Go client
			expires_at: token?.expires_at ? token.expires_at.replace(' ', 'T') + 'Z' : undefined
		});
	}

	return json({ status: 'expired' });
};
