<script lang="ts">
	import type { Component as SvelteComponent } from 'svelte';
	import type { DocMeta, DocGroup } from '../docs-data';

	interface PageData {
		groups: DocGroup[];
		allDocs: DocMeta[];
		component: SvelteComponent;
		meta: { title: string; description: string; group: string; order: number };
		slug: string;
	}

	let { data }: { data: PageData } = $props();

	let allDocs = $derived(data.allDocs ?? []);
	let slug = $derived(data.slug);
	let meta = $derived(data.meta);
	let Component = $derived(data.component);

	let currentIndex = $derived(allDocs.findIndex((d) => d.slug === slug));
	let prev = $derived(currentIndex > 0 ? allDocs[currentIndex - 1] : null);
	let next = $derived(currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null);
</script>

<svelte:head>
	<title>{meta?.title ?? 'Docs'} — OpenBoot Docs</title>
	<meta
		name="description"
		content={meta?.description || 'Documentation for OpenBoot — the open-source macOS development environment setup tool.'}
	/>
	<meta property="og:title" content="{meta?.title ?? 'Docs'} — OpenBoot Docs" />
	<meta property="og:description" content={meta?.description || 'Documentation for OpenBoot — the open-source macOS development environment setup tool.'} />
	<meta property="og:url" content="https://openboot.dev/docs/{slug}" />
	<meta property="og:type" content="article" />
	<link rel="canonical" href="https://openboot.dev/docs/{slug}" />
</svelte:head>

<article class="prose">
	{#key slug}
		<Component />
	{/key}
</article>

<nav class="docs-nav-footer">
	{#if prev}
		<a class="nav-btn nav-prev" href="/docs/{prev.slug}">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="15 18 9 12 15 6" />
			</svg>
			<div>
				<span class="nav-label">Previous</span>
				<span class="nav-title">{prev.title}</span>
			</div>
		</a>
	{:else}
		<div></div>
	{/if}
	{#if next}
		<a class="nav-btn nav-next" href="/docs/{next.slug}">
			<div>
				<span class="nav-label">Next</span>
				<span class="nav-title">{next.title}</span>
			</div>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</a>
	{:else}
		<div></div>
	{/if}
</nav>

<style>
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
		text-decoration: none;
		color: inherit;
	}

	.nav-btn:hover {
		border-color: var(--border-hover);
		background: var(--bg-tertiary);
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		text-decoration: none;
	}

	.nav-prev { text-align: left; }
	.nav-next { text-align: right; margin-left: auto; }

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

	.nav-btn:hover svg { color: var(--accent); }

	@media (max-width: 600px) {
		.docs-nav-footer { flex-direction: column; }
		.nav-btn { max-width: 100%; }
		.nav-next { margin-left: 0; }
	}
</style>
