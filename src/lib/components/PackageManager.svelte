<script lang="ts">
	interface SearchResult {
		name: string;
		desc: string;
		type: 'formula' | 'cask' | 'tap' | 'npm';
	}

	let {
		selectedPackages,
		basePreset,
		togglePackage,
		onPresetChange
	}: {
		selectedPackages: Map<string, string>;
		basePreset: string;
		togglePackage: (name: string, type: string, desc?: string) => void;
		onPresetChange: (preset: string) => void;
	} = $props();

	function pkgKey(name: string, type: string): string {
		return `${type}:${name}`;
	}

	const presets = ['minimal', 'developer', 'full', 'scratch'];

	/** Type → dot color, matching the package "DNA" language. */
	function dotColor(type: string): string {
		if (type === 'cask') return 'var(--amber)';
		if (type === 'npm') return '#7aa2e3';
		if (type === 'tap') return 'var(--text-muted)';
		return 'var(--accent)';
	}

	/** "cirruslabs/cli/tart" → "tart" */
	function displayName(name: string): string {
		if (name.includes('/')) return name.split('/').pop() as string;
		return name;
	}

	// Selected packages in insertion order.
	const packageList = $derived(
		Array.from(selectedPackages.entries()).map(([key, type]) => ({
			name: key.slice(type.length + 1),
			type
		}))
	);

	let searchOpen = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searchLoading = $state(false);
	let searchInput = $state<HTMLInputElement | null>(null);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	function isTapPackage(q: string): boolean {
		return /^[a-z0-9_-]+\/[a-z0-9_-]+\/[a-z0-9_-]+$/i.test(q);
	}

	async function runSearch(query: string) {
		if (query.length < 2) {
			searchResults = [];
			return;
		}
		searchLoading = true;
		try {
			const [brewRes, npmRes] = await Promise.allSettled([
				fetch(`/api/homebrew/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
				fetch(`/api/npm/search?q=${encodeURIComponent(query)}`).then((r) => r.json())
			]);
			const brew: SearchResult[] = brewRes.status === 'fulfilled' ? brewRes.value.results || [] : [];
			const npm: SearchResult[] =
				npmRes.status === 'fulfilled'
					? (npmRes.value.results || []).map((r: any) => ({ ...r, type: 'npm' as const }))
					: [];
			searchResults = [...brew, ...npm];
			if (isTapPackage(query) && !searchResults.some((r) => r.name === query)) {
				searchResults.unshift({ name: query, desc: 'Third-party tap package', type: 'tap' });
			}
		} catch {
			searchResults = [];
		} finally {
			searchLoading = false;
		}
	}

	function handleSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchQuery = value;
		if (searchTimer) clearTimeout(searchTimer);
		if (value.length < 2) {
			searchResults = [];
			return;
		}
		searchTimer = setTimeout(() => runSearch(value), 300);
	}

	async function openSearch() {
		searchOpen = true;
		await Promise.resolve();
		searchInput?.focus();
	}

	function closeSearch() {
		searchOpen = false;
		searchQuery = '';
		searchResults = [];
	}
</script>

<div class="card">
	<div class="field-label">Base preset</div>
	<div class="presets">
		{#each presets as p (p)}
			<button class="preset" class:active={basePreset === p} onclick={() => onPresetChange(p)}>{p}</button>
		{/each}
	</div>

	<div class="field-label field-label-spaced">Packages</div>
	<div class="chips">
		{#each packageList as pk (pk.type + ':' + pk.name)}
			<span class="chip">
				<span class="chip-dot" style="background:{dotColor(pk.type)};"></span>{displayName(pk.name)}
				<button class="chip-x" aria-label="Remove {pk.name}" onclick={() => togglePackage(pk.name, pk.type)}>×</button>
			</span>
		{/each}
		{#if packageList.length === 0}
			<span class="chips-empty">No packages — pick a preset or add one below.</span>
		{/if}
	</div>

	{#if !searchOpen}
		<button class="add-pkg" onclick={openSearch}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
			<span>Search Homebrew &amp; npm to add a package…</span>
		</button>
	{:else}
		<div class="search">
			<div class="search-bar">
				<svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
				<input
					bind:this={searchInput}
					class="search-input"
					value={searchQuery}
					oninput={handleSearch}
					onkeydown={(e) => e.key === 'Escape' && closeSearch()}
					placeholder="Search Homebrew & npm…"
				/>
				<button class="search-close" aria-label="Close search" onclick={closeSearch}>×</button>
			</div>
			{#if searchLoading}
				<div class="search-status">Searching…</div>
			{:else if searchQuery.length >= 2 && searchResults.length === 0}
				<div class="search-status">No results for "{searchQuery}"</div>
			{:else if searchResults.length > 0}
				<div class="results">
					{#each searchResults as result (result.type + ':' + result.name)}
						{@const on = selectedPackages.has(pkgKey(result.name, result.type))}
						<button class="result" class:on onclick={() => togglePackage(result.name, result.type, result.desc)}>
							<span class="result-dot" style="background:{dotColor(result.type)};"></span>
							<span class="result-name">{result.name}</span>
							{#if result.desc}<span class="result-desc">{result.desc}</span>{/if}
							<span class="result-mark">{on ? '✓' : '+'}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 22px;
	}

	.field-label {
		font-size: 0.74rem;
		color: var(--text-secondary);
		margin-bottom: 11px;
	}

	.field-label-spaced {
		margin-top: 22px;
	}

	.presets {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.preset {
		padding: 9px 16px;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.82rem;
		cursor: pointer;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-hover);
		text-transform: capitalize;
		transition: all 0.15s ease;
	}

	.preset:hover {
		color: var(--text-primary);
	}

	.preset.active {
		background: var(--accent);
		color: var(--bg-primary);
		border-color: var(--accent);
	}

	.chips {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 14px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px 7px 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-hover);
		border-radius: 8px;
		font-size: 0.8rem;
		color: var(--text-primary);
	}

	.chip-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.chip-x {
		background: none;
		border: none;
		padding: 0 0 0 2px;
		color: var(--text-muted);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.95rem;
		line-height: 1;
		transition: color 0.15s ease;
	}

	.chip-x:hover {
		color: var(--danger);
	}

	.chips-empty {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.add-pkg {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-tertiary);
		border: 1px dashed var(--border-hover);
		border-radius: 8px;
		padding: 10px 12px;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s ease, background 0.15s ease;
	}

	.add-pkg:hover {
		border-color: var(--accent);
		background: var(--bg-hover);
	}

	.add-pkg span {
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	/* search */
	.search {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 0 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--accent);
		border-radius: 8px;
	}

	.search-icon {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		padding: 10px 0;
		background: none;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: 0.84rem;
		color: var(--text-primary);
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.search-close {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
		padding: 0 2px;
		transition: color 0.15s ease;
	}

	.search-close:hover {
		color: var(--text-primary);
	}

	.search-status {
		font-size: 0.8rem;
		color: var(--text-muted);
		padding: 8px 2px;
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: 2px;
		max-height: 280px;
		overflow-y: auto;
	}

	.result {
		display: flex;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: 9px 11px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: border-color 0.15s ease;
	}

	.result:hover {
		border-color: var(--border-hover);
	}

	.result.on {
		border-color: var(--accent);
	}

	.result-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.result-name {
		font-size: 0.82rem;
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.result-desc {
		font-size: 0.74rem;
		color: var(--text-muted);
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-mark {
		margin-left: auto;
		flex-shrink: 0;
		font-size: 0.85rem;
		color: var(--accent);
	}
</style>
