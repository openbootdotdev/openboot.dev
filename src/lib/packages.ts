export type PackageType = 'formula' | 'cask' | 'npm' | 'tap';

export interface ConfigPackage {
	name: string;
	type: PackageType;
	desc?: string;
}

export type PackageInput = string | { name: string; type?: string; desc?: string };

export interface SnapshotPackages {
	casks?: string[];
	taps?: string[];
}

export interface TapSource {
	name: string;
	explicit: boolean;
	requiredBy: string[];
}

export function isTapName(name: string): boolean {
	return /^[a-z0-9_-]+\/[a-z0-9_.-]+$/i.test(name);
}

export function getHomebrewTap(name: string): string | null {
	const parts = name.split('/');
	return parts.length === 3 && isTapName(parts.slice(0, 2).join('/')) && parts[2] ? parts.slice(0, 2).join('/') : null;
}

/** Repair legacy tap packages without changing explicit formula/cask choices. */
export function normalizePackages(
	packages: readonly PackageInput[],
	snapshot?: SnapshotPackages,
	includeSnapshotTaps = true
): ConfigPackage[] {
	const casks = new Set(
		Array.isArray(snapshot?.casks) ? snapshot.casks.filter((name) => typeof name === 'string') : []
	);
	const inputs: PackageInput[] = [...packages];
	// Older editors saved typed software without copying snapshot-only sources.
	// Reads must retain those sources; writes synchronize the snapshot instead.
	if (includeSnapshotTaps && Array.isArray(snapshot?.taps)) {
		for (const name of snapshot.taps) {
			if (typeof name === 'string') inputs.push({ name, type: 'tap' });
		}
	}
	const legacyPackageKeys = new Set(
		inputs.flatMap((pkg) => {
			if (typeof pkg === 'string' || pkg.type !== 'tap' || !getHomebrewTap(pkg.name)) return [];
			const shortName = pkg.name.split('/')[2];
			const type = casks.has(pkg.name) || casks.has(shortName) ? 'cask' : 'formula';
			return [`${type}:${shortName}`];
		})
	);
	const normalized = new Map<string, ConfigPackage>();
	for (const input of inputs) {
		const pkg = typeof input === 'string' ? { name: input } : input;
		let type: PackageType;
		if (pkg.type === 'npm' || pkg.type === 'cask' || pkg.type === 'formula') {
			type = pkg.type;
		} else if (isTapName(pkg.name)) {
			type = 'tap';
		} else {
			type = casks.has(pkg.name) || casks.has(pkg.name.split('/').pop() || '') ? 'cask' : 'formula';
		}
		const key = `${type}:${pkg.name}`;
		if (legacyPackageKeys.has(key)) continue;
		const previous = normalized.get(key);
		normalized.set(key, {
			name: pkg.name,
			type,
			...(previous?.desc || pkg.desc ? { desc: pkg.desc || previous?.desc } : {})
		});
	}
	return [...normalized.values()];
}

/** Keep snapshot sources aligned with an explicit package selection on save. */
export function syncSnapshotTaps(
	snapshot: unknown,
	packages: readonly ConfigPackage[]
): Record<string, unknown> | null {
	if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
	const hints = 'packages' in snapshot ? snapshot.packages : null;
	const snapshotPackages = hints && typeof hints === 'object' && !Array.isArray(hints) ? hints : {};
	return {
		...snapshot,
		packages: {
			...snapshotPackages,
			taps: packages.filter((pkg) => pkg.type === 'tap').map((pkg) => pkg.name)
		}
	};
}

/** Combine manually retained sources with dependencies of selected Homebrew packages. */
export function resolvePackages(packages: readonly ConfigPackage[]) {
	const formulae = packages.filter((pkg) => pkg.type === 'formula');
	const casks = packages.filter((pkg) => pkg.type === 'cask');
	const npm = packages.filter((pkg) => pkg.type === 'npm');
	const sources = new Map<string, TapSource>();
	for (const pkg of packages) {
		const name =
			pkg.type === 'tap' ? pkg.name : pkg.type === 'formula' || pkg.type === 'cask' ? getHomebrewTap(pkg.name) : null;
		if (!name) continue;
		const source = sources.get(name) || { name, explicit: false, requiredBy: [] };
		if (pkg.type === 'tap') source.explicit = true;
		else if (!source.requiredBy.includes(pkg.name)) source.requiredBy.push(pkg.name);
		sources.set(name, source);
	}
	return { formulae, casks, npm, taps: [...sources.values()] };
}
