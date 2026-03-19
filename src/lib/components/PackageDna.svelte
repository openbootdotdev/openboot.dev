<script lang="ts">
	interface Package {
		name: string;
		type: string;
	}

	let { packages = [] }: { packages: Package[] } = $props();

	const cols = 10;
	const rows = 4;
	const size = 7;
	const gap = 3;
	const totalCells = cols * rows;
	const w = cols * (size + gap) - gap;
	const h = rows * (size + gap) - gap;

	function getColor(type: string): string {
		if (type === 'cask') return '#3b82f6';
		if (type === 'npm') return '#f97316';
		return '#22c55e';
	}

	// Group by type for visual clustering
	const sorted = $derived([
		...packages.filter(p => p.type === 'cask'),
		...packages.filter(p => p.type !== 'cask' && p.type !== 'npm'),
		...packages.filter(p => p.type === 'npm'),
	]);
</script>

<svg class="dna" viewBox="0 0 {w} {h}" width={w} height={h} aria-label="Package DNA visualization">
	{#each Array(totalCells) as _, i}
		{@const x = (i % cols) * (size + gap)}
		{@const y = Math.floor(i / cols) * (size + gap)}
		{@const pkg = sorted[i]}
		<rect
			{x} {y}
			width={size} height={size}
			rx="1.5"
			fill={pkg ? getColor(pkg.type) : 'currentColor'}
			opacity={pkg ? 0.9 : 0.07}
		>
			{#if pkg}
				<title>{pkg.name} ({pkg.type})</title>
			{/if}
		</rect>
	{/each}
</svg>

<style>
	.dna {
		display: block;
		color: var(--text-muted);
	}
</style>
