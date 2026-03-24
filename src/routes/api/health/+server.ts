import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkDatabaseHealth } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env;

	const checks = {
		api: 'ok',
		database: 'unknown',
		timestamp: new Date().toISOString()
	};

	if (env?.DB) {
		const dbOk = await checkDatabaseHealth(env.DB);
		checks.database = dbOk ? 'ok' : 'error';
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
