import { describe, expect, it } from 'vitest';
import {
	getHomebrewTap,
	isTapName,
	normalizePackages,
	resolvePackages,
	syncSnapshotTaps,
	type SnapshotPackages
} from './packages';

describe('Homebrew package sources', () => {
	it('distinguishes repository names from qualified software names', () => {
		expect(isTapName('oven-sh/bun')).toBe(true);
		expect(isTapName('oven-sh/bun/bun')).toBe(false);
		expect(isTapName('@larksuite/cli')).toBe(false);
		expect(getHomebrewTap('oven-sh/bun/bun')).toBe('oven-sh/bun');
		expect(getHomebrewTap('@larksuite/cli')).toBeNull();
		expect(getHomebrewTap('git')).toBeNull();
	});

	it('repairs legacy tap packages and removes their duplicate short formulae', () => {
		expect(
			normalizePackages([
				{ name: 'bun', type: 'formula' },
				{ name: 'oven-sh/bun/bun', type: 'tap', desc: 'Runtime' },
				{ name: 'oven-sh/bun', type: 'tap' }
			])
		).toEqual([
			{ name: 'oven-sh/bun/bun', type: 'formula', desc: 'Runtime' },
			{ name: 'oven-sh/bun', type: 'tap' }
		]);
	});

	it('uses snapshot cask hints for legacy names without overriding explicit choices', () => {
		expect(
			normalizePackages(
				[
					'example/apps/editor',
					{ name: 'example/apps/viewer', type: 'tap' },
					{ name: 'example/apps/cli', type: 'formula' }
				],
				{ casks: ['editor', 'viewer', 'cli'] }
			).map((pkg) => pkg.type)
		).toEqual(['cask', 'cask', 'formula']);
	});

	it('deduplicates legacy casks without removing a same-named formula', () => {
		expect(
			normalizePackages(
				[
					{ name: 'editor', type: 'formula' },
					{ name: 'editor', type: 'cask' },
					{ name: 'example/apps/editor', type: 'tap' }
				],
				{ casks: ['editor'] }
			)
		).toEqual([
			{ name: 'editor', type: 'formula' },
			{ name: 'example/apps/editor', type: 'cask' }
		]);
	});

	it('ignores malformed historical snapshot hints', () => {
		const snapshot = JSON.parse('{"casks":{},"taps":"invalid"}') as SnapshotPackages;
		expect(normalizePackages(['git'], snapshot)).toEqual([{ name: 'git', type: 'formula' }]);
	});

	it('preserves snapshot-only sources in historical typed lists', () => {
		expect(normalizePackages([{ name: 'custom-tool', type: 'formula' }], { taps: ['example/tools'] })).toEqual([
			{ name: 'custom-tool', type: 'formula' },
			{ name: 'example/tools', type: 'tap' }
		]);
	});

	it('synchronizes sources on save while preserving other snapshot fields', () => {
		const packages = normalizePackages([{ name: 'example/apps/editor', type: 'cask' }]);
		const snapshot = {
			packages: { taps: ['old/tools'], casks: ['editor'] },
			hostname: 'test-machine',
			macos_prefs: []
		};
		const saved = syncSnapshotTaps(snapshot, packages);
		expect(saved).toEqual({ ...snapshot, packages: { taps: [], casks: ['editor'] } });
		expect(resolvePackages(normalizePackages(packages, saved?.packages as SnapshotPackages)).taps).toEqual([
			{ name: 'example/apps', explicit: false, requiredBy: ['example/apps/editor'] }
		]);
		expect(snapshot.packages.taps).toEqual(['old/tools']);
	});

	it('recovers snapshot-only taps for legacy string lists', () => {
		expect(normalizePackages(['git'], { taps: ['example/tools'] })).toEqual([
			{ name: 'git', type: 'formula' },
			{ name: 'example/tools', type: 'tap' }
		]);
	});

	it.each([[], [{ name: 'git', type: 'formula' }]].map((packages) => ({ packages })))(
		'does not restore removed sources from a snapshot: $packages',
		({ packages }) => {
			expect(resolvePackages(normalizePackages(packages, { taps: ['old/tools'] }, false)).taps).toEqual([]);
		}
	);

	it('deduplicates sources shared by formulae, casks and explicit entries', () => {
		const groups = resolvePackages(
			normalizePackages([
				{ name: 'example/tools/cli', type: 'formula' },
				{ name: 'example/tools/app', type: 'cask' },
				{ name: 'example/tools', type: 'tap' },
				{ name: '@example/cli', type: 'npm' }
			])
		);
		expect(groups.formulae.map((pkg) => pkg.name)).toEqual(['example/tools/cli']);
		expect(groups.casks.map((pkg) => pkg.name)).toEqual(['example/tools/app']);
		expect(groups.npm.map((pkg) => pkg.name)).toEqual(['@example/cli']);
		expect(groups.taps).toEqual([
			{
				name: 'example/tools',
				explicit: true,
				requiredBy: ['example/tools/cli', 'example/tools/app']
			}
		]);
	});

	it('drops inferred sources with the last dependent package but retains manual sources', () => {
		const software = normalizePackages([{ name: 'example/tools/cli', type: 'formula' }]);
		expect(resolvePackages(software).taps[0].explicit).toBe(false);
		expect(resolvePackages(software.filter((pkg) => pkg.name !== 'example/tools/cli')).taps).toEqual([]);
		expect(resolvePackages(normalizePackages([{ name: 'example/tools', type: 'tap' }])).taps).toEqual([
			{ name: 'example/tools', explicit: true, requiredBy: [] }
		]);
	});
});
