import type { D1Database } from '@cloudflare/workers-types';
import type { ConfigRow } from './types';

// ─── Read ───────────────────────────────────────────────────────────────────

export async function getUserConfigs(db: D1Database, userId: string): Promise<ConfigRow[]> {
	const { results } = await db
		.prepare(
			'SELECT id, slug, name, description, base_preset, visibility, alias, packages, install_count, updated_at, snapshot, snapshot_at FROM configs WHERE user_id = ? ORDER BY updated_at DESC'
		)
		.bind(userId)
		.all<ConfigRow>();
	return results;
}

export async function getConfig(
	db: D1Database,
	userId: string,
	slug: string
): Promise<ConfigRow | null> {
	return db
		.prepare('SELECT * FROM configs WHERE user_id = ? AND slug = ?')
		.bind(userId, slug)
		.first<ConfigRow>();
}

export async function getConfigIdAndAlias(
	db: D1Database,
	userId: string,
	slug: string
): Promise<Pick<ConfigRow, 'id' | 'alias'> | null> {
	return db
		.prepare('SELECT id, alias FROM configs WHERE user_id = ? AND slug = ?')
		.bind(userId, slug)
		.first<Pick<ConfigRow, 'id' | 'alias'>>();
}

export async function getConfigId(
	db: D1Database,
	userId: string,
	slug: string
): Promise<Pick<ConfigRow, 'id'> | null> {
	return db
		.prepare('SELECT id FROM configs WHERE user_id = ? AND slug = ?')
		.bind(userId, slug)
		.first<Pick<ConfigRow, 'id'>>();
}

export async function getConfigById(
	db: D1Database,
	id: string
): Promise<ConfigRow | null> {
	return db
		.prepare(
			'SELECT id, slug, name, description, base_preset, packages, snapshot, snapshot_at, visibility FROM configs WHERE id = ?'
		)
		.bind(id)
		.first<ConfigRow>();
}

export async function getConfigForInstall(
	db: D1Database,
	username: string,
	slug: string
): Promise<Pick<ConfigRow, 'visibility' | 'user_id'> | null> {
	return db
		.prepare(
			'SELECT c.visibility, c.user_id FROM configs c JOIN users u ON c.user_id = u.id WHERE u.username = ? AND c.slug = ?'
		)
		.bind(username, slug)
		.first<Pick<ConfigRow, 'visibility' | 'user_id'>>();
}

export async function getConfigForCLI(
	db: D1Database,
	username: string,
	slug: string
): Promise<
	| (Pick<
			ConfigRow,
			| 'slug'
			| 'name'
			| 'base_preset'
			| 'packages'
			| 'snapshot'
			| 'visibility'
			| 'dotfiles_repo'
			| 'custom_script'
	  > & { username: string })
	| null
> {
	return db
		.prepare(
			`SELECT c.slug, c.name, c.base_preset, c.packages, c.snapshot, c.visibility, c.dotfiles_repo, c.custom_script,
			        u.username
			 FROM configs c
			 JOIN users u ON c.user_id = u.id
			 WHERE u.username = ? AND c.slug = ?`
		)
		.bind(username, slug)
		.first<
			Pick<
				ConfigRow,
				| 'slug'
				| 'name'
				| 'base_preset'
				| 'packages'
				| 'snapshot'
				| 'visibility'
				| 'dotfiles_repo'
				| 'custom_script'
			> & { username: string }
		>();
}

export async function getConfigCLIData(
	db: D1Database,
	userId: string,
	slug: string
): Promise<Pick<
	ConfigRow,
	'slug' | 'name' | 'base_preset' | 'packages' | 'snapshot' | 'visibility' | 'dotfiles_repo' | 'custom_script'
> | null> {
	return db
		.prepare(
			'SELECT slug, name, base_preset, packages, snapshot, visibility, dotfiles_repo, custom_script FROM configs WHERE user_id = ? AND slug = ?'
		)
		.bind(userId, slug)
		.first<
			Pick<
				ConfigRow,
				'slug' | 'name' | 'base_preset' | 'packages' | 'snapshot' | 'visibility' | 'dotfiles_repo' | 'custom_script'
			>
		>();
}

export async function getConfigVisibility(
	db: D1Database,
	userId: string,
	slug: string
): Promise<Pick<ConfigRow, 'visibility'> | null> {
	return db
		.prepare('SELECT visibility FROM configs WHERE user_id = ? AND slug = ?')
		.bind(userId, slug)
		.first<Pick<ConfigRow, 'visibility'>>();
}

export async function getConfigByAlias(
	db: D1Database,
	alias: string
): Promise<
	| (Pick<ConfigRow, 'slug' | 'custom_script' | 'dotfiles_repo' | 'visibility'> & {
			username: string;
	  })
	| null
> {
	return db
		.prepare(
			'SELECT c.slug, c.custom_script, c.dotfiles_repo, c.visibility, u.username FROM configs c JOIN users u ON c.user_id = u.id WHERE c.alias = ?'
		)
		.bind(alias)
		.first<
			Pick<ConfigRow, 'slug' | 'custom_script' | 'dotfiles_repo' | 'visibility'> & {
				username: string;
			}
		>();
}

export async function getConfigByAliasForAPI(
	db: D1Database,
	alias: string
): Promise<
	| (Pick<
			ConfigRow,
			| 'slug'
			| 'name'
			| 'base_preset'
			| 'packages'
			| 'snapshot'
			| 'visibility'
			| 'dotfiles_repo'
			| 'custom_script'
	  > & { username: string })
	| null
> {
	return db
		.prepare(
			`SELECT c.slug, c.name, c.base_preset, c.packages, c.snapshot, c.visibility, c.dotfiles_repo, c.custom_script,
			        u.username
			 FROM configs c
			 JOIN users u ON c.user_id = u.id
			 WHERE c.alias = ?`
		)
		.bind(alias)
		.first<
			Pick<
				ConfigRow,
				| 'slug'
				| 'name'
				| 'base_preset'
				| 'packages'
				| 'snapshot'
				| 'visibility'
				| 'dotfiles_repo'
				| 'custom_script'
			> & { username: string }
		>();
}

export async function getConfigForHookAlias(
	db: D1Database,
	alias: string
): Promise<
	| (Pick<ConfigRow, 'slug' | 'custom_script' | 'dotfiles_repo' | 'visibility' | 'user_id'> & {
			username: string;
	  })
	| null
> {
	return db
		.prepare(
			'SELECT c.slug, c.custom_script, c.dotfiles_repo, c.visibility, c.user_id, u.username FROM configs c JOIN users u ON c.user_id = u.id WHERE c.alias = ?'
		)
		.bind(alias)
		.first<
			Pick<ConfigRow, 'slug' | 'custom_script' | 'dotfiles_repo' | 'visibility' | 'user_id'> & {
				username: string;
			}
		>();
}

export async function getConfigForHookSlug(
	db: D1Database,
	username: string,
	slug: string
): Promise<Pick<ConfigRow, 'visibility' | 'user_id' | 'custom_script' | 'dotfiles_repo'> | null> {
	return db
		.prepare(
			'SELECT c.visibility, c.user_id, c.custom_script, c.dotfiles_repo FROM configs c JOIN users u ON c.user_id = u.id WHERE u.username = ? AND c.slug = ?'
		)
		.bind(username, slug)
		.first<Pick<ConfigRow, 'visibility' | 'user_id' | 'custom_script' | 'dotfiles_repo'>>();
}

export async function getUserPublicConfigs(
	db: D1Database,
	userId: string,
	visibility: string
): Promise<
	Pick<
		ConfigRow,
		| 'id'
		| 'slug'
		| 'name'
		| 'description'
		| 'base_preset'
		| 'packages'
		| 'install_count'
		| 'updated_at'
	>[]
> {
	const { results } = await db
		.prepare(
			'SELECT id, slug, name, description, base_preset, packages, install_count, updated_at FROM configs WHERE user_id = ? AND visibility = ? ORDER BY install_count DESC'
		)
		.bind(userId, visibility)
		.all<
			Pick<
				ConfigRow,
				| 'id'
				| 'slug'
				| 'name'
				| 'description'
				| 'base_preset'
				| 'packages'
				| 'install_count'
				| 'updated_at'
			>
		>();
	return results;
}

export async function countUserConfigs(db: D1Database, userId: string): Promise<number> {
	const result = await db
		.prepare('SELECT COUNT(*) as count FROM configs WHERE user_id = ?')
		.bind(userId)
		.first<{ count: number }>();
	return result?.count ?? 0;
}

export async function aliasExists(
	db: D1Database,
	alias: string
): Promise<Pick<ConfigRow, 'id'> | null> {
	return db
		.prepare('SELECT id FROM configs WHERE alias = ?')
		.bind(alias)
		.first<Pick<ConfigRow, 'id'>>();
}

export async function aliasExistsExcluding(
	db: D1Database,
	alias: string,
	excludeId: string
): Promise<Pick<ConfigRow, 'id'> | null> {
	return db
		.prepare('SELECT id FROM configs WHERE alias = ? AND id != ?')
		.bind(alias, excludeId)
		.first<Pick<ConfigRow, 'id'>>();
}

export async function slugConflict(
	db: D1Database,
	userId: string,
	slug: string,
	excludeId: string
): Promise<Pick<ConfigRow, 'id'> | null> {
	return db
		.prepare('SELECT id FROM configs WHERE user_id = ? AND slug = ? AND id != ?')
		.bind(userId, slug, excludeId)
		.first<Pick<ConfigRow, 'id'>>();
}

export interface PublicConfigsOptions {
	username?: string | null;
	sort: string;
	visibility: string | null;
	limit: number;
	offset: number;
}

export interface PublicConfigRow {
	id: string;
	slug: string;
	name: string;
	description: string;
	base_preset: string;
	packages: string;
	install_count: number;
	updated_at: string;
	created_at: string;
	forked_from: string | null;
	featured: number;
	username: string;
	avatar_url: string;
}

export async function getPublicConfigs(
	db: D1Database,
	options: PublicConfigsOptions
): Promise<{ results: PublicConfigRow[]; total: number }> {
	const { username, sort, visibility, limit, offset } = options;

	let whereClause =
		visibility === 'public' ? `c.visibility = 'public'` : `c.visibility IN ('public', 'unlisted')`;

	if (!username) {
		whereClause += ` AND NOT (u.username = 'openboot' AND c.slug = 'default')`;
	}

	let orderClause: string;
	if (sort === 'featured') {
		orderClause = 'c.featured DESC, c.install_count DESC, c.updated_at DESC';
	} else if (sort === 'installs') {
		orderClause = 'c.install_count DESC, c.updated_at DESC';
	} else if (sort === 'trending') {
		whereClause += ` AND c.updated_at >= datetime('now', '-7 days')`;
		orderClause = 'c.install_count DESC, c.updated_at DESC';
	} else if (sort === 'new') {
		orderClause = 'c.created_at DESC';
	} else {
		orderClause = 'c.updated_at DESC, c.install_count DESC';
	}

	const selectCols = `c.id, c.slug, c.name, c.description, c.base_preset, c.packages, c.install_count,
		c.updated_at, c.created_at, c.forked_from, c.featured,
		u.username, u.avatar_url`;

	const qualityFilter = `(
		c.install_count > 0
		OR (
			c.name != 'Default'
			AND c.description IS NOT NULL
			AND c.description != ''
			AND c.description != 'My default configuration'
			AND json_array_length(c.packages) >= 5
		)
	)`;

	let query: string;
	let bindings: unknown[];
	let countQuery: string;
	let countBindings: unknown[];

	if (username) {
		query = `SELECT ${selectCols} FROM configs c JOIN users u ON c.user_id = u.id WHERE ${whereClause} AND u.username = ? ORDER BY ${orderClause} LIMIT ? OFFSET ?`;
		bindings = [username, limit, offset];
		countQuery = `SELECT COUNT(*) as count FROM configs c JOIN users u ON c.user_id = u.id WHERE ${whereClause} AND u.username = ?`;
		countBindings = [username];
	} else {
		query = `SELECT ${selectCols} FROM configs c JOIN users u ON c.user_id = u.id WHERE ${whereClause} AND ${qualityFilter} ORDER BY ${orderClause} LIMIT ? OFFSET ?`;
		bindings = [limit, offset];
		countQuery = `SELECT COUNT(*) as count FROM configs c JOIN users u ON c.user_id = u.id WHERE ${whereClause} AND ${qualityFilter}`;
		countBindings = [];
	}

	const [{ results }, countResult] = await Promise.all([
		db.prepare(query).bind(...bindings).all<PublicConfigRow>(),
		db.prepare(countQuery).bind(...countBindings).first<{ count: number }>()
	]);

	return { results, total: countResult?.count ?? 0 };
}

export async function getConfigOGData(
	db: D1Database,
	userId: string,
	slug: string
): Promise<Pick<ConfigRow, 'name' | 'description' | 'packages' | 'visibility' | 'base_preset'> | null> {
	return db
		.prepare(
			'SELECT name, description, packages, visibility, base_preset FROM configs WHERE user_id = ? AND slug = ?'
		)
		.bind(userId, slug)
		.first<Pick<ConfigRow, 'name' | 'description' | 'packages' | 'visibility' | 'base_preset'>>();
}

export async function getSitemapConfigs(
	db: D1Database
): Promise<{ slug: string; username: string }[]> {
	const { results } = await db
		.prepare(
			`SELECT c.slug, u.username FROM configs c JOIN users u ON c.user_id = u.id WHERE c.visibility = 'public' AND c.slug != 'default' ORDER BY c.install_count DESC LIMIT 500`
		)
		.all<{ slug: string; username: string }>();
	return results;
}

// ─── Write ──────────────────────────────────────────────────────────────────

export interface CreateConfigParams {
	id: string;
	userId: string;
	slug: string;
	name: string;
	description: string;
	base_preset: string;
	packages: string; // JSON string
	custom_script: string;
	visibility: string;
	alias: string | null;
	dotfiles_repo: string;
	snapshot: string | null;
	snapshot_at: string | null;
	forked_from: string | null;
}

export async function createConfig(db: D1Database, p: CreateConfigParams): Promise<void> {
	await db
		.prepare(
			`INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages, custom_script, visibility, alias, dotfiles_repo, snapshot, snapshot_at, forked_from)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			p.id,
			p.userId,
			p.slug,
			p.name,
			p.description,
			p.base_preset,
			p.packages,
			p.custom_script,
			p.visibility,
			p.alias,
			p.dotfiles_repo,
			p.snapshot,
			p.snapshot_at,
			p.forked_from
		)
		.run();
}

export async function createDefaultConfig(
	db: D1Database,
	id: string,
	userId: string
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages)
			VALUES (?, ?, 'default', 'Default', 'My default configuration', 'developer', '[]')`
		)
		.bind(id, userId)
		.run();
}

export interface UpdateConfigParams {
	newSlug: string;
	name: string | null;
	description: string | null;
	base_preset: string | null;
	packages: string | null;
	custom_script: string | null;
	visibility: string | null;
	alias: string | null;
	dotfiles_repo: string | null;
	snapshot: string | null;
	snapshot_at: string | null;
	userId: string;
	slug: string;
}

export async function updateConfig(db: D1Database, p: UpdateConfigParams): Promise<void> {
	await db
		.prepare(
			`UPDATE configs SET
				slug = ?,
				name = COALESCE(?, name),
				description = COALESCE(?, description),
				base_preset = COALESCE(?, base_preset),
				packages = COALESCE(?, packages),
				custom_script = COALESCE(?, custom_script),
				visibility = COALESCE(?, visibility),
				alias = ?,
				dotfiles_repo = COALESCE(?, dotfiles_repo),
				snapshot = ?,
				snapshot_at = ?,
				updated_at = datetime('now')
			WHERE user_id = ? AND slug = ?`
		)
		.bind(
			p.newSlug,
			p.name,
			p.description,
			p.base_preset,
			p.packages,
			p.custom_script,
			p.visibility,
			p.alias,
			p.dotfiles_repo,
			p.snapshot,
			p.snapshot_at,
			p.userId,
			p.slug
		)
		.run();
}

export async function deleteConfig(
	db: D1Database,
	userId: string,
	slug: string
): Promise<void> {
	await db
		.prepare('DELETE FROM configs WHERE user_id = ? AND slug = ?')
		.bind(userId, slug)
		.run();
}

export function incrementInstallByAlias(db: D1Database, alias: string): void {
	db.prepare('UPDATE configs SET install_count = install_count + 1 WHERE alias = ?')
		.bind(alias)
		.run()
		.catch((e: unknown) => console.error('install count update failed:', e));
}

export function incrementInstallBySlug(db: D1Database, userId: string, slug: string): void {
	db.prepare(
		'UPDATE configs SET install_count = install_count + 1 WHERE user_id = ? AND slug = ?'
	)
		.bind(userId, slug)
		.run()
		.catch((e: unknown) => console.error('install count update failed:', e));
}

export async function updateConfigFromSnapshot(
	db: D1Database,
	userId: string,
	slug: string,
	snapshot: string,
	packages: string,
	visibility: string
): Promise<void> {
	await db
		.prepare(
			`UPDATE configs SET snapshot = ?, snapshot_at = datetime('now'), packages = ?, visibility = ?, updated_at = datetime('now') WHERE user_id = ? AND slug = ?`
		)
		.bind(snapshot, packages, visibility, userId, slug)
		.run();
}

export interface CreateConfigFromSnapshotParams {
	id: string;
	userId: string;
	slug: string;
	name: string;
	description: string;
	base_preset: string;
	packages: string;
	snapshot: string;
	visibility: string;
}

export async function createConfigFromSnapshot(
	db: D1Database,
	p: CreateConfigFromSnapshotParams
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO configs (id, user_id, slug, name, description, base_preset, packages, snapshot, snapshot_at, visibility)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`
		)
		.bind(
			p.id,
			p.userId,
			p.slug,
			p.name,
			p.description,
			p.base_preset,
			p.packages,
			p.snapshot,
			p.visibility
		)
		.run();
}
