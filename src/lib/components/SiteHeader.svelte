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
		<div class="header-left">
			<a href="/" class="header-logo"><span class="prompt">$</span> openboot</a>
			<nav class="header-nav">
				<a href="/explore" class:active={currentPath === '/explore' || currentPath.startsWith('/explore')}>Explore</a>
				<a href="/docs" class:active={currentPath === '/docs' || currentPath.startsWith('/docs')}>Docs</a>
			</nav>
		</div>
		<div class="header-right">
			{#if children}{@render children()}{/if}
			<GitHubStarBadge />
			{#if $auth.loading}

			{:else if $auth.user}
				<span class="header-auth">
					<a href="/dashboard" class="header-dashboard-link">Dashboard</a>
					<span class="header-separator">/</span>
					<form method="POST" action="/api/auth/logout" style="display:inline"><button type="submit" class="header-logout-link">Logout</button></form>
				</span>
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
		max-width: 1160px;
		margin: 0 auto;
		height: 56px;
		padding: 0 36px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 28px;
	}

	.header-logo {
		font-family: var(--font-mono);
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-primary);
		letter-spacing: -0.01em;
		text-decoration: none;
		transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.header-logo .prompt {
		color: var(--accent);
		margin-right: 2px;
	}

	.header-logo:hover {
		opacity: 0.8;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 22px;
	}

	.header-nav a {
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 400;
		text-transform: lowercase;
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

	.header-auth {
		display: flex;
		align-items: center;
		gap: 11px;
	}

	.header-dashboard-link,
	.header-login-link,
	.header-logout-link {
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
		text-transform: lowercase;
		text-decoration: none;
		transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	button.header-logout-link {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
	}

	.header-dashboard-link:hover,
	.header-login-link:hover,
	.header-logout-link:hover {
		color: var(--text-primary);
	}

	.header-separator {
		color: var(--text-muted);
		font-size: 0.85rem;
		user-select: none;
	}
</style>
