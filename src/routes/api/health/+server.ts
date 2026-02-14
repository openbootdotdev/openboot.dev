import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env;
	
	const checks = {
		api: 'ok',
		database: 'unknown',
		timestamp: new Date().toISOString()
	};

	if (env?.DB) {
		try {
			const result = await env.DB.prepare('SELECT 1 as test').first<{ test: number }>();
			checks.database = result?.test === 1 ? 'ok' : 'error';
		} catch (e) {
			checks.database = 'error';
		}
	}

	const allOk = checks.database === 'ok';
	
	return json({
		status: allOk ? 'healthy' : 'degraded',
		checks,
		version: '0.1.0'
	}, {
		status: allOk ? 200 : 503,
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
