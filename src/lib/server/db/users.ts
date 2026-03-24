import type { D1Database } from '@cloudflare/workers-types';
import type { UserRow } from './types';

export async function getUserById(
	db: D1Database,
	id: string
): Promise<Pick<UserRow, 'username'> | null> {
	return db
		.prepare('SELECT username FROM users WHERE id = ?')
		.bind(id)
		.first<Pick<UserRow, 'username'>>();
}

export async function getUserByUsername(
	db: D1Database,
	username: string
): Promise<Pick<UserRow, 'id'> | null> {
	return db
		.prepare('SELECT id FROM users WHERE username = ?')
		.bind(username)
		.first<Pick<UserRow, 'id'>>();
}

export async function getUserIdAndName(
	db: D1Database,
	username: string
): Promise<Pick<UserRow, 'id' | 'username'> | null> {
	return db
		.prepare('SELECT id, username FROM users WHERE username = ?')
		.bind(username)
		.first<Pick<UserRow, 'id' | 'username'>>();
}

export async function getUserWithAvatar(
	db: D1Database,
	username: string
): Promise<Pick<UserRow, 'id' | 'username' | 'avatar_url'> | null> {
	return db
		.prepare('SELECT id, username, avatar_url FROM users WHERE username = ?')
		.bind(username)
		.first<Pick<UserRow, 'id' | 'username' | 'avatar_url'>>();
}

export async function getUserProfile(
	db: D1Database,
	username: string
): Promise<Pick<UserRow, 'id' | 'username' | 'avatar_url' | 'created_at'> | null> {
	return db
		.prepare('SELECT id, username, avatar_url, created_at FROM users WHERE username = ?')
		.bind(username)
		.first<Pick<UserRow, 'id' | 'username' | 'avatar_url' | 'created_at'>>();
}

export async function upsertUser(
	db: D1Database,
	id: string,
	username: string,
	email: string,
	avatarUrl: string
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO users (id, username, email, avatar_url, updated_at)
			VALUES (?, ?, ?, ?, datetime('now'))
			ON CONFLICT(id) DO UPDATE SET
				email = excluded.email,
				avatar_url = excluded.avatar_url,
				updated_at = datetime('now')`
		)
		.bind(id, username, email, avatarUrl)
		.run();
}
