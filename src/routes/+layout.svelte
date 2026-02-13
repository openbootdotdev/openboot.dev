<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { auth } from '$lib/stores/auth';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import '$lib/styles/variables.css';

	let { children } = $props();

	onMount(() => {
		theme.init();
		auth.check();
	});
</script>

<SiteHeader />
{@render children()}

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(html, body) {
		overflow-x: hidden;
	}

	:global(body) {
		font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
		background: var(--bg-primary);
		color: var(--text-primary);
		line-height: 1.6;
		min-height: 100vh;
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	:global(code) {
		font-family: 'JetBrains Mono', monospace;
	}
</style>
