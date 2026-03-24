import type { D1Database } from '@cloudflare/workers-types';

export type { D1Database };

export interface UserRow {
	id: string;
	username: string;
	email: string;
	avatar_url: string;
	created_at: string;
	updated_at: string;
}

export interface ConfigRow {
	id: string;
	user_id: string;
	slug: string;
	name: string;
	description: string;
	base_preset: string;
	packages: string; // JSON string stored in DB
	custom_script: string;
	is_public: number;
	created_at: string;
	updated_at: string;
	alias: string | null;
	dotfiles_repo: string;
	snapshot: string | null; // JSON string stored in DB
	snapshot_at: string | null;
	visibility: string;
	forked_from: string | null;
	featured: number;
	install_count: number;
}

export interface ApiTokenRow {
	id: string;
	user_id: string;
	token: string;
	name: string;
	created_at: string;
	expires_at: string;
	last_used_at: string | null;
}

export interface CliAuthCodeRow {
	id: string;
	code: string;
	user_id: string | null;
	token_id: string | null;
	status: string;
	created_at: string;
	expires_at: string;
}
