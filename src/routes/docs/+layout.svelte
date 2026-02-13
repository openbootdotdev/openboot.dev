<script lang="ts">
	import { page } from '$app/stores';
	import { afterNavigate, onNavigate, goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import { auth } from '$lib/stores/auth';

	let { data, children } = $props();

	let mobileMenuOpen = $state(false);
	let mobileTocOpen = $state(false);
	let searchOpen = $state(false);

	interface TocItem {
		id: string;
		text: string;
		level: number;
	}

	let toc = $state<TocItem[]>([]);
	let activeHeading = $state('');
	let readingProgress = $state(0);

	let tocIndicatorTop = $state(0);
	let tocIndicatorHeight = $state(0);
	let tocNavRef = $state<HTMLElement | null>(null);

	let collapsedGroups = $state<Set<string>>(new Set());

	let currentSlug = $derived($page.params.slug ?? '');

	let allDocs = $derived(data.allDocs ?? []);
	let currentIndex = $derived(allDocs.findIndex((d: { slug: string }) => d.slug === currentSlug));
	let prev = $derived(currentIndex > 0 ? allDocs[currentIndex - 1] : null);
	let next = $derived(currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null);

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function closeMobileToc() {
		mobileTocOpen = false;
	}

	function smartCollapseGroups() {
		const newCollapsed = new Set<string>();
		for (const group of data.groups) {
			if (!group.label) continue;
			const hasActive = group.items.some((item: { slug: string }) => item.slug === currentSlug);
			if (!hasActive) newCollapsed.add(group.label);
		}
		collapsedGroups = newCollapsed;
	}

	function toggleGroup(label: string) {
		const updated = new Set(collapsedGroups);
		if (updated.has(label)) {
			updated.delete(label);
		} else {
			updated.add(label);
		}
		collapsedGroups = updated;
	}

	function updateTocIndicator() {
		if (!tocNavRef) return;
		const activeEl = tocNavRef.querySelector('.toc-item.active') as HTMLElement | null;
		if (activeEl) {
			tocIndicatorTop = activeEl.offsetTop;
			tocIndicatorHeight = activeEl.offsetHeight;
		}
	}

	function injectHeadingAnchors() {
		const headings = document.querySelectorAll('.prose h2[id], .prose h3[id]');
		for (const heading of headings) {
			if (heading.querySelector('.heading-anchor')) continue;
			const anchor = document.createElement('a');
			anchor.className = 'heading-anchor';
			anchor.href = `#${heading.id}`;
			anchor.setAttribute('aria-label', `Link to ${heading.textContent}`);
			anchor.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
			anchor.onclick = async (e) => {
				e.preventDefault();
				const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
				try {
					await navigator.clipboard.writeText(url);
					anchor.classList.add('copied');
					setTimeout(() => anchor.classList.remove('copied'), 2000);
				} catch (err) {
					void err;
				}
				document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
			};
			(heading as HTMLElement).style.position = 'relative';
			heading.prepend(anchor);
		}
	}

	function injectCopyButtons() {
		const codeBlocks = document.querySelectorAll('.prose pre');
		for (const pre of codeBlocks) {
			if (pre.querySelector('.copy-btn') || pre.parentElement?.classList.contains('code-block-wrapper')) continue;
			const wrapper = document.createElement('div');
			wrapper.className = 'code-block-wrapper';
			pre.parentNode?.insertBefore(wrapper, pre);
			wrapper.appendChild(pre);

			const btn = document.createElement('button');
			btn.className = 'copy-btn';
			btn.textContent = 'Copy';
			btn.setAttribute('aria-label', 'Copy code');
			btn.onclick = async () => {
				const code = pre.querySelector('code');
				const text = code?.textContent ?? pre.textContent ?? '';
				try {
					await navigator.clipboard.writeText(text);
					btn.textContent = 'Copied!';
					btn.classList.add('copied');
					setTimeout(() => {
						btn.textContent = 'Copy';
						btn.classList.remove('copied');
					}, 2000);
				} catch (err) {
					void err;
				}
			};
			wrapper.appendChild(btn);
		}
	}

	onMount(() => {
		function handleScroll() {
			const headings = document.querySelectorAll('.prose h2, .prose h3');
			let current = '';
			for (const heading of headings) {
				if (heading.getBoundingClientRect().top <= 100) {
					current = heading.id;
				}
			}
			if (current) activeHeading = current;

			const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
			readingProgress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
		}

		function handleKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				searchOpen = !searchOpen;
				return;
			}

			if (searchOpen || mobileTocOpen || mobileMenuOpen) return;
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

			if (e.key === 'ArrowLeft' && prev) {
				e.preventDefault();
				goto(`/docs/${prev.slug}`);
			} else if (e.key === 'ArrowRight' && next) {
				e.preventDefault();
				goto(`/docs/${next.slug}`);
			}
		}

		rebuildToc();
		smartCollapseGroups();
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	$effect(() => {
		if (activeHeading) {
			tick().then(() => updateTocIndicator());
		}
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	let tocFallbackTimer: ReturnType<typeof setTimeout> | null = null;

	function rebuildToc() {
		const headings = document.querySelectorAll('.prose h2, .prose h3');
		toc = Array.from(headings).map((h) => ({
			id: h.id,
			text: h.textContent ?? '',
			level: h.tagName === 'H2' ? 2 : 3
		}));
		if (toc.length > 0 && !activeHeading) {
			activeHeading = toc[0].id;
		}
	}

	afterNavigate(async () => {
		if (tocFallbackTimer) clearTimeout(tocFallbackTimer);
		toc = [];
		activeHeading = '';
		readingProgress = 0;
		await tick();
		requestAnimationFrame(() => {
			rebuildToc();
			injectHeadingAnchors();
			injectCopyButtons();
			smartCollapseGroups();
			if (toc.length === 0) {
				tocFallbackTimer = setTimeout(() => {
					rebuildToc();
					injectHeadingAnchors();
					injectCopyButtons();
				}, 100);
			}
		});
	});

	async function handleSearchNavigate(slug: string) {
		searchOpen = false;
		await goto(`/docs/${slug}`);
	}
</script>

<div class="reading-progress" style="width: {readingProgress}%"></div>

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

{#if toc.length > 0}
	<button class="mobile-toc-btn" onclick={() => (mobileTocOpen = !mobileTocOpen)} aria-label="On this page">
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
			<line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
		</svg>
		<span>On this page</span>
	</button>
{/if}

<div class="docs-layout">
	<aside class="sidebar" class:open={mobileMenuOpen}>
		<button class="search-trigger-sidebar" onclick={() => (searchOpen = true)} aria-label="Search docs (Cmd+K)">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
			<span class="search-trigger-text">Search</span>
			<kbd>⌘K</kbd>
		</button>
		<nav>
			{#each data.groups as group}
				{#if group.label}
					<button
						class="sidebar-label"
						onclick={() => toggleGroup(group.label)}
						aria-expanded={!collapsedGroups.has(group.label)}
					>
						<span>{group.label}</span>
						<svg class="chevron" class:collapsed={collapsedGroups.has(group.label)} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</button>
				{/if}
				<div class="sidebar-group-items" class:collapsed={group.label ? collapsedGroups.has(group.label) : false}>
					{#each group.items as item}
						<a
							class="sidebar-item"
							class:active={currentSlug === item.slug}
							href="/docs/{item.slug}"
							onclick={closeMobileMenu}
						>
							{item.title}
						</a>
					{/each}
				</div>
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

	{#if mobileTocOpen}
		<button class="backdrop toc-backdrop" onclick={() => (mobileTocOpen = false)} aria-label="Close table of contents"></button>
		<div class="mobile-toc-panel">
			<div class="mobile-toc-header">
				<span>On this page</span>
				<button class="mobile-toc-close" onclick={() => (mobileTocOpen = false)} aria-label="Close">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
			<nav>
				{#each toc as item}
					<a
						class="toc-item"
						class:toc-h3={item.level === 3}
						class:active={activeHeading === item.id}
						href="#{item.id}"
						onclick={closeMobileToc}
					>
						{item.text}
					</a>
				{/each}
			</nav>
		</div>
	{/if}

	<main class="docs-content prose">
		{@render children()}
	</main>

	{#if toc.length > 0}
		<aside class="toc">
			<div class="toc-label">On this page</div>
			<nav class="toc-nav" bind:this={tocNavRef}>
				<div class="toc-indicator" style="top: {tocIndicatorTop}px; height: {tocIndicatorHeight}px;"></div>
				{#each toc as item}
					<a
						class="toc-item"
						class:toc-h3={item.level === 3}
						class:active={activeHeading === item.id}
						href="#{item.id}"
					>
						{item.text}
					</a>
				{/each}
			</nav>
		</aside>
	{/if}
</div>

{#if searchOpen}
	{#await import('$lib/components/SearchModal.svelte') then mod}
		<mod.default
			open={searchOpen}
			searchIndex={data.searchIndex ?? []}
			onclose={() => (searchOpen = false)}
			onnavigate={handleSearchNavigate}
		/>
	{/await}
{/if}

<style>
	/* ── Reading Progress Bar ─────────────────────────── */

	.reading-progress {
		position: fixed;
		top: 49px;
		left: 0;
		height: 2px;
		background: var(--accent);
		z-index: 101;
		transition: width 0.1s linear;
		pointer-events: none;
	}

	/* ── Search Trigger ───────────────────────────────── */

	.search-trigger-sidebar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		margin: 0 16px 20px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-muted);
		font-family: inherit;
		font-size: 0.82rem;
		cursor: pointer;
		transition: all 0.15s;
		width: calc(100% - 32px);
	}

	.search-trigger-sidebar:hover {
		border-color: var(--border-hover);
		color: var(--text-secondary);
		background: var(--bg-hover);
	}

	.search-trigger-sidebar kbd {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		padding: 1px 5px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--bg-secondary);
		color: var(--text-muted);
		margin-left: auto;
	}

	/* ── Layout ────────────────────────────────────────── */

	.docs-layout {
		display: flex;
		margin-top: 49px;
		min-height: calc(100vh - 49px);
	}

	/* ── Left Sidebar ─────────────────────────────────── */

	.sidebar {
		width: 240px;
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		padding: 0 24px;
		margin-bottom: 8px;
		margin-top: 24px;
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		transition: color 0.15s;
		text-align: left;
	}

	.sidebar-label:first-child { margin-top: 0; }
	.sidebar-label:hover { color: var(--text-secondary); }

	.chevron {
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
	}

	.chevron.collapsed { transform: rotate(-90deg); }

	.sidebar-group-items {
		overflow: hidden;
		max-height: 2000px;
		transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
		opacity: 1;
	}

	.sidebar-group-items.collapsed {
		max-height: 0;
		opacity: 0;
	}

	.sidebar-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 7px 24px;
		font-size: 0.85rem;
		font-weight: 450;
		color: var(--text-secondary);
		background: none;
		border: none;
		border-left: 3px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
		font-family: inherit;
		text-decoration: none;
	}

	.sidebar-item:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
		text-decoration: none;
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
		text-decoration: none;
	}

	.sidebar-link:hover { color: var(--accent); }

	/* ── Right TOC ────────────────────────────────────── */

	.toc {
		width: 220px;
		flex-shrink: 0;
		position: sticky;
		top: 49px;
		height: calc(100vh - 49px);
		overflow-y: auto;
		padding: 32px 16px 32px 0;
		border-left: 1px solid var(--border);
	}

	.toc-label {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 12px;
		padding-left: 16px;
	}

	.toc-nav { position: relative; }

	.toc-indicator {
		position: absolute;
		left: 0;
		width: 2px;
		background: var(--accent);
		border-radius: 1px;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
	}

	.toc-item {
		display: block;
		padding: 4px 16px;
		font-size: 0.78rem;
		color: var(--text-muted);
		text-decoration: none;
		border-left: 2px solid transparent;
		transition: all 0.15s;
		line-height: 1.5;
	}

	.toc-item:hover {
		color: var(--text-primary);
		text-decoration: none;
	}

	.toc-item.active {
		color: var(--accent);
		border-left-color: transparent;
	}

	.toc-item.toc-h3 {
		padding-left: 28px;
		font-size: 0.75rem;
	}

	/* ── Content Area ─────────────────────────────────── */

	.docs-content {
		flex: 1;
		min-width: 0;
		padding: 40px 56px 80px;
		max-width: 800px;
		view-transition-name: docs-content;
	}

	/* ── View Transitions ─────────────────────────────── */

	@keyframes fade-in { from { opacity: 0; } }
	@keyframes fade-out { to { opacity: 0; } }

	:global(::view-transition-old(docs-content)) {
		animation: 150ms ease-in both fade-out;
	}

	:global(::view-transition-new(docs-content)) {
		animation: 150ms ease-out 50ms both fade-in;
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

	.mobile-menu-btn:hover { transform: scale(1.05); }

	/* ── Mobile TOC Button ────────────────────────────── */

	.mobile-toc-btn {
		display: none;
		position: fixed;
		bottom: 20px;
		right: 130px;
		z-index: 90;
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 12px 18px;
		font-size: 0.85rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		align-items: center;
		gap: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s;
	}

	.mobile-toc-btn:hover { transform: scale(1.05); }

	/* ── Mobile TOC Panel ─────────────────────────────── */

	.mobile-toc-panel {
		display: none;
		position: fixed;
		bottom: 80px;
		right: 20px;
		z-index: 85;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		max-height: 60vh;
		overflow-y: auto;
		min-width: 240px;
		max-width: 300px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.mobile-toc-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}

	.mobile-toc-close {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		padding: 2px;
		border-radius: 4px;
		transition: color 0.15s;
		display: flex;
	}

	.mobile-toc-close:hover { color: var(--text-primary); }

	.mobile-toc-panel nav { padding: 8px 0; }

	.mobile-toc-panel .toc-item {
		border-left: none;
		padding: 6px 16px;
	}

	.mobile-toc-panel .toc-item.toc-h3 { padding-left: 28px; }

	.backdrop {
		display: none;
		border: none;
		background: none;
		padding: 0;
		appearance: none;
	}

	.toc-backdrop { z-index: 80; }

	/* ── Heading Anchors ──────────────────────────────── */

	.prose :global(.heading-anchor) {
		position: absolute;
		left: -24px;
		top: 50%;
		transform: translateY(-50%);
		opacity: 0;
		color: var(--text-muted);
		transition: all 0.15s;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		line-height: 1;
	}

	.prose :global(h2:hover .heading-anchor),
	.prose :global(h3:hover .heading-anchor) {
		opacity: 1;
	}

	.prose :global(.heading-anchor:hover) {
		color: var(--accent);
		background: var(--accent-glow);
	}

	.prose :global(.heading-anchor.copied) { color: var(--accent); }

	/* ── Code Copy Button ─────────────────────────────── */

	.prose :global(.code-block-wrapper) { position: relative; }

	.prose :global(.copy-btn) {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 4px 10px;
		font-size: 0.72rem;
		font-family: 'JetBrains Mono', monospace;
		font-weight: 500;
		color: var(--text-muted);
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 6px;
		cursor: pointer;
		opacity: 0;
		transition: all 0.15s;
		z-index: 5;
	}

	.prose :global(.code-block-wrapper:hover .copy-btn) { opacity: 1; }

	.prose :global(.copy-btn:hover) {
		color: var(--text-primary);
		border-color: var(--border-hover);
		background: var(--bg-hover);
	}

	.prose :global(.copy-btn.copied) {
		color: var(--accent);
		border-color: var(--accent);
	}

	/* ── Prose ─────────────────────────────────────────── */

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

	.prose :global(strong) { color: var(--text-primary); font-weight: 600; }

	.prose :global(a) {
		color: var(--accent);
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.prose :global(a:hover) { text-decoration: underline; opacity: 0.85; }

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

	.prose :global(li strong) { color: var(--text-primary); }

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

	.prose :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 24px;
		font-size: 0.88rem;
	}

	.prose :global(thead) { border-bottom: 2px solid var(--border); }

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

	.prose :global(td code) { font-size: 0.8rem; }
	.prose :global(tr:last-child td) { border-bottom: none; }
	.prose :global(tbody tr:hover) { background: var(--bg-tertiary); }

	.prose :global(hr) {
		border: none;
		border-top: 1px solid var(--border);
		margin: 40px 0;
	}

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

	/* ── Smooth Scroll + Reduced Motion ───────────────── */

	:global(html) { scroll-behavior: smooth; }

	@media (prefers-reduced-motion: reduce) {
		:global(html) { scroll-behavior: auto; }

		:global(::view-transition-old(docs-content)),
		:global(::view-transition-new(docs-content)) {
			animation: none !important;
		}
	}

	/* ── Responsive ───────────────────────────────────── */

	@media (max-width: 1100px) {
		.toc { display: none; }
		.mobile-toc-btn { display: flex; }
		.mobile-toc-panel { display: block; }
	}

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

		.mobile-menu-btn { display: flex; }

		.backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 75;
			background: rgba(0, 0, 0, 0.5);
			cursor: default;
		}

		.docs-content { padding: 32px 24px 100px; }
		.mobile-toc-btn { right: 130px; }
	}

	@media (max-width: 600px) {
		.docs-content { padding: 24px 16px 100px; }

		.prose :global(h1) { font-size: 1.6rem; }
		.prose :global(h2) { font-size: 1.2rem; }

		.prose :global(pre) {
			padding: 14px 16px;
			border-radius: 6px;
		}

		.prose :global(pre code) { font-size: 0.78rem; }

		.search-trigger-text { display: none; }
		.search-trigger kbd { display: none; }

		.mobile-toc-btn {
			right: auto;
			left: 20px;
		}
	}
</style>
