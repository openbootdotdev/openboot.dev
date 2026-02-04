<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Button from '$lib/components/Button.svelte';
	import { auth } from '$lib/stores/auth';

	import gettingStartedMd from '../../docs/getting-started.md?raw';
	import presetsMd from '../../docs/presets.md?raw';
	import customConfigsMd from '../../docs/custom-configs.md?raw';
	import snapshotMd from '../../docs/snapshot.md?raw';
	import cliReferenceMd from '../../docs/cli-reference.md?raw';
	import faqMd from '../../docs/faq.md?raw';

	const sections = [
		{ id: 'getting-started', title: 'Getting Started', content: gettingStartedMd },
		{ id: 'presets', title: 'Presets', content: presetsMd },
		{ id: 'custom-configs', title: 'Custom Configurations', content: customConfigsMd },
		{ id: 'snapshot', title: 'Snapshot', content: snapshotMd },
		{ id: 'cli-reference', title: 'CLI Reference', content: cliReferenceMd },
		{ id: 'faq', title: 'FAQ', content: faqMd }
	];

	let activeSection = $state('getting-started');
	let mobileMenuOpen = $state(false);

	let currentIndex = $derived(sections.findIndex((s) => s.id === activeSection));

	function getRenderedContent(): string {
		const section = sections.find((s) => s.id === activeSection);
		if (!section) return '';
		return marked.parse(section.content) as string;
	}

	function setSection(id: string) {
		activeSection = id;
		mobileMenuOpen = false;
		window.location.hash = id;
		window.scrollTo({ top: 0 });
	}

	onMount(() => {
		auth.check();

		const hash = window.location.hash.slice(1);
		if (hash && sections.some((s) => s.id === hash)) {
			activeSection = hash;
		}

		const handleHashChange = () => {
			const h = window.location.hash.slice(1);
			if (h && sections.some((s) => s.id === h)) {
				activeSection = h;
			}
		};

		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	});
</script>

<svelte:head>
	<title>{sections.find((s) => s.id === activeSection)?.title ?? 'Docs'} — OpenBoot Docs</title>
	<meta
		name="description"
		content="Documentation for OpenBoot — the open-source macOS development environment setup tool. Presets, custom configs, snapshot, CLI reference, and FAQ."
	/>
</svelte:head>

<header class="site-header">
	<div class="header-container">
		<div class="header-left">
			<a href="/" class="header-logo">OpenBoot</a>
			<span class="header-divider">/</span>
			<a href="/docs" class="header-docs-label">docs</a>
		</div>
		<div class="header-right">
			<ThemeToggle />
			{#if $auth.loading}
				<span class="loading-text">...</span>
			{:else if $auth.user}
				<Button href="/dashboard" variant="secondary">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
						<rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
					</svg>
					Dashboard
				</Button>
			{:else}
				<Button href="/api/auth/login" variant="secondary">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
						/>
					</svg>
					Login
				</Button>
			{/if}
		</div>
	</div>
</header>

<button
	class="mobile-menu-btn"
	onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
	aria-label="Toggle docs menu"
>
	{#if mobileMenuOpen}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	{:else}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
		</svg>
	{/if}
	<span>Menu</span>
</button>

<div class="docs-layout">
	<aside class="sidebar" class:open={mobileMenuOpen}>
		<nav>
			<div class="sidebar-label">Documentation</div>
			{#each sections as section}
				<button
					class="sidebar-item"
					class:active={activeSection === section.id}
					onclick={() => setSection(section.id)}
				>
					{section.title}
				</button>
			{/each}
		</nav>
		<div class="sidebar-footer">
			<a href="https://github.com/openbootdotdev/openboot" target="_blank" rel="noopener" class="sidebar-link">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
				</svg>
				GitHub
			</a>
			<a href="/" class="sidebar-link">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
					<polyline points="9 22 9 12 15 12 15 22" />
				</svg>
				Home
			</a>
		</div>
	</aside>

	{#if mobileMenuOpen}
		<button class="backdrop" onclick={() => (mobileMenuOpen = false)} aria-label="Close menu"></button>
	{/if}

	<main class="docs-content">
		<article class="prose">
			{@html getRenderedContent()}
		</article>

			<nav class="docs-nav-footer">
			{#if currentIndex > 0}
				<button class="nav-btn nav-prev" onclick={() => setSection(sections[currentIndex - 1].id)}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
					<div>
						<span class="nav-label">Previous</span>
						<span class="nav-title">{sections[currentIndex - 1].title}</span>
					</div>
				</button>
			{:else}
				<div></div>
			{/if}
			{#if currentIndex < sections.length - 1}
				<button class="nav-btn nav-next" onclick={() => setSection(sections[currentIndex + 1].id)}>
					<div>
						<span class="nav-label">Next</span>
						<span class="nav-title">{sections[currentIndex + 1].title}</span>
					</div>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</button>
			{:else}
				<div></div>
			{/if}
		</nav>
	</main>
</div>

<style>
	/* ── Header (matches main page) ───────────────────── */

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
		transition: background 0.3s;
	}

	.header-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 12px 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.header-logo {
		font-family: 'JetBrains Mono', monospace;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--accent);
		letter-spacing: -0.02em;
	}

	.header-divider {
		color: var(--text-muted);
		font-size: 1.1rem;
		font-weight: 300;
		user-select: none;
	}

	.header-docs-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
		transition: color 0.2s;
	}

	.header-docs-label:hover {
		color: var(--text-primary);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.loading-text {
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	/* ── Docs Layout ──────────────────────────────────── */

	.docs-layout {
		display: flex;
		margin-top: 49px;
		min-height: calc(100vh - 49px);
	}

	/* ── Sidebar ──────────────────────────────────────── */

	.sidebar {
		width: 260px;
		flex-shrink: 0;
		background: var(--bg-secondary);
		border-right: 1px solid var(--border);
		padding: 28px 0;
		position: sticky;
		top: 49px;
		height: calc(100vh - 49px);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.sidebar-label {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		padding: 0 24px;
		margin-bottom: 12px;
	}

	.sidebar-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 9px 24px;
		font-size: 0.88rem;
		font-weight: 450;
		color: var(--text-secondary);
		background: none;
		border: none;
		border-left: 3px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
		font-family: inherit;
	}

	.sidebar-item:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.sidebar-item.active {
		color: var(--accent);
		border-left-color: var(--accent);
		background: var(--accent-glow);
		font-weight: 600;
	}

	.sidebar-footer {
		padding: 20px 24px 0;
		border-top: 1px solid var(--border);
		margin-top: 20px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.sidebar-link {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 0;
		font-size: 0.8rem;
		color: var(--text-muted);
		transition: color 0.2s;
	}

	.sidebar-link:hover {
		color: var(--accent);
	}

	/* ── Mobile Menu Button ───────────────────────────── */

	.mobile-menu-btn {
		display: none;
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 90;
		background: var(--accent);
		color: #000;
		border: none;
		border-radius: 12px;
		padding: 12px 18px;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		align-items: center;
		gap: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 20px rgba(34, 197, 94, 0.2);
		transition: transform 0.2s;
	}

	.mobile-menu-btn:hover {
		transform: scale(1.05);
	}

	.backdrop {
		display: none;
		border: none;
		background: none;
		padding: 0;
		appearance: none;
	}

	/* ── Content Area ─────────────────────────────────── */

	.docs-content {
		flex: 1;
		min-width: 0;
		padding: 40px 56px 80px;
		max-width: 900px;
	}

	/* ── Prose (markdown content styling) ─────────────── */

	.prose :global(h1) {
		font-size: 2rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		margin-bottom: 12px;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.prose :global(h1 + p) {
		font-size: 1.02rem;
		color: var(--text-secondary);
		line-height: 1.7;
		margin-bottom: 36px;
	}

	.prose :global(h2) {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-top: 48px;
		margin-bottom: 16px;
		color: var(--text-primary);
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border);
	}

	.prose :global(h3) {
		font-size: 1.08rem;
		font-weight: 600;
		margin-top: 32px;
		margin-bottom: 12px;
		color: var(--text-primary);
	}

	.prose :global(h3 code) {
		font-size: 1rem;
		background: var(--code-bg);
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid var(--border);
		font-weight: 600;
	}

	.prose :global(p) {
		font-size: 0.94rem;
		color: var(--text-secondary);
		line-height: 1.75;
		margin-bottom: 16px;
	}

	.prose :global(strong) {
		color: var(--text-primary);
		font-weight: 600;
	}

	.prose :global(a) {
		color: var(--accent);
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.prose :global(a:hover) {
		text-decoration: underline;
		opacity: 0.85;
	}

	.prose :global(ul),
	.prose :global(ol) {
		padding-left: 24px;
		margin-bottom: 20px;
	}

	.prose :global(li) {
		font-size: 0.94rem;
		color: var(--text-secondary);
		line-height: 1.75;
		margin-bottom: 6px;
	}

	.prose :global(li strong) {
		color: var(--text-primary);
	}

	.prose :global(code) {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.84rem;
		background: var(--code-bg);
		border: 1px solid var(--border);
		padding: 2px 7px;
		border-radius: 4px;
		color: var(--accent);
	}

	.prose :global(pre) {
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 20px 24px;
		margin-bottom: 24px;
		overflow-x: auto;
		position: relative;
	}

	.prose :global(pre code) {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.84rem;
		line-height: 1.7;
		color: var(--text-primary);
	}

	/* ── Tables ────────────────────────────────────────── */

	.prose :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 24px;
		font-size: 0.88rem;
	}

	.prose :global(thead) {
		border-bottom: 2px solid var(--border);
	}

	.prose :global(th) {
		text-align: left;
		padding: 10px 16px;
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.82rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.prose :global(td) {
		padding: 10px 16px;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border);
	}

	.prose :global(td code) {
		font-size: 0.8rem;
	}

	.prose :global(tr:last-child td) {
		border-bottom: none;
	}

	.prose :global(tbody tr:hover) {
		background: var(--bg-tertiary);
	}

	/* ── Horizontal Rule ──────────────────────────────── */

	.prose :global(hr) {
		border: none;
		border-top: 1px solid var(--border);
		margin: 40px 0;
	}

	/* ── Blockquote ────────────────────────────────────── */

	.prose :global(blockquote) {
		border-left: 3px solid var(--accent);
		padding: 12px 20px;
		margin: 0 0 20px;
		background: var(--accent-glow);
		border-radius: 0 8px 8px 0;
	}

	.prose :global(blockquote p) {
		margin-bottom: 0;
		color: var(--text-primary);
	}

	/* ── Prev / Next Navigation ───────────────────────── */

	.docs-nav-footer {
		display: flex;
		justify-content: space-between;
		margin-top: 64px;
		padding-top: 32px;
		border-top: 1px solid var(--border);
		gap: 16px;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 20px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		max-width: 280px;
	}

	.nav-btn:hover {
		border-color: var(--border-hover);
		background: var(--bg-tertiary);
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.nav-prev {
		text-align: left;
	}

	.nav-next {
		text-align: right;
		margin-left: auto;
	}

	.nav-label {
		display: block;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-bottom: 2px;
	}

	.nav-title {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--accent);
	}

	.nav-btn svg {
		flex-shrink: 0;
		color: var(--text-muted);
	}

	.nav-btn:hover svg {
		color: var(--accent);
	}

	/* ── Responsive ───────────────────────────────────── */

	@media (max-width: 860px) {
		.sidebar {
			position: fixed;
			top: 49px;
			left: 0;
			bottom: 0;
			z-index: 80;
			transform: translateX(-100%);
			transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
			box-shadow: none;
		}

		.sidebar.open {
			transform: translateX(0);
			box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
		}

		.mobile-menu-btn {
			display: flex;
		}

		.backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 75;
			background: rgba(0, 0, 0, 0.5);
			cursor: default;
		}

		.docs-content {
			padding: 32px 24px 100px;
		}
	}

	@media (max-width: 600px) {
		.docs-content {
			padding: 24px 16px 100px;
		}

		.prose :global(h1) {
			font-size: 1.6rem;
		}

		.prose :global(h2) {
			font-size: 1.2rem;
		}

		.prose :global(pre) {
			padding: 14px 16px;
			border-radius: 6px;
		}

		.prose :global(pre code) {
			font-size: 0.78rem;
		}

		.docs-nav-footer {
			flex-direction: column;
		}

		.nav-btn {
			max-width: 100%;
		}

		.nav-next {
			margin-left: 0;
		}
	}
</style>
