// Package "fingerprint" — one tall bar per package, grouped and colored by type
// (cli = green, cask = amber, npm = blue). Bar heights are seeded from a stable
// per-config string so the shape stays the same across renders. Bars rise on
// mount via the global `ob-rise` keyframe defined in PackageFingerprint.svelte.

export interface TypeCounts {
	cli: number;
	cask: number;
	npm: number;
}

export interface FingerprintBar {
	key: string;
	barStyle: string;
}

/** Bucket packages into the three fingerprint groups. Anything that isn't a
 *  cask or npm package (formulae, taps, …) counts as cli/green. */
export function countPackageTypes(packages: unknown[]): TypeCounts {
	let cli = 0;
	let cask = 0;
	let npm = 0;
	for (const p of packages ?? []) {
		const type = typeof p === 'string' ? 'formula' : ((p as { type?: string })?.type ?? 'formula');
		if (type === 'cask') cask++;
		else if (type === 'npm') npm++;
		else cli++;
	}
	return { cli, cask, npm };
}

/** Build the bar list. `seed` (e.g. the config slug) makes heights deterministic. */
export function buildFingerprint(
	counts: TypeCounts,
	seed: string,
	delayStep = 26,
	duration = 0.5
): FingerprintBar[] {
	const groups: [string, number, string][] = [
		['cli', counts.cli, 'var(--accent)'],
		['cask', counts.cask, 'var(--amber)'],
		['npm', counts.npm, '#7aa2e3']
	];
	// tiny LCG seeded from the string so a config always renders the same shape
	let s = 0;
	for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
	const rnd = () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
	const bars: FingerprintBar[] = [];
	let idx = 0;
	for (const [type, n, color] of groups) {
		for (let i = 0; i < n; i++) {
			const height = (34 + rnd() * 64).toFixed(0);
			const opacity = (0.5 + rnd() * 0.45).toFixed(2);
			bars.push({
				key: `${type}-${i}`,
				barStyle: `flex:1; align-self:flex-end; transform-origin:bottom; border-radius:2px 2px 0 0; background:${color}; height:${height}%; opacity:${opacity}; animation:ob-rise ${duration}s cubic-bezier(.2,.8,.2,1) both; animation-delay:${idx * delayStep}ms;`
			});
			idx++;
		}
	}
	return bars;
}
