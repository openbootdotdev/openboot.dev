/**
 * Unit tests for revision-related db functions in configs.ts.
 *
 * Uses an in-memory mock DB. The mock's DELETE handler has been extended in
 * db-mock.ts to support the NOT IN subquery used by the pruning step inside
 * saveRevision — see executeQuery's "NOT IN subquery" branch.
 */

import { describe, it, expect } from 'vitest';
import { saveRevision, listRevisions, getRevision, restoreConfigToRevision } from './configs';
import { createMockDB } from '$lib/test/db-mock';
import { mockConfig, mockRevision, mockRevisionOlder } from '$lib/test/fixtures';

// ── saveRevision ─────────────────────────────────────────────────────────────

describe('saveRevision', () => {
	it('inserts a new revision into config_revisions', async () => {
		const db = createMockDB({ configs: [mockConfig] });
		const packages = JSON.stringify([{ name: 'git', type: 'formula' }]);

		await saveRevision(db, mockConfig.id, packages, null);

		const revisions = db.data.config_revisions;
		expect(revisions).toHaveLength(1);
		expect(revisions[0].config_id).toBe(mockConfig.id);
		expect(revisions[0].packages).toBe(packages);
		expect(revisions[0].message).toBeNull();
		expect(revisions[0].id).toMatch(/^rev_/);
	});

	it('stores message when provided', async () => {
		const db = createMockDB({ configs: [mockConfig] });

		await saveRevision(
			db,
			mockConfig.id,
			JSON.stringify([{ name: 'git', type: 'formula' }]),
			'before adding rust'
		);

		expect(db.data.config_revisions[0].message).toBe('before adding rust');
	});

	it('generates a unique id for each revision', async () => {
		const db = createMockDB({ configs: [mockConfig] });
		const pkgs = JSON.stringify([]);

		await saveRevision(db, mockConfig.id, pkgs, null);
		await saveRevision(db, mockConfig.id, pkgs, null);

		const ids = db.data.config_revisions.map((r: any) => r.id);
		expect(new Set(ids).size).toBe(2);
	});

	it('keeps at most 10 revisions per config (prunes oldest)', async () => {
		// Seed 10 existing revisions with distinct created_at timestamps
		const existing = Array.from({ length: 10 }, (_, i) => ({
			id: `rev_existing${String(i).padStart(2, '0')}`,
			config_id: mockConfig.id,
			packages: JSON.stringify([]),
			message: null,
			created_at: `2026-01-${String(i + 1).padStart(2, '0')} 00:00:00`
		}));

		const db = createMockDB({ configs: [mockConfig], config_revisions: existing });

		// The 11th save should trigger pruning
		await saveRevision(db, mockConfig.id, JSON.stringify([{ name: 'new', type: 'formula' }]), 'eleventh');

		expect(db.data.config_revisions.length).toBeLessThanOrEqual(10);
	});

	it('does not prune revisions belonging to other configs', async () => {
		const otherConfig = { ...mockConfig, id: 'cfg_other' };

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

		const db = createMockDB({
			configs: [mockConfig, otherConfig],
			config_revisions: [...existing, other]
		});

		await saveRevision(db, mockConfig.id, JSON.stringify([]), 'overflow');

		// The other config's revision must survive
		const otherStillPresent = db.data.config_revisions.some(
			(r: any) => r.id === 'rev_other01'
		);
		expect(otherStillPresent).toBe(true);
	});
});

// ── listRevisions ─────────────────────────────────────────────────────────────

describe('listRevisions', () => {
	it('returns revisions for the given config', async () => {
		const db = createMockDB({
			configs: [mockConfig],
			config_revisions: [mockRevision, mockRevisionOlder]
		});

		const result = await listRevisions(db, mockConfig.id);

		expect(result.length).toBe(2);
	});

	it('returns an empty array when there are no revisions', async () => {
		const db = createMockDB({ configs: [mockConfig] });

		const result = await listRevisions(db, mockConfig.id);

		expect(result).toEqual([]);
	});

	it('does not return revisions from other configs', async () => {
		const otherRevision = { ...mockRevision, id: 'rev_other', config_id: 'cfg_other' };
		const db = createMockDB({
			configs: [mockConfig],
			config_revisions: [mockRevision, otherRevision]
		});

		const result = await listRevisions(db, mockConfig.id);

		expect(result.every((r) => r.id !== 'rev_other')).toBe(true);
	});

	it('includes id, message, and created_at fields', async () => {
		const db = createMockDB({
			configs: [mockConfig],
			config_revisions: [mockRevision]
		});

		const result = await listRevisions(db, mockConfig.id);
		const rev = result[0];

		expect(rev.id).toBe(mockRevision.id);
		expect(rev.message).toBe(mockRevision.message);
		expect(rev.created_at).toBe(mockRevision.created_at);
	});
});

// ── getRevision ───────────────────────────────────────────────────────────────

describe('getRevision', () => {
	it('returns the revision when it exists and belongs to the config', async () => {
		const db = createMockDB({
			configs: [mockConfig],
			config_revisions: [mockRevision]
		});

		// getRevision signature: (db, revisionId, configId)
		const result = await getRevision(db, mockRevision.id, mockConfig.id);

		expect(result).not.toBeNull();
		expect(result!.id).toBe(mockRevision.id);
	});

	it('returns null when the revision id does not exist', async () => {
		const db = createMockDB({ configs: [mockConfig] });

		const result = await getRevision(db, 'rev_nonexistent', mockConfig.id);

		expect(result).toBeNull();
	});

	it('returns null when revision belongs to a different config', async () => {
		const wrongConfigRevision = { ...mockRevision, config_id: 'cfg_other' };
		const db = createMockDB({
			config_revisions: [wrongConfigRevision]
		});

		const result = await getRevision(db, mockRevision.id, mockConfig.id);

		expect(result).toBeNull();
	});
});

// ── restoreConfigToRevision ───────────────────────────────────────────────────

describe('restoreConfigToRevision', () => {
	it('updates the config packages to the revision packages', async () => {
		const db = createMockDB({
			configs: [mockConfig],
			config_revisions: [mockRevision]
		});

		await restoreConfigToRevision(db, mockConfig.id, mockRevision.id);

		const updated = db.data.configs.find((c: any) => c.id === mockConfig.id);
		expect(updated.packages).toBe(mockRevision.packages);
	});

	it('saves the current packages as a "before restore" revision before overwriting', async () => {
		const db = createMockDB({
			configs: [mockConfig],
			config_revisions: [mockRevision]
		});

		const packagesBefore = mockConfig.packages;
		await restoreConfigToRevision(db, mockConfig.id, mockRevision.id);

		const beforeRevision = db.data.config_revisions.find((r: any) =>
			r.message?.includes('before restore')
		);
		expect(beforeRevision).toBeDefined();
		expect(beforeRevision.packages).toBe(packagesBefore);
	});

	it('returns null when the revision does not exist', async () => {
		const db = createMockDB({ configs: [mockConfig] });

		const result = await restoreConfigToRevision(db, mockConfig.id, 'rev_nonexistent');

		expect(result).toBeNull();
	});
});
