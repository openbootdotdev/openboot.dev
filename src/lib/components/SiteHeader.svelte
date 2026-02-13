<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import GitHubStarBadge from '$lib/components/GitHubStarBadge.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();

	const currentPath = $derived($page.url.pathname);
</script>

<header class="site-header">
	<div class="header-container">
		<a href="/" class="header-logo">OpenBoot</a>
		<nav class="header-nav">
			<a href="/explore" class:active={currentPath === '/explore' || currentPath.startsWith('/explore')}>Explore</a>
			<a href="/docs" class:active={currentPath === '/docs' || currentPath.startsWith('/docs')}>Docs</a>
		</nav>
		<div class="header-right">
			{#if children}{@render children()}{/if}
			<GitHubStarBadge />
			{#if $auth.loading}
				
			{:else if $auth.user}
				<a href="/dashboard" class="header-dashboard-link">Dashboard</a>
				<span class="header-separator">/</span>
				<a href="/api/auth/logout" class="header-logout-link">Logout</a>
			{:else}
				<a href="/login" class="header-login-link">Sign in</a>
			{/if}
			<ThemeToggle />
		</div>
	</div>
</header>

<style>
	.site-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: var(--header-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid var(--border);
		z-index: 100;
	}

	.header-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 14px 24px;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 20px;
	}

	.header-logo {
		font-family: 'JetBrains Mono', monospace;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--accent);
		letter-spacing: -0.02em;
		text-decoration: none;
		transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.header-logo:hover {
		opacity: 0.8;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.header-nav a {
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		text-decoration: none;
		transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.header-nav a:hover,
	.header-nav a.active {
		color: var(--text-primary);
	}

	.header-nav a::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--accent);
		transform: scaleX(0);
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.header-nav a:hover::after,
	.header-nav a.active::after {
		transform: scaleX(1);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.header-dashboard-link,
	.header-login-link,
	.header-logout-link {
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		text-decoration: none;
		transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.header-dashboard-link:hover,
	.header-login-link:hover,
	.header-logout-link:hover {
		color: var(--text-primary);
	}

	.header-separator {
		color: var(--text-muted);
		font-size: 0.9rem;
		user-select: none;
	}
</style>
