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
		font-family: var(--font-mono);
		/* edge vignette lives in the background layer so it never washes out content */
		background-color: var(--bg-primary);
		background-image: radial-gradient(125% 85% at 50% -10%, transparent 62%, var(--vignette) 100%);
		background-attachment: fixed;
		color: var(--text-primary);
		line-height: 1.5;
		min-height: 100vh;
		position: relative;
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
		font-feature-settings:
			'calt' 1,
			'ss01' 1;
	}

	/* film grain — the texture that kills the flat digital look */
	:global(body)::after {
		content: '';
		position: fixed;
		inset: 0;
		z-index: 9999;
		pointer-events: none;
		opacity: var(--grain-opacity);
		mix-blend-mode: var(--grain-blend);
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	:global(code) {
		font-family: var(--font-mono);
	}

	:global(::selection) {
		background: var(--accent);
		color: var(--bg-primary);
	}

	@media (prefers-reduced-motion: reduce) {
		:global(*),
		:global(*)::before,
		:global(*)::after {
			animation-duration: 0.001ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.001ms !important;
			scroll-behavior: auto !important;
		}
	}
</style>
