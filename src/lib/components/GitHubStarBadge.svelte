<script lang="ts">
	import { onMount } from 'svelte';

	let starCount = $state(0);
	let loading = $state(true);

	onMount(() => {
		fetch('https://api.github.com/repos/openbootdotdev/openboot')
			.then((r) => r.json())
			.then((data) => {
				if (data.stargazers_count) {
					starCount = data.stargazers_count;
				}
				loading = false;
			})
			.catch(() => {
				loading = false;
			});
	});

	function formatStarCount(count: number): string {
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}K`;
		}
		return count.toString();
	}
</script>

<a 
	href="https://github.com/openbootdotdev/openboot" 
	class="github-star-badge" 
	target="_blank" 
	rel="noopener noreferrer"
>
	<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
		<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
	</svg>
	<span>GitHub</span>
	{#if !loading && starCount > 0}
		<span class="star-count">[{formatStarCount(starCount)}]</span>
	{/if}
</a>

<style>
	.github-star-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		text-decoration: none;
		transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.github-star-badge:hover {
		color: var(--text-primary);
	}

	.github-star-badge svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.star-count {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 600;
		color: var(--accent);
	}
</style>
