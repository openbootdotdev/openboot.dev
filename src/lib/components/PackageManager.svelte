<script lang="ts">
	import { PRESET_PACKAGES } from '$lib/presets';

	interface SearchResult {
		name: string;
		desc: string;
		type: 'formula' | 'cask' | 'tap' | 'npm';
	}

	let {
		selectedPackages,
		packageDescs,
		basePreset,
		togglePackage,
		onPresetChange,
	}: {
		selectedPackages: Map<string, string>;
		packageDescs: Map<string, string>;
		basePreset: string;
		togglePackage: (name: string, type: string, desc?: string) => void;
		onPresetChange: (preset: string) => void;
	} = $props();

	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searchLoading = $state(false);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	let showImport = $state(false);
	let brewfileContent = $state('');
	let importLoading = $state(false);
	let importError = $state('');

	function isTapPackage(q: string): boolean {
		return /^[a-z0-9_-]+\/[a-z0-9_-]+\/[a-z0-9_-]+$/i.test(q);
	}

	async function search(query: string) {
		if (query.length < 2) {
			searchResults = [];
			return;
		}
		searchLoading = true;
		try {
			const [brewRes, npmRes] = await Promise.allSettled([
				fetch(`/api/homebrew/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
				fetch(`/api/npm/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
			]);
			const brew: SearchResult[] =
				brewRes.status === 'fulfilled' ? brewRes.value.results || [] : [];
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
		searchTimer = setTimeout(() => search(value), 300);
	}

	const grouped = $derived.by(() => {
		const apps: string[] = [];
		const cli: string[] = [];
		const npm: string[] = [];
		for (const [pkg, type] of selectedPackages) {
			if (type === 'cask') apps.push(pkg);
			else if (type === 'npm') npm.push(pkg);
			else cli.push(pkg);
		}
		return { apps, cli, npm };
	});

	const presets = [
		{ key: 'minimal', label: 'Minimal', desc: 'CLI essentials' },
		{ key: 'developer', label: 'Developer', desc: 'Ready-to-code' },
		{ key: 'full', label: 'Full', desc: 'Everything' },
	];

	async function importBrewfile() {
		if (!brewfileContent.trim()) {
			importError = 'Paste your Brewfile content';
			return;
		}
		importLoading = true;
		importError = '';
		try {
			const response = await fetch('/api/brewfile/parse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: brewfileContent }),
			});
			const data = await response.json();
			if (!response.ok) {
				importError = data.error || 'Failed to parse';
				return;
			}
			if (data.packages.length === 0) {
				importError = 'No packages found';
				return;
			}
			const caskSet = new Set<string>(data.casks || []);
			for (const pkg of data.packages) {
				if (!selectedPackages.has(pkg)) {
					togglePackage(pkg, caskSet.has(pkg) ? 'cask' : 'formula');
				}
			}
			showImport = false;
			brewfileContent = '';
		} catch {
			importError = 'Failed to parse Brewfile';
		} finally {
			importLoading = false;
		}
	}
</script>

<div class="pm">
	<!-- Preset selector -->
	<div class="presets">
		{#each presets as p}
			<button
				class="preset"
				class:active={basePreset === p.key}
				onclick={() => onPresetChange(p.key)}
			>
				<span class="preset-name">{p.label}</span>
				<span class="preset-desc">{p.desc}</span>
			</button>
		{/each}
	</div>

	<!-- Unified search -->
	<div class="search-bar">
		<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
		</svg>
		<input
			type="text"
			class="search-input"
			value={searchQuery}
			oninput={handleSearch}
			placeholder="Search Homebrew & npm packages..."
		/>
		<button class="import-btn" onclick={() => (showImport = !showImport)}>
			Import
		</button>
	</div>

	<!-- Search results -->
	{#if searchLoading}
		<div class="search-status">Searching...</div>
	{:else if searchQuery.length >= 2 && searchResults.length === 0}
		<div class="search-status">No results for "{searchQuery}"</div>
	{:else if searchResults.length > 0}
		<div class="results">
			{#each searchResults as result}
				<button
					type="button"
					class="result-item"
					class:selected={selectedPackages.has(result.name)}
					onclick={() => togglePackage(result.name, result.type, result.desc)}
				>
					<span
						class="result-check"
						class:checked={selectedPackages.has(result.name)}
					>
						{selectedPackages.has(result.name) ? '✓' : ''}
					</span>
					<div class="result-info">
						<div class="result-top">
							<span class="result-name">{result.name}</span>
							<span class="result-badge {result.type}">{result.type}</span>
						</div>
						{#if result.desc}
							<span class="result-desc"
								>{result.desc.slice(0, 80)}{result.desc.length > 80 ? '...' : ''}</span
							>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Import panel -->
	{#if showImport}
		<div class="import-panel">
			{#if importError}
				<div class="import-error">{importError}</div>
			{/if}
			<textarea
				class="import-textarea"
				bind:value={brewfileContent}
				placeholder={'tap "homebrew/cask"\nbrew "git"\ncask "visual-studio-code"'}
			></textarea>
			<div class="import-actions">
				<button class="import-cancel" onclick={() => (showImport = false)}>Cancel</button>
				<button class="import-go" onclick={importBrewfile}>
					{importLoading ? 'Parsing...' : 'Import Brewfile'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Selected packages -->
	<div class="groups">
		{#if grouped.apps.length > 0}
			<div class="group">
				<div class="group-label">
					<span class="group-dot" style="background: #3b82f6"></span>
					APPS
					<span class="group-count">{grouped.apps.length}</span>
				</div>
				<div class="group-tags">
					{#each grouped.apps as pkg}
						<button class="tag cask" onclick={() => togglePackage(pkg, 'cask')}>
							{pkg}<span class="tag-x">&times;</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if grouped.cli.length > 0}
			<div class="group">
				<div class="group-label">
					<span class="group-dot" style="background: #22c55e"></span>
					CLI
					<span class="group-count">{grouped.cli.length}</span>
				</div>
				<div class="group-tags">
					{#each grouped.cli as pkg}
						<button class="tag cli" onclick={() => togglePackage(pkg, 'formula')}>
							{pkg}<span class="tag-x">&times;</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if grouped.npm.length > 0}
			<div class="group">
				<div class="group-label">
					<span class="group-dot" style="background: #f97316"></span>
					NPM
					<span class="group-count">{grouped.npm.length}</span>
				</div>
				<div class="group-tags">
					{#each grouped.npm as pkg}
						<button class="tag npm" onclick={() => togglePackage(pkg, 'npm')}>
							{pkg}<span class="tag-x">&times;</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if selectedPackages.size === 0}
			<div class="empty-packages">No packages selected. Choose a preset or search above.</div>
		{/if}
	</div>
</div>

<style>
	.pm {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	/* Presets */
	.presets {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}

	.preset {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 14px 16px;
		background: var(--bg-tertiary);
		border: 2px solid var(--border);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		font-family: inherit;
	}

	.preset:hover {
		border-color: var(--border-hover);
		background: var(--bg-hover);
	}

	.preset.active {
		border-color: var(--accent);
		background: rgba(34, 197, 94, 0.06);
	}

	.preset-name {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.preset-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	/* Search */
	.search-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 12px;
		transition: border-color 0.2s;
	}

	.search-bar:focus-within {
		border-color: var(--accent);
	}

	.search-icon {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		padding: 14px 0;
		background: none;
		border: none;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-family: inherit;
		outline: none;
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.import-btn {
		padding: 6px 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		font-family: inherit;
		white-space: nowrap;
	}

	.import-btn:hover {
		color: var(--text-secondary);
		border-color: var(--border-hover);
	}

	.search-status {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.85rem;
		padding: 16px;
	}

	/* Results */
	.results {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 6px;
		max-height: 320px;
		overflow-y: auto;
		padding: 4px;
		border-radius: 8px;
	}

	.result-item {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 10px 12px;
		background: var(--bg-tertiary);
		border: 1.5px solid var(--border);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		font-family: inherit;
	}

	.result-item:hover {
		border-color: var(--border-hover);
		background: var(--bg-hover);
	}

	.result-item.selected {
		border-color: var(--accent);
		background: rgba(34, 197, 94, 0.08);
	}

	.result-check {
		width: 18px;
		height: 18px;
		min-width: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px solid var(--border);
		border-radius: 4px;
		font-size: 0.7rem;
		color: var(--accent);
		background: var(--bg-secondary);
		margin-top: 1px;
	}

	.result-check.checked {
		background: var(--accent);
		border-color: var(--accent);
		color: #000;
	}

	.result-info {
		flex: 1;
		min-width: 0;
	}

	.result-top {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.result-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.result-badge {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 2px 6px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.result-badge.formula {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.result-badge.cask {
		background: rgba(59, 130, 246, 0.12);
		color: #3b82f6;
	}

	.result-badge.npm {
		background: rgba(249, 115, 22, 0.12);
		color: #f97316;
	}

	.result-badge.tap {
		background: rgba(168, 85, 247, 0.12);
		color: #a855f7;
	}

	.result-desc {
		font-size: 0.74rem;
		color: var(--text-muted);
		line-height: 1.3;
		display: block;
		margin-top: 2px;
	}

	/* Import */
	.import-panel {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.import-error {
		color: var(--danger);
		font-size: 0.82rem;
		padding: 8px 12px;
		background: rgba(239, 68, 68, 0.08);
		border-radius: 6px;
	}

	.import-textarea {
		min-height: 140px;
		padding: 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.82rem;
		resize: vertical;
	}

	.import-textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.import-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	.import-cancel,
	.import-go {
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.import-cancel {
		background: none;
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.import-go {
		background: var(--accent);
		border: none;
		color: #000;
	}

	.import-go:hover {
		background: var(--accent-hover);
	}

	/* Groups */
	.groups {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.group-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin-bottom: 8px;
	}

	.group-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.group-count {
		opacity: 0.5;
		font-weight: 600;
	}

	.group-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.76rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
	}

	.tag:hover {
		border-color: var(--danger);
		color: var(--danger);
	}

	.tag-x {
		font-size: 0.9rem;
		font-weight: 700;
		opacity: 0.4;
		line-height: 1;
	}

	.tag:hover .tag-x {
		opacity: 1;
	}

	.empty-packages {
		text-align: center;
		padding: 24px;
		color: var(--text-muted);
		font-size: 0.85rem;
		background: var(--bg-tertiary);
		border: 1px dashed var(--border);
		border-radius: 12px;
	}

	@media (max-width: 600px) {
		.presets {
			grid-template-columns: 1fr;
		}

		.results {
			grid-template-columns: 1fr;
		}
	}
</style>
