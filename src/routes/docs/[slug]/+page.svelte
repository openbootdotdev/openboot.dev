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
	<script type="application/ld+json">{JSON.stringify({
		"@context": "https://schema.org",
		"@type": "TechArticle",
		"headline": `${meta?.title ?? 'Docs'} — OpenBoot Docs`,
		"description": meta?.description || 'Documentation for OpenBoot — the open-source macOS development environment setup tool.',
		"url": `https://openboot.dev/docs/${slug}`,
		"isPartOf": {
			"@type": "TechArticle",
			"name": "OpenBoot Documentation",
			"url": "https://openboot.dev/docs"
		},
		"publisher": {
			"@type": "Organization",
			"name": "OpenBoot",
			"url": "https://openboot.dev"
		}
	})}</script>
</svelte:head>

<p class="docs-breadcrumb">
	<span class="accent">&gt;</span> docs{#if meta?.group} / {meta.group.toLowerCase()}{/if}
</p>

<article class="prose">
	{#key slug}
		<Component />
	{/key}
</article>

<nav class="docs-nav-footer">
	{#if prev}
		<a class="nav-btn nav-prev" href="/docs/{prev.slug}">
			<span class="nav-label">← Previous</span>
			<span class="nav-title">{prev.title}</span>
		</a>
	{:else}
		<span class="nav-spacer"></span>
	{/if}
	{#if next}
		<a class="nav-btn nav-next" href="/docs/{next.slug}">
			<span class="nav-label">Next →</span>
			<span class="nav-title">{next.title}</span>
		</a>
	{:else}
		<span class="nav-spacer"></span>
	{/if}
</nav>

<style>
	.docs-breadcrumb {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 16px;
	}

	.docs-breadcrumb .accent {
		color: var(--accent);
	}

	.docs-nav-footer {
		display: flex;
		justify-content: space-between;
		margin-top: 48px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
		gap: 16px;
	}

	.nav-btn {
		flex: 1;
		display: block;
		padding: 16px 18px;
		border: 1px solid var(--border);
		border-radius: 10px;
		transition:
			border-color 0.2s,
			background 0.2s;
		text-decoration: none;
		color: inherit;
	}

	.nav-btn:hover {
		border-color: var(--border-hover);
		background: var(--bg-tertiary);
		text-decoration: none;
	}

	.nav-next { text-align: right; }

	.nav-label {
		display: block;
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.nav-title {
		display: block;
		font-size: 0.9rem;
		margin-top: 4px;
	}

	.nav-prev .nav-title { color: var(--text-primary); }
	.nav-next .nav-title { color: var(--accent); }

	.nav-spacer { flex: 1; }

	@media (max-width: 600px) {
		.docs-nav-footer { flex-direction: column; }
	}
</style>
