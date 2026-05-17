import type { D1Database } from '@cloudflare/workers-types';

// Strip keys that don't match the real schema (test fixtures sometimes carry
// extra fields the old SQL-parsing mock tolerated).
export function strip<T extends object>(obj: T, ...keys: (keyof T)[]): T {
	const out = { ...obj } as T;
	for (const k of keys) delete out[k];
	return out;
}

const TABLES_IN_DELETE_ORDER = ['config_revisions', 'api_tokens', 'cli_auth_codes', 'configs', 'users'] as const;

export async function resetDb(db: D1Database): Promise<void> {
	for (const t of TABLES_IN_DELETE_ORDER) {
		await db.prepare(`DELETE FROM ${t}`).run();
	}
}

export type SeedRows = {
	users?: Record<string, unknown>[];
	configs?: Record<string, unknown>[];
	config_revisions?: Record<string, unknown>[];
	api_tokens?: Record<string, unknown>[];
	cli_auth_codes?: Record<string, unknown>[];
};

export async function seed(db: D1Database, rows: SeedRows): Promise<void> {
	for (const table of ['users', 'configs', 'config_revisions', 'api_tokens', 'cli_auth_codes'] as const) {
		const data = rows[table];
		if (!data?.length) continue;
		for (const row of data) {
			const cols = Object.keys(row);
			const placeholders = cols.map(() => '?').join(', ');
			const values = cols.map((c) => row[c]);
			await db
				.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`)
				.bind(...values)
				.run();
		}
	}
}
