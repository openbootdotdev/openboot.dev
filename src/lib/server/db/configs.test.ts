/**
 * Tests for revision-related db functions in configs.ts.
 * Runs inside the Workers runtime with a real local D1 (via vitest-pool-workers).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { saveRevision, listRevisions, getRevision, restoreConfigToRevision } from './configs';
import { resetDb, seed } from '$lib/test/seed';
import { mockConfig, mockRevision, mockRevisionOlder } from '$lib/test/fixtures';

const db = env.DB;

// Strip mock-only fields (e.g. package_count) from revision fixtures —
// the real schema doesn't have them; json_array_length() computes them.
function asRevisionRow(r: typeof mockRevision | typeof mockRevisionOlder) {
	const { package_count: _omit, ...rest } = r;
	return rest;
}

const userRow = { id: mockConfig.user_id, username: 'testuser', email: 't@test.com' };

beforeEach(async () => {
	await resetDb(db);
});

describe('saveRevision', () => {
	it('inserts a new revision into config_revisions', async () => {
		await seed(db, { users: [userRow], configs: [mockConfig] });
		const packages = JSON.stringify([{ name: 'git', type: 'formula' }]);

		await saveRevision(db, mockConfig.id, packages, null);

		const { results } = await db
			.prepare('SELECT * FROM config_revisions WHERE config_id = ?')
			.bind(mockConfig.id)
			.all<{ id: string; config_id: string; packages: string; message: string | null }>();
		expect(results).toHaveLength(1);
		expect(results[0].config_id).toBe(mockConfig.id);
		expect(results[0].packages).toBe(packages);
		expect(results[0].message).toBeNull();
		expect(results[0].id).toMatch(/^rev_/);
	});

	it('stores message when provided', async () => {
		await seed(db, { users: [userRow], configs: [mockConfig] });

		await saveRevision(db, mockConfig.id, JSON.stringify([{ name: 'git', type: 'formula' }]), 'before adding rust');

		const row = await db
			.prepare('SELECT message FROM config_revisions WHERE config_id = ?')
			.bind(mockConfig.id)
			.first<{ message: string }>();
		expect(row?.message).toBe('before adding rust');
	});

	it('generates a unique id for each revision', async () => {
		await seed(db, { users: [userRow], configs: [mockConfig] });
		const pkgs = JSON.stringify([]);

		await saveRevision(db, mockConfig.id, pkgs, null);
		await saveRevision(db, mockConfig.id, pkgs, null);

		const { results } = await db
			.prepare('SELECT id FROM config_revisions WHERE config_id = ?')
			.bind(mockConfig.id)
			.all<{ id: string }>();
		expect(new Set(results.map((r: { id: string }) => r.id)).size).toBe(2);
	});

	it('keeps at most 10 revisions per config (prunes oldest)', async () => {
		const existing = Array.from({ length: 10 }, (_, i) => ({
			id: `rev_existing${String(i).padStart(2, '0')}`,
			config_id: mockConfig.id,
			packages: JSON.stringify([]),
			message: null,
			created_at: `2026-01-${String(i + 1).padStart(2, '0')} 00:00:00`
		}));
		await seed(db, { users: [userRow], configs: [mockConfig], config_revisions: existing });

		await saveRevision(db, mockConfig.id, JSON.stringify([{ name: 'new', type: 'formula' }]), 'eleventh');

		const { results } = await db
			.prepare('SELECT id FROM config_revisions WHERE config_id = ?')
			.bind(mockConfig.id)
			.all();
		expect(results.length).toBeLessThanOrEqual(10);
	});

	it('does not prune revisions belonging to other configs', async () => {
		const otherConfig = { ...mockConfig, id: 'cfg_other', slug: 'cfg-other', alias: null };
		const existing = Array.from({ length: 10 }, (_, i) => ({
			id: `rev_mine${String(i).padStart(2, '0')}`,
			config_id: mockConfig.id,
			packages: JSON.stringify([]),
			message: null,
			created_at: `2026-01-${String(i + 1).padStart(2, '0')} 00:00:00`
		}));
		const other = {
			id: 'rev_other01',
			config_id: otherConfig.id,
			packages: JSON.stringify([]),
			message: null,
			created_at: '2026-01-01 00:00:00'
		};
		await seed(db, {
			users: [userRow],
			configs: [mockConfig, otherConfig],
			config_revisions: [...existing, other]
		});

		await saveRevision(db, mockConfig.id, JSON.stringify([]), 'overflow');

		const survivor = await db.prepare('SELECT id FROM config_revisions WHERE id = ?').bind('rev_other01').first();
		expect(survivor).not.toBeNull();
	});
});

describe('listRevisions', () => {
	it('returns revisions for the given config', async () => {
		await seed(db, {
			users: [userRow],
			configs: [mockConfig],
			config_revisions: [asRevisionRow(mockRevision), asRevisionRow(mockRevisionOlder)]
		});

		const result = await listRevisions(db, mockConfig.id);

		expect(result.length).toBe(2);
	});

	it('returns an empty array when there are no revisions', async () => {
		await seed(db, { users: [userRow], configs: [mockConfig] });

		const result = await listRevisions(db, mockConfig.id);

		expect(result).toEqual([]);
	});

	it('does not return revisions from other configs', async () => {
		const otherConfig = { ...mockConfig, id: 'cfg_other', slug: 'cfg-other', alias: null };
		const otherRevision = { ...asRevisionRow(mockRevision), id: 'rev_other', config_id: 'cfg_other' };
		await seed(db, {
			users: [userRow],
			configs: [mockConfig, otherConfig],
			config_revisions: [asRevisionRow(mockRevision), otherRevision]
		});

		const result = await listRevisions(db, mockConfig.id);

		expect(result.every((r) => r.id !== 'rev_other')).toBe(true);
	});

	it('includes id, message, and created_at fields', async () => {
		await seed(db, {
			users: [userRow],
			configs: [mockConfig],
			config_revisions: [asRevisionRow(mockRevision)]
		});

		const result = await listRevisions(db, mockConfig.id);
		const rev = result[0];

		expect(rev.id).toBe(mockRevision.id);
		expect(rev.message).toBe(mockRevision.message);
		expect(rev.created_at).toBe(mockRevision.created_at);
	});
});

describe('getRevision', () => {
	it('returns the revision when it exists and belongs to the config', async () => {
		await seed(db, {
			users: [userRow],
			configs: [mockConfig],
			config_revisions: [asRevisionRow(mockRevision)]
		});

		const result = await getRevision(db, mockRevision.id, mockConfig.id);

		expect(result).not.toBeNull();
		expect(result!.id).toBe(mockRevision.id);
	});

	it('returns null when the revision id does not exist', async () => {
		await seed(db, { users: [userRow], configs: [mockConfig] });

		const result = await getRevision(db, 'rev_nonexistent', mockConfig.id);

		expect(result).toBeNull();
	});

	it('returns null when revision belongs to a different config', async () => {
		const otherConfig = { ...mockConfig, id: 'cfg_other', slug: 'cfg-other', alias: null };
		const wrongConfigRevision = { ...asRevisionRow(mockRevision), config_id: 'cfg_other' };
		await seed(db, {
			users: [userRow],
			configs: [mockConfig, otherConfig],
			config_revisions: [wrongConfigRevision]
		});

		const result = await getRevision(db, mockRevision.id, mockConfig.id);

		expect(result).toBeNull();
	});
});

describe('restoreConfigToRevision', () => {
	it('updates the config packages to the revision packages', async () => {
		await seed(db, {
			users: [userRow],
			configs: [mockConfig],
			config_revisions: [asRevisionRow(mockRevision)]
		});

		await restoreConfigToRevision(db, mockConfig.id, mockRevision.id);

		const updated = await db
			.prepare('SELECT packages FROM configs WHERE id = ?')
			.bind(mockConfig.id)
			.first<{ packages: string }>();
		expect(updated?.packages).toBe(mockRevision.packages);
	});

	it('saves the current packages as a "before restore" revision before overwriting', async () => {
		await seed(db, {
			users: [userRow],
			configs: [mockConfig],
			config_revisions: [asRevisionRow(mockRevision)]
		});

		const packagesBefore = mockConfig.packages;
		await restoreConfigToRevision(db, mockConfig.id, mockRevision.id);

		const beforeRev = await db
			.prepare(`SELECT packages, message FROM config_revisions WHERE config_id = ? AND message LIKE 'before restore%'`)
			.bind(mockConfig.id)
			.first<{ packages: string; message: string }>();
		expect(beforeRev).not.toBeNull();
		expect(beforeRev!.packages).toBe(packagesBefore);
	});

	it('returns null when the revision does not exist', async () => {
		await seed(db, { users: [userRow], configs: [mockConfig] });

		const result = await restoreConfigToRevision(db, mockConfig.id, 'rev_nonexistent');

		expect(result).toBeNull();
	});
});
