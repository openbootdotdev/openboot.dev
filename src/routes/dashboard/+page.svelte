<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Button from '$lib/components/Button.svelte';
	import { auth } from '$lib/stores/auth';
	import { PRESET_PACKAGES, getPresetPackages } from '$lib/presets';

	interface Config {
		id: string;
		slug: string;
		name: string;
		description: string;
		base_preset: string;
		is_public: number;
		alias: string | null;
		packages?: any[];
		custom_script?: string;
		dotfiles_repo?: string;
		updated_at?: string;
	}

	let copiedId = $state('');

	let configs = $state<Config[]>([]);
	let loading = $state(true);
	let showModal = $state(false);
	let editingSlug = $state('');
	let saving = $state(false);
	let error = $state('');
	let toast = $state('');

	let formData = $state({
		name: '',
		description: '',
		base_preset: 'developer',
		is_public: true,
		alias: '',
		packages: [] as string[],
		custom_script: '',
		dotfiles_repo: ''
	});

	interface SearchResult {
		name: string;
		desc: string;
		type: 'formula' | 'cask' | 'tap' | 'npm';
	}

	let selectedPackages = $state(new Map<string, string>());
	let presetExpanded = $state(false);
	let packageSearch = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searchLoading = $state(false);
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	let npmSearch = $state('');
	let npmSearchResults = $state<SearchResult[]>([]);
	let npmSearchLoading = $state(false);
	let npmSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	let showImportModal = $state(false);
	let brewfileContent = $state('');
	let importLoading = $state(false);
	let importError = $state('');

	function isTapPackage(query: string): boolean {
		return /^[a-z0-9_-]+\/[a-z0-9_-]+\/[a-z0-9_-]+$/i.test(query);
	}

	async function searchHomebrew(query: string) {
		if (query.length < 2) {
			searchResults = [];
			return;
		}

		searchLoading = true;
		try {
			const response = await fetch(`/api/homebrew/search?q=${encodeURIComponent(query)}`);
			const data = await response.json();
			searchResults = data.results || [];

			if (isTapPackage(query) && !searchResults.some(r => r.name === query)) {
				searchResults.unshift({
					name: query,
					desc: 'Third-party tap package (will add tap automatically)',
					type: 'tap' as const
				});
			}
		} catch (e) {
			console.error('Search failed:', e);
			searchResults = [];
			if (isTapPackage(query)) {
				searchResults = [{
					name: query,
					desc: 'Third-party tap package (will add tap automatically)',
					type: 'tap' as const
				}];
			}
		} finally {
			searchLoading = false;
		}
	}

	function handleSearchInput(value: string) {
		packageSearch = value;
		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
		}
		if (value.length < 2) {
			searchResults = [];
			return;
		}
		searchDebounceTimer = setTimeout(() => {
			searchHomebrew(value);
		}, 300);
	}

	async function searchNpm(query: string) {
		if (query.length < 2) {
			npmSearchResults = [];
			return;
		}

		npmSearchLoading = true;
		try {
			const response = await fetch(`/api/npm/search?q=${encodeURIComponent(query)}`);
			const data = await response.json();
			npmSearchResults = data.results || [];
		} catch (e) {
			console.error('npm search failed:', e);
			npmSearchResults = [];
		} finally {
			npmSearchLoading = false;
		}
	}

	function handleNpmSearchInput(value: string) {
		npmSearch = value;
		if (npmSearchDebounceTimer) {
			clearTimeout(npmSearchDebounceTimer);
		}
		if (value.length < 2) {
			npmSearchResults = [];
			return;
		}
		npmSearchDebounceTimer = setTimeout(() => {
			searchNpm(value);
		}, 300);
	}

	function getExtraPackages(): string[] {
		const presetPkgs = new Set(getPresetPackages(formData.base_preset));
		return Array.from(selectedPackages.keys()).filter((pkg) => !presetPkgs.has(pkg));
	}

	function getGroupedPackages(): { cli: string[]; apps: string[]; npm: string[] } {
		const cli: string[] = [];
		const apps: string[] = [];
		const npm: string[] = [];
		for (const [pkg, t] of selectedPackages) {
			if (t === 'cask') apps.push(pkg);
			else if (t === 'npm') npm.push(pkg);
			else cli.push(pkg);
		}
		return { cli, apps, npm };
	}



	function initPackagesForPreset(preset: string) {
		const p = PRESET_PACKAGES[preset];
		if (!p) return;
		const newMap = new Map<string, string>();
		for (const pkg of p.cli) {
			newMap.set(pkg, 'formula');
		}
		for (const pkg of p.cask) {
			newMap.set(pkg, 'cask');
		}
		if (p.npm) {
			for (const pkg of p.npm) {
				newMap.set(pkg, 'npm');
			}
		}
		selectedPackages = newMap;
	}

	function handlePresetChange(newPreset: string) {
		formData.base_preset = newPreset;
		initPackagesForPreset(newPreset);
	}

	function togglePresetPackage(pkg: string) {
		const newMap = new Map(selectedPackages);
		if (newMap.has(pkg)) {
			newMap.delete(pkg);
		} else {
			newMap.set(pkg, 'formula');
		}
		selectedPackages = newMap;
	}

	onMount(async () => {
		await auth.check();
		if (!$auth.user && !$auth.loading) {
			goto('/api/auth/login');
			return;
		}
		await loadConfigs();
	});

	async function loadConfigs() {
		try {
			const response = await fetch('/api/configs');
			if (response.ok) {
				const data = await response.json();
				configs = data.configs;
			}
		} catch (e) {
			console.error('Failed to load configs:', e);
		} finally {
			loading = false;
		}
	}

	function openModal(config?: Config) {
		presetExpanded = false;
		if (config) {
			editingSlug = config.slug;
			formData = {
				name: config.name,
				description: config.description || '',
				base_preset: config.base_preset,
				is_public: config.is_public === 1,
				alias: config.alias || '',
				packages: config.packages || [],
				custom_script: config.custom_script || '',
				dotfiles_repo: config.dotfiles_repo || ''
			};
		const savedPkgs = config.packages || [];
		if (savedPkgs.length > 0) {
			const newMap = new Map<string, string>();
			for (const pkg of savedPkgs) {
				if (typeof pkg === 'string') {
					newMap.set(pkg, 'formula');
				} else {
					newMap.set((pkg as any).name, (pkg as any).type || 'formula');
				}
			}
			selectedPackages = newMap;
		} else {
			initPackagesForPreset(config.base_preset);
		}
		} else {
			editingSlug = '';
			formData = {
				name: '',
				description: '',
				base_preset: 'developer',
				is_public: true,
				alias: '',
				packages: [],
				custom_script: '',
				dotfiles_repo: ''
			};
			initPackagesForPreset('developer');
		}
		error = '';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	function togglePackage(pkg: string, type: string = 'formula') {
		const newMap = new Map(selectedPackages);
		if (newMap.has(pkg)) {
			newMap.delete(pkg);
		} else {
			newMap.set(pkg, type);
		}
		selectedPackages = newMap;
		formData.packages = Array.from(newMap.keys());
	}

	async function saveConfig() {
		if (!formData.name) {
			error = 'Name is required';
			return;
		}

		saving = true;
		error = '';

		const url = editingSlug ? `/api/configs/${editingSlug}` : '/api/configs';
		const method = editingSlug ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					alias: formData.alias.trim() || null,
					packages: Array.from(selectedPackages.entries()).map(([name, type]) => ({ name, type }))
				})
			});

			const text = await response.text();
			let result;
			try {
				result = JSON.parse(text);
			} catch {
				error = 'Server error: ' + text.substring(0, 200);
				return;
			}

			if (!response.ok) {
				error = result.error || 'Failed to save';
				return;
			}

			closeModal();
			await loadConfigs();
		} catch (e) {
			error = 'Failed to save: ' + (e as Error).message;
		} finally {
			saving = false;
		}
	}

	async function deleteConfig(slug: string) {
		if (!confirm('Are you sure you want to delete this configuration?')) return;

		try {
			await fetch(`/api/configs/${slug}`, { method: 'DELETE' });
			await loadConfigs();
		} catch (e) {
			alert('Failed to delete configuration');
		}
	}

	async function editConfig(slug: string) {
		try {
			const response = await fetch(`/api/configs/${slug}`);
			const data = await response.json();
			openModal(data.config);
		} catch (e) {
			alert('Failed to load configuration');
		}
	}

	async function duplicateConfig(slug: string) {
		try {
			const response = await fetch(`/api/configs/${slug}`);
			const data = await response.json();
			const source = data.config;
			openModal({
				...source,
				id: '',
				slug: '',
				name: source.name + ' (Copy)',
				alias: null
			});
			editingSlug = '';
		} catch (e) {
			alert('Failed to duplicate configuration');
		}
	}

	function copyToClipboard(text: string, configId: string) {
		navigator.clipboard.writeText(text);
		copiedId = configId;
		setTimeout(() => copiedId = '', 2000);
	}

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr + 'Z');
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getInstallUrl(config: Config): string {
		if (config.alias) {
			return `openboot.dev/${config.alias}`;
		}
		return `openboot.dev/${$auth.user?.username}/${config.slug}/install`;
	}

	async function importBrewfile() {
		if (!brewfileContent.trim()) {
			importError = 'Please paste your Brewfile content';
			return;
		}

		importLoading = true;
		importError = '';

		try {
			const response = await fetch('/api/brewfile/parse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: brewfileContent })
			});

			const data = await response.json();

			if (!response.ok) {
				importError = data.error || 'Failed to parse Brewfile';
				return;
			}

			if (data.packages.length === 0) {
				importError = 'No packages found in Brewfile';
				return;
			}

			showImportModal = false;
			brewfileContent = '';

			formData = {
				name: 'Imported Config',
				description: `Imported from Brewfile (${data.packages.length} packages)`,
				base_preset: 'minimal',
				is_public: true,
				alias: '',
				packages: data.packages,
				custom_script: '',
				dotfiles_repo: ''
			};
			const caskSet = new Set<string>(data.casks || []);
			const importMap = new Map<string, string>();
			for (const pkg of data.packages) {
				importMap.set(pkg, caskSet.has(pkg) ? 'cask' : 'formula');
			}
			selectedPackages = importMap;
			showModal = true;
		} catch (e) {
			importError = 'Failed to parse Brewfile';
		} finally {
			importLoading = false;
		}
	}

	function shareConfig(config: Config) {
		const configUrl = `https://openboot.dev/${$auth.user?.username}/${config.slug}`;
		const text = `My dev stack: ${config.name} — set up in minutes with @openbootdotdev`;
		const hashtags = 'OpenBoot,macOS,DevTools';
		const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(configUrl)}&hashtags=${encodeURIComponent(hashtags)}`;
		window.open(tweetUrl, '_blank', 'width=550,height=420');
	}
</script>

<svelte:head>
	<title>Dashboard - OpenBoot</title>
</svelte:head>

<header class="header">
	<a href="/" class="logo">OpenBoot</a>
	<div class="user-info">
		<ThemeToggle />
		<span class="username">@{$auth.user?.username || '...'}</span>
		<Button href="/api/auth/logout" variant="ghost">Logout</Button>
	</div>
</header>

<main class="container">
	{#if loading}
		<div class="loading">Loading...</div>
	{:else}
		<div class="page-header">
			<div>
				<h1 class="page-title">My Configurations</h1>
				<p class="page-subtitle">Create custom install configs for different teams or projects</p>
			</div>
			<div class="header-actions">
				<Button variant="secondary" onclick={() => showImportModal = true}>Import Brewfile</Button>
				<Button variant="primary" onclick={() => openModal()}>+ New Config</Button>
			</div>
		</div>

		{#if configs.length === 0}
			<div class="empty-state">
				<h3>No configurations yet</h3>
				<p>Create your first config to get a custom install URL.</p>
			</div>
		{:else}
			<div class="configs-grid">
				{#each configs as config}
					<div class="config-card" onclick={() => editConfig(config.slug)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && editConfig(config.slug)}>
						<div class="config-header">
							<div>
								<div class="config-name">{config.name}</div>
								<div class="config-slug">
									{#if config.alias}
										<span class="alias">/{config.alias}</span>
									{:else}
										/{config.slug}
									{/if}
								</div>
							</div>
							<span class="badge" class:public={config.is_public} class:private={!config.is_public}>
								{config.is_public ? 'Public' : 'Private'}
							</span>
						</div>
						{#if config.description}
							<p class="config-description">{config.description}</p>
						{/if}
						<div class="config-meta">
							<span class="config-meta-item">Preset: <strong>{config.base_preset}</strong></span>
							{#if config.updated_at}
								<span class="config-meta-item">Modified: <strong>{formatDate(config.updated_at)}</strong></span>
							{/if}
						</div>
						<div class="config-url" onclick={(e) => e.stopPropagation()}>
							<code>curl -fsSL {getInstallUrl(config)} | bash</code>
							<button class="copy-btn" onclick={() => copyToClipboard(`curl -fsSL https://${getInstallUrl(config)} | bash`, config.id)}>{copiedId === config.id ? 'Copied!' : 'Copy'}</button>
						</div>
						<div class="config-actions" onclick={(e) => e.stopPropagation()}>
							<Button variant="secondary" onclick={() => editConfig(config.slug)}>Edit</Button>
							<Button variant="secondary" onclick={() => duplicateConfig(config.slug)}>Duplicate</Button>
							<Button variant="secondary" onclick={() => shareConfig(config)}>Share</Button>
							<Button variant="danger" onclick={() => deleteConfig(config.slug)}>Delete</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</main>

{#if showModal}
	<div class="modal-overlay" onclick={closeModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3 class="modal-title">{editingSlug ? 'Edit Configuration' : 'New Configuration'}</h3>
				<button class="close-btn" onclick={closeModal}>&times;</button>
			</div>
			<div class="modal-body">
				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<div class="form-group">
					<label class="form-label">Name</label>
					<input type="text" class="form-input" bind:value={formData.name} placeholder="e.g. Frontend Team" />
					<p class="form-hint">Will be used as the URL slug</p>
				</div>

				<div class="form-group">
					<label class="form-label">Description</label>
					<input type="text" class="form-input" bind:value={formData.description} placeholder="Optional description" />
				</div>

				<div class="form-group">
					<label class="form-label">Base Preset</label>
					<select class="form-select" onchange={(e) => handlePresetChange(e.currentTarget.value)} value={formData.base_preset}>
						<option value="minimal">minimal - CLI essentials</option>
						<option value="developer">developer - Ready-to-code setup</option>
						<option value="full">full - Complete dev environment</option>
					</select>
				</div>

				<div class="form-group">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={formData.is_public} />
						<span>Public (anyone can use this install URL)</span>
					</label>
				</div>

				<div class="form-group">
					<label class="form-label">Short Alias (Optional)</label>
					<div class="alias-input">
						<span class="alias-prefix">openboot.dev/</span>
						<input type="text" class="form-input" bind:value={formData.alias} placeholder="e.g. myteam" />
					</div>
					<p class="form-hint">2-20 characters, lowercase letters, numbers, and dashes only.</p>
				</div>

				<div class="form-group">
					<label class="form-label">Dotfiles Repository (Optional)</label>
					<input type="text" class="form-input" bind:value={formData.dotfiles_repo} placeholder="https://github.com/username/dotfiles" />
					<p class="form-hint">After installing packages, OpenBoot will clone this repo and deploy configs via stow.</p>
				</div>

				{#if true}
			{@const grouped = getGroupedPackages()}
			<div class="packages-section">
				<div class="packages-header">
					<span class="packages-title">Packages</span>
					<span class="extra-count">{selectedPackages.size} selected</span>
				</div>

				<div class="packages-group">
					<div class="group-header">
						<span class="group-label">CLI</span>
						<span class="group-count">{grouped.cli.length}</span>
					</div>
					<div class="group-tags">
						{#each grouped.cli as pkg}
							<button type="button" class="pkg-tag" onclick={() => togglePackage(pkg, 'formula')}>
								{pkg}<span class="remove-icon">×</span>
							</button>
						{/each}
						{#if grouped.cli.length === 0}
							<span class="group-empty">No CLI packages</span>
						{/if}
					</div>
				</div>

				<div class="packages-group">
					<div class="group-header">
						<span class="group-label">Apps</span>
						<span class="group-count">{grouped.apps.length}</span>
					</div>
					<div class="group-tags">
						{#each grouped.apps as pkg}
							<button type="button" class="pkg-tag" onclick={() => togglePackage(pkg, 'cask')}>
								{pkg}<span class="remove-icon">×</span>
							</button>
						{/each}
						{#if grouped.apps.length === 0}
							<span class="group-empty">No GUI apps</span>
						{/if}
					</div>
				</div>

				<div class="packages-search">
					<input 
						type="text" 
						class="search-input" 
						value={packageSearch}
						oninput={(e) => handleSearchInput(e.currentTarget.value)}
						placeholder="Search Homebrew packages or enter tap (e.g. steipete/tap/codexbar)" 
					/>
				</div>
				{#if searchLoading}
					<div class="search-status">Searching Homebrew...</div>
				{:else if packageSearch.length >= 2 && searchResults.length === 0}
					<div class="search-status">No Homebrew packages found for "{packageSearch}"</div>
				{:else if packageSearch.length >= 2}
					<div class="packages-grid">
						{#each searchResults as result}
							<button type="button" class="package-item" class:selected={selectedPackages.has(result.name)} onclick={() => togglePackage(result.name, result.type)}>
								<span class="check-indicator">{selectedPackages.has(result.name) ? '✓' : ''}</span>
								<div class="package-content">
									<div class="package-info">
										<span class="package-name">{result.name}</span>
										<span class="package-type">{result.type}</span>
									</div>
									{#if result.desc}
										<span class="package-desc">{result.desc.slice(0, 60)}{result.desc.length > 60 ? '...' : ''}</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<div class="search-hint">Type at least 2 characters to search Homebrew packages</div>
				{/if}

				<div class="packages-group">
					<div class="group-header">
						<span class="group-label">NPM</span>
						<span class="group-count">{grouped.npm.length}</span>
					</div>
					<div class="group-tags">
						{#each grouped.npm as pkg}
							<button type="button" class="pkg-tag" onclick={() => togglePackage(pkg, 'npm')}>
								{pkg}<span class="remove-icon">×</span>
							</button>
						{/each}
						{#if grouped.npm.length === 0}
							<span class="group-empty">No npm packages</span>
						{/if}
					</div>
					<div class="packages-search">
						<input 
							type="text" 
							class="search-input" 
							value={npmSearch}
							oninput={(e) => handleNpmSearchInput(e.currentTarget.value)}
							placeholder="Search npm packages (e.g. typescript, eslint)" 
						/>
					</div>
					{#if npmSearchLoading}
						<div class="search-status">Searching npm...</div>
					{:else if npmSearch.length >= 2 && npmSearchResults.length === 0}
						<div class="search-status">No npm packages found for "{npmSearch}"</div>
					{:else if npmSearch.length >= 2}
						<div class="packages-grid">
							{#each npmSearchResults as result}
								<button type="button" class="package-item" class:selected={selectedPackages.has(result.name)} onclick={() => togglePackage(result.name, 'npm')}>
									<span class="check-indicator">{selectedPackages.has(result.name) ? '✓' : ''}</span>
									<div class="package-content">
										<div class="package-info">
											<span class="package-name">{result.name}</span>
											<span class="package-type">npm</span>
										</div>
										{#if result.desc}
											<span class="package-desc">{result.desc.slice(0, 60)}{result.desc.length > 60 ? '...' : ''}</span>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{:else}
						<div class="search-hint">Type at least 2 characters to search npm packages</div>
					{/if}
				</div>
			</div>
			{/if}

				<div class="form-group">
					<label class="form-label">Custom Post-Install Script (Optional)</label>
					<textarea class="form-textarea" bind:value={formData.custom_script} placeholder="#!/bin/bash&#10;# Commands to run after installation"></textarea>
				</div>
			</div>
			<div class="modal-footer">
				<Button variant="secondary" onclick={closeModal}>Cancel</Button>
				<Button variant="primary" onclick={saveConfig}>{saving ? 'Saving...' : 'Save'}</Button>
			</div>
		</div>
	</div>
{/if}

{#if showImportModal}
	<div class="modal-overlay" onclick={() => showImportModal = false}>
		<div class="modal import-modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3 class="modal-title">Import Brewfile</h3>
				<button class="close-btn" onclick={() => showImportModal = false}>&times;</button>
			</div>
			<div class="modal-body">
				{#if importError}
					<div class="error-message">{importError}</div>
				{/if}

				<div class="form-group">
					<label class="form-label">Paste your Brewfile content</label>
					<textarea
						class="form-textarea brewfile-input"
						bind:value={brewfileContent}
						placeholder={'tap "homebrew/cask"\nbrew "git"\nbrew "node"\ncask "visual-studio-code"\ncask "docker"'}
					></textarea>
					<p class="form-hint">Supports tap, brew, and cask entries</p>
				</div>
			</div>
			<div class="modal-footer">
				<Button variant="secondary" onclick={() => showImportModal = false}>Cancel</Button>
				<Button variant="primary" onclick={importBrewfile}>{importLoading ? 'Parsing...' : 'Import'}</Button>
			</div>
		</div>
	</div>
{/if}

{#if toast}
	<div class="toast">{toast}</div>
{/if}

<style>
	.header {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		padding: 16px 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--accent);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.username {
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 40px 24px;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 60px;
		color: var(--text-muted);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32px;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.page-subtitle {
		color: var(--text-secondary);
		font-size: 0.95rem;
		margin-top: 4px;
	}

	.header-actions {
		display: flex;
		gap: 8px;
	}

	.import-modal {
		max-width: 500px;
	}

	.brewfile-input {
		min-height: 200px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: var(--text-secondary);
	}

	.empty-state h3 {
		font-size: 1.25rem;
		margin-bottom: 8px;
		color: var(--text-primary);
	}

	.configs-grid {
		display: grid;
		gap: 16px;
	}

	.config-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		transition: all 0.2s;
		cursor: pointer;
	}

	.config-card:hover {
		border-color: var(--border-hover);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.config-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.config-name {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.config-slug {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.config-slug .alias {
		color: var(--accent);
	}

	.config-description {
		color: var(--text-secondary);
		font-size: 0.9rem;
		margin-bottom: 16px;
	}

	.config-meta {
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
	}

	.config-meta-item {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.config-meta-item strong {
		color: var(--text-secondary);
	}

	.config-url {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		gap: 12px;
	}

	.config-url code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--accent);
		word-break: break-all;
	}

	.copy-btn {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.copy-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}

	.config-actions {
		display: flex;
		gap: 8px;
	}

	.badge {
		display: inline-block;
		padding: 2px 8px;
		font-size: 0.7rem;
		border-radius: 4px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.badge.public {
		background: rgba(34, 197, 94, 0.2);
		color: var(--accent);
	}

	.badge.private {
		background: rgba(239, 68, 68, 0.2);
		color: var(--danger);
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px 8px;
	}

	.close-btn:hover {
		color: var(--text-primary);
	}

	.modal-body {
		padding: 24px;
	}

	.modal-footer {
		padding: 16px 24px;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--danger);
		color: var(--danger);
		padding: 12px;
		border-radius: 8px;
		margin-bottom: 16px;
		font-size: 0.9rem;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-label {
		display: block;
		font-size: 0.9rem;
		font-weight: 500;
		margin-bottom: 8px;
		color: var(--text-secondary);
	}

	.form-input,
	.form-select,
	.form-textarea {
		width: 100%;
		padding: 10px 14px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.95rem;
		font-family: inherit;
	}

	.form-input:focus,
	.form-select:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.form-textarea {
		min-height: 120px;
		resize: vertical;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
	}

	.form-hint {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 6px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.checkbox-label input {
		width: 16px;
		height: 16px;
		accent-color: var(--accent);
	}

	.alias-input {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.alias-prefix {
		color: var(--text-muted);
		white-space: nowrap;
	}

	.packages-section {
		margin-top: 24px;
	}

	.packages-search {
		margin-bottom: 12px;
	}

	.search-input {
		width: 100%;
		padding: 10px 14px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-family: inherit;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}



	.packages-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.packages-title {
		font-size: 1rem;
		font-weight: 500;
	}

	.extra-count {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.packages-group {
		margin-bottom: 16px;
	}

	.packages-group:last-child {
		margin-bottom: 0;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.group-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		font-weight: 600;
	}

	.group-count {
		font-size: 0.65rem;
		color: var(--text-muted);
		opacity: 0.6;
	}

	.group-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.group-empty {
		font-size: 0.8rem;
		color: var(--text-muted);
		opacity: 0.4;
	}

	.pkg-tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		border-radius: 4px;
		font-size: 0.75rem;
		font-family: 'JetBrains Mono', monospace;
		cursor: pointer;
		transition: all 0.15s;
	}

	.pkg-tag:hover {
		border-color: var(--danger);
		color: var(--danger);
	}

	.remove-icon {
		font-size: 0.9rem;
		font-weight: bold;
		opacity: 0.5;
	}

	.pkg-tag:hover .remove-icon {
		opacity: 1;
	}

	.search-status,
	.search-hint {
		text-align: center;
		color: var(--text-muted);
		padding: 20px;
		font-size: 0.9rem;
	}

	.packages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 8px;
		max-height: 300px;
		overflow-y: auto;
		padding: 4px;
	}

	.package-item {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 10px;
		padding: 10px 12px;
		background: var(--bg-tertiary);
		border: 2px solid var(--border);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.package-item:hover {
		border-color: var(--border-hover);
		background: var(--bg-secondary);
	}

	.package-item.selected {
		background: rgba(34, 197, 94, 0.15);
		border-color: var(--accent);
	}

	.package-item {
		text-align: left;
		font-family: inherit;
	}

	.check-indicator {
		width: 20px;
		height: 20px;
		min-width: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--border);
		border-radius: 4px;
		font-size: 0.75rem;
		color: var(--accent);
		background: var(--bg-tertiary);
	}

	.package-item.selected .check-indicator {
		background: var(--accent);
		border-color: var(--accent);
		color: #000;
	}

	.package-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.package-info {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
	}

	.package-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.package-type {
		font-size: 0.65rem;
		padding: 2px 6px;
		background: var(--bg-secondary);
		border-radius: 3px;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.package-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.3;
	}

	@media (max-width: 600px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.config-actions {
			flex-wrap: wrap;
		}

		.packages-grid {
			grid-template-columns: 1fr;
		}
	}

	.toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%) translateY(0);
		background: #22c55e;
		color: #000;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.9rem;
		box-shadow: 0 4px 24px rgba(34, 197, 94, 0.3), 0 2px 8px rgba(0, 0, 0, 0.4);
		z-index: 9999;
		animation: toastIn 0.3s ease-out;
	}

	@keyframes toastIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
