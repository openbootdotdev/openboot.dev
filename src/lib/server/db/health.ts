import type { D1Database } from '@cloudflare/workers-types';

export async function checkDatabaseHealth(db: D1Database): Promise<boolean> {
	try {
		const result = await db.prepare('SELECT 1 as test').first<{ test: number }>();
		return result?.test === 1;
	} catch {
		return false;
	}
}
