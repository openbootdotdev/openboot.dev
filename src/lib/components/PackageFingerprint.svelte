<script lang="ts">
	import { buildFingerprint, type TypeCounts } from '$lib/fingerprint';

	let {
		counts,
		seed,
		delayStep = 26,
		duration = 0.5
	}: { counts: TypeCounts; seed: string; delayStep?: number; duration?: number } = $props();

	const bars = $derived(buildFingerprint(counts, seed, delayStep, duration));
</script>

{#each bars as b (b.key)}<span style={b.barStyle}></span>{/each}

<style>
	/* Global so the inline `animation:ob-rise` on each bar resolves to it. */
	@keyframes -global-ob-rise {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}
</style>
