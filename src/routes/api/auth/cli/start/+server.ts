import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';

const DEVICE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateDeviceCode(): string {
	const arr = new Uint32Array(8);
	crypto.getRandomValues(arr);
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += DEVICE_CODE_CHARS[arr[i] % DEVICE_CODE_CHARS.length];
	}
	return code;
}

export const POST: RequestHandler = async ({ platform, request }) => {
	const env = platform?.env;
	if (!env) return json({ error: 'Platform env not available' }, { status: 500 });

	const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
	const rl = checkRateLimit(getRateLimitKey('cli-start', clientIp), RATE_LIMITS.CLI_START);
	if (!rl.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfter! / 1000)) } });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	let code = body?.code;

	if (!code || typeof code !== 'string') {
		code = generateDeviceCode();
	} else {
		if (!/^[A-Z0-9]{6,12}$/i.test(code)) {
			return json({ error: 'Invalid code format' }, { status: 400 });
		}
		code = code.toUpperCase();
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
		console.error('POST /api/auth/cli/start error:', e);
		return json({ error: 'Failed to start authentication' }, { status: 500 });
	}

	return json({ code_id, code });
};
