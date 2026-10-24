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
export function normalizePackages(packages: readonly PackageInput[], snapshot?: SnapshotPackages): ConfigPackage[] {
	const casks = new Set(
		Array.isArray(snapshot?.casks) ? snapshot.casks.filter((name) => typeof name === 'string') : []
	);
	const inputs: PackageInput[] = [...packages];
	// Only legacy string lists need snapshot sources. Typed lists are authoritative,
	// so removing a source in the editor cannot resurrect it from an old snapshot.
	if (packages.some((pkg) => typeof pkg === 'string') && Array.isArray(snapshot?.taps)) {
		for (const name of snapshot.taps) {
			if (typeof name === 'string') inputs.push({ name, type: 'tap' });
		}
	}
	const legacyFormulaNames = new Set(
		inputs.flatMap((pkg) =>
			typeof pkg !== 'string' && pkg.type === 'tap' && getHomebrewTap(pkg.name) ? [pkg.name.split('/')[2]] : []
		)
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
		if (type === 'formula' && legacyFormulaNames.has(pkg.name)) continue;
		const key = `${type}:${pkg.name}`;
		const previous = normalized.get(key);
		normalized.set(key, {
			name: pkg.name,
			type,
			...(previous?.desc || pkg.desc ? { desc: pkg.desc || previous?.desc } : {})
		});
	}
	return [...normalized.values()];
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
