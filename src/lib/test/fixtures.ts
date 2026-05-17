/**
 * Test fixtures — mock row data for seeding the test D1.
 *
 * NOTE: some fields here (e.g. `mockUser.provider`, `mockRevision.package_count`)
 * don't exist in the real schema and must be stripped before insertion via the
 * `strip()` helper in `$lib/test/seed`. These are legacy artifacts from the old
 * SQL-parsing mock DB that we keep so call sites read naturally.
 */

export const mockUser = {
	id: 'user_test123',
	username: 'testuser',
	email: 'test@example.com',
	avatar_url: 'https://example.com/avatar.jpg',
	provider: 'github',
	provider_id: 'github123',
	created_at: '2026-01-01T00:00:00Z'
};

export const mockConfig = {
	id: 'cfg_test123',
	user_id: 'user_test123',
	slug: 'my-config',
	name: 'My Test Config',
	description: 'A test configuration',
	base_preset: 'developer',
	packages: JSON.stringify([
		{ name: 'git', type: 'formula', desc: 'Version control' },
		{ name: 'visual-studio-code', type: 'cask', desc: 'Code editor' }
	]),
	custom_script: 'echo "Hello from custom script"',
	dotfiles_repo: 'https://github.com/testuser/dotfiles',
	snapshot: null,
	alias: 'myconfig',
	visibility: 'unlisted' as const,
	install_count: 0,
	created_at: '2026-01-15T00:00:00Z',
	updated_at: '2026-01-15T00:00:00Z'
};

export const mockPublicConfig = {
	...mockConfig,
	id: 'cfg_public123',
	slug: 'public-config',
	name: 'Public Config',
	visibility: 'public' as const,
	alias: 'publiccfg'
};

export const mockPrivateConfig = {
	...mockConfig,
	id: 'cfg_private123',
	slug: 'private-config',
	name: 'Private Config',
	visibility: 'private' as const,
	alias: 'privatecfg'
};

export const mockApiToken = {
	id: 'tok_test123',
	user_id: 'user_test123',
	token: 'obt_1234567890abcdefghijklmnopqrstuvwxyz',
	name: 'Test Token',
	expires_at: '2027-01-01T00:00:00Z',
	created_at: '2026-01-01T00:00:00Z'
};

export const mockExpiredApiToken = {
	...mockApiToken,
	id: 'tok_expired',
	token: 'obt_expired1234567890abcdefghijklmnopqr',
	expires_at: '2025-01-01T00:00:00Z'
};

export const mockRevision = {
	id: 'rev_abc1234567890123',
	config_id: 'cfg_test123',
	packages: JSON.stringify([
		{ name: 'git', type: 'formula' },
		{ name: 'docker', type: 'cask' }
	]),
	package_count: 2,
	message: 'before adding rust',
	created_at: '2026-01-10 10:00:00'
};

export const mockRevisionOlder = {
	id: 'rev_def4567890123456',
	config_id: 'cfg_test123',
	packages: JSON.stringify([{ name: 'git', type: 'formula' }]),
	package_count: 1,
	message: null,
	created_at: '2026-01-05 09:00:00'
};
