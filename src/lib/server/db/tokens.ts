import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import type { ApiTokenRow, CliAuthCodeRow } from './types';

// ─── API Tokens ─────────────────────────────────────────────────────────────

export async function getValidToken(
	db: D1Database,
	token: string
): Promise<Pick<ApiTokenRow, 'user_id'> | null> {
	return db
		.prepare("SELECT user_id FROM api_tokens WHERE token = ? AND expires_at > datetime('now')")
		.bind(token)
		.first<Pick<ApiTokenRow, 'user_id'>>();
}

export async function getTokenById(
	db: D1Database,
	id: string
): Promise<Pick<ApiTokenRow, 'id' | 'token' | 'expires_at'> | null> {
	return db
		.prepare('SELECT id, token, expires_at FROM api_tokens WHERE id = ?')
		.bind(id)
		.first<Pick<ApiTokenRow, 'id' | 'token' | 'expires_at'>>();
}

// Returns a prepared statement for use in db.batch()
export function prepareCreateApiToken(
	db: D1Database,
	id: string,
	userId: string,
	token: string
): D1PreparedStatement {
	return db
		.prepare(
			`INSERT INTO api_tokens (id, user_id, token, name, expires_at)
			VALUES (?, ?, ?, 'cli', datetime('now', '+90 days'))`
		)
		.bind(id, userId, token);
}

// ─── CLI Auth Codes ──────────────────────────────────────────────────────────

export async function getCliCode(
	db: D1Database,
	codeId: string
): Promise<CliAuthCodeRow | null> {
	return db
		.prepare('SELECT * FROM cli_auth_codes WHERE id = ?')
		.bind(codeId)
		.first<CliAuthCodeRow>();
}

export async function createCliCode(db: D1Database, id: string, code: string): Promise<void> {
	await db
		.prepare(
			`INSERT INTO cli_auth_codes (id, code, status, expires_at)
			VALUES (?, ?, 'pending', datetime('now', '+10 minutes'))`
		)
		.bind(id, code)
		.run();
}

export function cleanExpiredCodes(db: D1Database): void {
	db.prepare("DELETE FROM cli_auth_codes WHERE expires_at < datetime('now')")
		.run()
		.catch(() => {});
}

export async function claimCliCode(db: D1Database, code: string): Promise<{ changes: number }> {
	const result = await db
		.prepare(
			"UPDATE cli_auth_codes SET status = 'processing' WHERE code = ? AND status = 'pending' AND expires_at > datetime('now')"
		)
		.bind(code)
		.run();
	return { changes: result.meta.changes };
}

export async function getProcessingCliCode(
	db: D1Database,
	code: string
): Promise<Pick<CliAuthCodeRow, 'id'> | null> {
	return db
		.prepare("SELECT id FROM cli_auth_codes WHERE code = ? AND status = 'processing'")
		.bind(code)
		.first<Pick<CliAuthCodeRow, 'id'>>();
}

// Returns prepared statements for db.batch()
export function prepareApproveCliCode(
	db: D1Database,
	userId: string,
	tokenId: string,
	codeId: string
): D1PreparedStatement {
	return db
		.prepare(
			"UPDATE cli_auth_codes SET user_id = ?, token_id = ?, status = 'approved' WHERE id = ?"
		)
		.bind(userId, tokenId, codeId);
}

export async function markCliCodeUsed(
	db: D1Database,
	codeId: string
): Promise<{ changes: number }> {
	const result = await db
		.prepare("UPDATE cli_auth_codes SET status = 'used' WHERE id = ? AND status = 'approved'")
		.bind(codeId)
		.run();
	return { changes: result.meta.changes };
}
