import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ platform, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { code } = body;
	if (!code || typeof code !== 'string') {
		return json({ error: 'Code is required' }, { status: 400 });
	}

	const code_id = generateId();

	try {
		await env.DB.prepare(
			`INSERT INTO cli_auth_codes (id, code, status, expires_at)
			VALUES (?, ?, 'pending', datetime('now', '+10 minutes'))`
		)
			.bind(code_id, code)
			.run();
	} catch (e) {
		return json({ error: 'Database error: ' + (e as Error).message }, { status: 500 });
	}

	return json({ code_id });
};
