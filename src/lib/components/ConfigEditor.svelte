<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import PackageManager from './PackageManager.svelte';
	import PackageDna from './PackageDna.svelte';
	import SectionNav from './SectionNav.svelte';
	import {
		MACOS_PREF_CATALOG,
		CATALOG_CATEGORIES,
		getCatalogItem,
		type MacOSPrefCatalogItem,
	} from '$lib/macos-prefs-catalog';
	import { PRESET_PACKAGES } from '$lib/presets';
	import ShellEditor from './ShellEditor.svelte';
	import MacOSPreferencesEditor from './MacOSPreferencesEditor.svelte';

	let { slug, skipAuth = false }: { slug?: string; skipAuth?: boolean } = $props();
	const isNew = !slug;

	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let editingConfig = $state<any>(null);
	let initialSnapshot = $state('');
	let rawMode = $state(false);
	let rawJson = $state('');

	function captureSnapshot(): string {
		return JSON.stringify({
			formData,
			packages: [...selectedPackages.entries()].sort(),
			packageDescs: [...packageDescs.entries()].sort(),
			macosPrefs,
		});
	}

	const hasChanges = $derived(isNew || initialSnapshot === '' || captureSnapshot() !== initialSnapshot);
	let showScriptModal = $state(false);
	let scriptDraft = $state('');

	let formData = $state({
		name: '',
		description: '',
		base_preset: 'developer',
		visibility: 'unlisted' as string,
		alias: '',
		custom_script: '',
		dotfiles_repo: '',
	});

	let selectedPackages = $state(new Map<string, string>());
	let packageDescs = $state(new Map<string, string>());

	interface MacOSPref {
		domain: string;
		key: string;
		type: string;
		value: string;
		desc: string;
	}
	let macosPrefs = $state<MacOSPref[]>([]);
	let expandedPrefCats = $state<Set<string>>(new Set());

	const packages = $derived(
		Array.from(selectedPackages.entries()).map(([name, type]) => ({
			name,
			type,
			desc: packageDescs.get(name) || '',
		}))
	);

	const sections = [
		{ id: 'identity', label: 'Identity' },
		{ id: 'stack', label: 'Stack' },
		{ id: 'system', label: 'System' },
		{ id: 'script', label: 'Script' },
	];

	// Gradient from config name (matches ConfigCard)
	const GRADIENTS = [
		'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
		'linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #fbbf24 100%)',
		'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
		'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
		'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)',
		'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f43f5e 100%)',
		'linear-gradient(135deg, #14b8a6 0%, #22c55e 50%, #84cc16 100%)',
		'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%)',
	];
	function hashStr(s: string): number {
		let h = 0;
		for (let i = 0; i < s.length; i++) {
			h = ((h << 5) - h) + s.charCodeAt(i);
			h |= 0;
		}
		return Math.abs(h);
	}
	const editorGradient = $derived(
		formData.name
			? GRADIENTS[hashStr(formData.name) % GRADIENTS.length]
			: GRADIENTS[0]
	);

	const catalogByCategory = $derived.by(() => {
		const map: Record<string, MacOSPrefCatalogItem[]> = {};
		for (const cat of CATALOG_CATEGORIES) {
			map[cat] = MACOS_PREF_CATALOG.filter((i) => i.category === cat);
		}
		return map;
	});

	const addedCountByCategory = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const pref of macosPrefs) {
			const ci = getCatalogItem(pref.domain, pref.key);
			const cat = ci?.category ?? 'Custom';
			counts[cat] = (counts[cat] || 0) + 1;
		}
		return counts;
	});

	const customPrefs = $derived(
		macosPrefs
			.map((p, i) => ({ pref: p, index: i }))
			.filter(({ pref }) => !getCatalogItem(pref.domain, pref.key))
	);

	function initExpandedCats() {
		const cats = new Set<string>();
		for (const pref of macosPrefs) {
			const ci = getCatalogItem(pref.domain, pref.key);
			if (ci) cats.add(ci.category);
		}
		expandedPrefCats = cats.size > 0 ? cats : new Set([CATALOG_CATEGORIES[0]]);
	}

	function initPackagesForPreset(preset: string) {
		const p = PRESET_PACKAGES[preset];
		if (!p) return;
		const newMap = new Map<string, string>();
		for (const pkg of p.cli) newMap.set(pkg, 'formula');
		for (const pkg of p.cask) newMap.set(pkg, 'cask');
		if (p.npm) for (const pkg of p.npm) newMap.set(pkg, 'npm');
		selectedPackages = newMap;
	}

	function handlePresetChange(preset: string) {
		formData.base_preset = preset;
		initPackagesForPreset(preset);
	}

	function togglePackage(name: string, type: string, desc: string = '') {
		const newMap = new Map(selectedPackages);
		const newDescs = new Map(packageDescs);
		if (newMap.has(name)) {
			newMap.delete(name);
			newDescs.delete(name);
		} else {
			newMap.set(name, type);
			if (desc) newDescs.set(name, desc);
		}
		selectedPackages = newMap;
		packageDescs = newDescs;
	}

	function normalizePrefValue(type: string, value: string): string {
		if (type === 'bool') {
			return (value === '1' || value === 'true') ? 'true' : 'false';
		}
		return value;
	}

	onMount(async () => {
		if (!skipAuth) {
			await auth.check();
			if (!$auth.user && !$auth.loading) {
				goto('/login?return_to=/dashboard');
				return;
			}
		}

		if (isNew) {
			const prefill = sessionStorage.getItem('openboot_prefill');
			if (prefill) {
				sessionStorage.removeItem('openboot_prefill');
				try {
					const data = JSON.parse(prefill);
					formData = {
						name: data.name || '',
						description: data.description || '',
						base_preset: data.base_preset || 'developer',
						visibility: data.visibility || 'unlisted',
						alias: '',
						custom_script: data.custom_script || '',
						dotfiles_repo: data.dotfiles_repo || '',
					};
					if (data.packages?.length) {
						const map = new Map<string, string>();
						const descs = new Map<string, string>();
						for (const pkg of data.packages) {
							if (typeof pkg === 'string') {
								map.set(pkg, 'formula');
							} else {
								map.set(pkg.name, pkg.type || 'formula');
								if (pkg.desc) descs.set(pkg.name, pkg.desc);
							}
						}
						selectedPackages = map;
						packageDescs = descs;
					} else {
						initPackagesForPreset(formData.base_preset);
					}
					if (data.snapshot?.macos_prefs) {
						macosPrefs = data.snapshot.macos_prefs.map((p: any) => {
							const type = p.type || '';
							return {
								domain: p.domain || '',
								key: p.key || '',
								type,
								value: normalizePrefValue(type, String(p.value ?? '')),
								desc: p.desc || '',
							};
						});
					}
					initExpandedCats();
				} catch {
					initPackagesForPreset('developer');
				}
			} else {
				initPackagesForPreset('developer');
			}
			loading = false;
		} else {
			try {
				const response = await fetch(`/api/configs/${slug}`);
				const data = await response.json();
				const config = data.config;
				editingConfig = config;
				formData = {
					name: config.name,
					description: config.description || '',
					base_preset: config.base_preset,
					visibility: config.visibility || 'unlisted',
					alias: config.alias || '',
					custom_script: config.custom_script || '',
					dotfiles_repo: config.dotfiles_repo || '',
				};
				macosPrefs = Array.isArray(config.snapshot?.macos_prefs)
					? config.snapshot.macos_prefs.map((p: any) => {
							const type = p.type || '';
							return {
								domain: p.domain || '',
								key: p.key || '',
								type,
								value: normalizePrefValue(type, String(p.value ?? '')),
								desc: p.desc || '',
							};
						})
					: [];
				initExpandedCats();
				const savedPkgs = config.packages || [];
				if (savedPkgs.length > 0) {
					const newMap = new Map<string, string>();
					const newDescs = new Map<string, string>();
					for (const pkg of savedPkgs) {
						if (typeof pkg === 'string') {
							newMap.set(pkg, 'formula');
						} else {
							newMap.set(pkg.name, pkg.type || 'formula');
							if (pkg.desc) newDescs.set(pkg.name, pkg.desc);
						}
					}
					selectedPackages = newMap;
					packageDescs = newDescs;
				} else {
					initPackagesForPreset(config.base_preset);
				}
			} catch {
				error = 'Failed to load configuration';
			}
			initialSnapshot = captureSnapshot();
			loading = false;
		}
	});

	function buildPayload() {
		const existingSnapshot = editingConfig?.snapshot || null;
		const updatedSnapshot =
			existingSnapshot !== null || macosPrefs.length > 0
				? { ...(existingSnapshot || {}), macos_prefs: macosPrefs }
				: null;
		return {
			...formData,
			alias: formData.alias.trim() || null,
			packages: Array.from(selectedPackages.entries()).map(([name, type]) => ({
				name,
				type,
				desc: packageDescs.get(name) || '',
			})),
			snapshot: updatedSnapshot,
		};
	}

	function applyParsed(parsed: any) {
		formData = {
			name: parsed.name || '',
			description: parsed.description || '',
			base_preset: parsed.base_preset || 'developer',
			visibility: parsed.visibility || 'unlisted',
			alias: parsed.alias || '',
			custom_script: parsed.custom_script || '',
			dotfiles_repo: parsed.dotfiles_repo || '',
		};
		const newMap = new Map<string, string>();
		const newDescs = new Map<string, string>();
		for (const pkg of parsed.packages || []) {
			if (typeof pkg === 'string') {
				newMap.set(pkg, 'formula');
			} else {
				newMap.set(pkg.name, pkg.type || 'formula');
				if (pkg.desc) newDescs.set(pkg.name, pkg.desc);
			}
		}
		selectedPackages = newMap;
		packageDescs = newDescs;
		macosPrefs = Array.isArray(parsed.snapshot?.macos_prefs)
			? parsed.snapshot.macos_prefs.map((p: any) => {
					const type = p.type || '';
					return {
						domain: p.domain || '',
						key: p.key || '',
						type,
						value: normalizePrefValue(type, String(p.value ?? '')),
						desc: p.desc || '',
					};
				})
			: [];
		initExpandedCats();
	}

	function enterRawMode() {
		rawJson = JSON.stringify(buildPayload(), null, 2);
		rawMode = true;
		error = '';
	}

	function exitRawMode() {
		try {
			const parsed = JSON.parse(rawJson);
			applyParsed(parsed);
			rawMode = false;
			error = '';
		} catch {
			error = 'Invalid JSON — fix before switching back';
		}
	}

	async function save() {
		let payload: ReturnType<typeof buildPayload> | any;
		if (rawMode) {
			try {
				payload = JSON.parse(rawJson);
			} catch {
				error = 'Invalid JSON';
				return;
			}
			if (!payload.name) {
				error = 'Name is required';
				return;
			}
		} else {
			if (!formData.name) {
				error = 'Name is required';
				return;
			}
			payload = buildPayload();
		}
		saving = true;
		error = '';
		const url = slug ? `/api/configs/${slug}` : '/api/configs';
		const method = slug ? 'PUT' : 'POST';
		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const text = await response.text();
			let result;
			try {
				result = JSON.parse(text);
			} catch {
				error = 'Server error';
				return;
			}
			if (!response.ok) {
				error = result.error || 'Failed to save';
				return;
			}
			goto('/dashboard');
		} catch (e) {
			error = 'Failed to save: ' + (e as Error).message;
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{isNew ? 'New Config' : `Edit ${formData.name}`} - OpenBoot</title>
</svelte:head>

{#if loading}
	<div class="editor-loading">
		<div class="loader"></div>
	</div>
{:else}
	<div class="editor">
		{#if !rawMode}
			<SectionNav {sections} />
		{/if}

		<header class="editor-header">
			<button class="back-btn" onclick={() => goto('/dashboard')}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
				</svg>
				Back
			</button>
			<div class="header-right">
				{#if !rawMode}
					<div class="dna-preview">
						<PackageDna {packages} />
					</div>
				{/if}
				<button
					class="raw-btn"
					class:raw-btn-active={rawMode}
					onclick={() => rawMode ? exitRawMode() : enterRawMode()}
					title={rawMode ? 'Switch to visual editor' : 'Edit raw JSON'}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
					</svg>
					{rawMode ? 'Visual' : 'Raw'}
				</button>
				{#if error}
					<span class="header-error">{error}</span>
				{/if}
				<button class="save-btn" class:save-btn-inactive={!hasChanges} onclick={save} disabled={saving || !hasChanges}>
					{saving ? 'Saving...' : isNew ? 'Create Config' : 'Save Changes'}
				</button>
			</div>
		</header>

		{#if rawMode}
			<div class="raw-editor">
				<div class="raw-hint">Edit the config JSON directly. Switch back to Visual to see your changes reflected in the form.</div>
				<textarea
					class="raw-textarea"
					bind:value={rawJson}
					spellcheck="false"
					autocomplete="off"
					autocapitalize="off"
				></textarea>
			</div>
		{:else}

		<div class="editor-body">
			<!-- IDENTITY -->
			<section class="section" id="identity">
				<div class="identity-hero" style="background: {editorGradient}">
					<div class="identity-glass">
						<input
							class="name-input"
							bind:value={formData.name}
							placeholder="Config name"
						/>
						<input
							class="desc-input"
							bind:value={formData.description}
							placeholder="What's this config for?"
						/>
						<div class="identity-row">
							<div class="vis-pills">
								{#each ['public', 'unlisted', 'private'] as v}
									<button
										class="vis-pill"
										class:active={formData.visibility === v}
										onclick={() => (formData.visibility = v)}
									>
										{v}
									</button>
								{/each}
							</div>
							<div class="alias-field">
								<span class="alias-prefix">openboot.dev/</span>
								<input
									class="alias-input"
									bind:value={formData.alias}
									placeholder="alias"
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- STACK -->
			<section class="section" id="stack">
				<div class="section-top">
					<div class="section-tag">STACK</div>
					<span class="section-count">{selectedPackages.size} packages</span>
				</div>
				<PackageManager
					{selectedPackages}
					{packageDescs}
					basePreset={formData.base_preset}
					{togglePackage}
					onPresetChange={handlePresetChange}
				/>
			</section>

			<!-- SYSTEM -->
			<section class="section" id="system">
				<div class="section-tag">SYSTEM</div>

				<div class="system-dotfiles">
					<span class="dotfiles-label">Dotfiles Repository</span>
					<input
						class="dotfiles-input"
						bind:value={formData.dotfiles_repo}
						placeholder="https://github.com/you/dotfiles"
					/>
					<p class="dotfiles-hint">Cloned & deployed via GNU Stow after install.</p>
				</div>

				<MacOSPreferencesEditor
					bind:macosPrefs
					bind:expandedPrefCats
					{catalogByCategory}
					{addedCountByCategory}
					{customPrefs}
				/>
			</section>

			<!-- SCRIPT -->
			<section class="section" id="script">
				<div class="section-tag">SCRIPT</div>
				<div class="script-card">
					<div class="script-bar">
						<span class="script-filename">post-install.sh</span>
						<button
							class="script-edit-btn"
							type="button"
							onclick={() => { scriptDraft = formData.custom_script; showScriptModal = true; }}
						>
							{formData.custom_script ? 'Edit' : 'Add Script'}
						</button>
					</div>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					{#if formData.custom_script}
						<pre class="script-preview" onclick={() => { scriptDraft = formData.custom_script; showScriptModal = true; }}>{formData.custom_script}</pre>
					{:else}
						<div class="script-empty" onclick={() => { scriptDraft = ''; showScriptModal = true; }}>No post-install script — click to add</div>
					{/if}
				</div>
			</section>
		</div>
		{/if}
	</div>
{/if}

{#if showScriptModal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="script-modal-overlay" onkeydown={(e) => { if (e.key === 'Escape') showScriptModal = false; }}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="script-modal-backdrop" onclick={() => showScriptModal = false}></div>
		<div class="script-modal">
			<div class="script-modal-bar">
				<span class="script-modal-filename">post-install.sh</span>
				<div class="script-modal-actions">
					<button
						type="button"
						class="script-modal-cancel"
						onclick={() => showScriptModal = false}
					>Cancel</button>
					<button
						type="button"
						class="script-modal-save"
						onclick={() => { formData.custom_script = scriptDraft; showScriptModal = false; }}
					>Save</button>
				</div>
			</div>
			<div class="script-modal-body">
				<ShellEditor
					bind:value={scriptDraft}
					placeholder="#!/bin/bash
# Commands to run after package installation

# Example:
# mkdir -p ~/Projects
# npm install -g vercel
# defaults write com.apple.dock autohide -bool true"
				/>
			</div>
			<div class="script-modal-hint">
				Commands run sequentially in your home directory after packages, shell, dotfiles, and macOS preferences are applied.
			</div>
		</div>
	</div>
{/if}

<style>
	.editor-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}

	.loader {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.editor {
		max-width: 820px;
		margin: 0 auto;
		padding: 0 24px 100px;
	}

	/* Header */
	.editor-header {
		position: sticky;
		top: 53px;
		z-index: 40;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
		margin-bottom: 40px;
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border);
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.88rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: color 0.15s;
		padding: 8px 0;
	}

	.back-btn:hover {
		color: var(--text-primary);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.dna-preview {
		opacity: 0.6;
		transition: opacity 0.3s;
	}

	.dna-preview:hover {
		opacity: 1;
	}

	.header-error {
		color: var(--danger);
		font-size: 0.82rem;
		font-weight: 500;
	}

	.save-btn {
		padding: 10px 24px;
		background: var(--accent);
		color: #000;
		border: none;
		border-radius: 10px;
		font-size: 0.88rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.save-btn:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.save-btn-inactive {
		background: var(--border);
		color: var(--text-muted);
	}

	.raw-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: none;
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.raw-btn:hover {
		border-color: var(--text-muted);
		color: var(--text-primary);
	}

	.raw-btn-active {
		border-color: var(--accent);
		color: var(--accent);
	}

	.raw-editor {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-bottom: 100px;
	}

	.raw-hint {
		font-size: 0.80rem;
		color: var(--text-muted);
	}

	.raw-textarea {
		width: 100%;
		min-height: 60vh;
		padding: 16px;
		background: var(--bg-secondary, #111);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 10px;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.82rem;
		line-height: 1.6;
		resize: vertical;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}

	.raw-textarea:focus {
		border-color: var(--accent);
	}

	/* Sections */
	.editor-body {
		display: flex;
		flex-direction: column;
		gap: 56px;
	}

	.section {
		scroll-margin-top: 80px;
	}

	.section-tag {
		font-size: 0.68rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--text-muted);
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.section-tag::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border);
	}

	.section-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.section-top .section-tag {
		margin-bottom: 0;
	}

	.section-count {
		font-size: 0.78rem;
		color: var(--text-muted);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	/* Identity */
	.identity-hero {
		border-radius: 20px;
		padding: 4px;
		transition: background 0.5s;
	}

	.identity-glass {
		background: color-mix(in srgb, var(--bg-primary) 80%, transparent);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 17px;
		padding: 32px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.name-input {
		background: none;
		border: none;
		color: var(--text-primary);
		font-size: 2.2rem;
		font-weight: 800;
		font-family: inherit;
		outline: none;
		padding: 0;
		line-height: 1.2;
		width: 100%;
	}

	.name-input::placeholder {
		color: var(--text-muted);
		opacity: 0.5;
	}

	.desc-input {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 1.05rem;
		font-family: inherit;
		outline: none;
		padding: 0;
		width: 100%;
	}

	.desc-input::placeholder {
		color: var(--text-muted);
		opacity: 0.5;
	}

	.identity-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		margin-top: 12px;
		flex-wrap: wrap;
	}

	.vis-pills {
		display: flex;
		gap: 0;
		border: 1px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
	}

	.vis-pill {
		padding: 8px 16px;
		background: var(--bg-tertiary);
		border: none;
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		text-transform: capitalize;
		transition: all 0.15s;
		border-right: 1px solid var(--border);
	}

	.vis-pill:last-child {
		border-right: none;
	}

	.vis-pill:hover {
		color: var(--text-secondary);
		background: var(--bg-hover);
	}

	.vis-pill.active {
		background: var(--accent);
		color: #000;
	}

	.alias-field {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.alias-prefix {
		color: var(--text-muted);
		font-size: 0.82rem;
		white-space: nowrap;
	}

	.alias-input {
		width: 120px;
		padding: 8px 10px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.82rem;
		font-family: 'JetBrains Mono', monospace;
		outline: none;
		transition: border-color 0.2s;
	}

	.alias-input:focus {
		border-color: var(--accent);
	}

	/* System */
	.system-prefs {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.prefs-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.prefs-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.prefs-count {
		font-size: 0.78rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	/* Accordion */
	.pref-accordion {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.pref-acc-group {
		border-bottom: 1px solid var(--border);
	}

	.pref-acc-group:last-child {
		border-bottom: none;
	}

	.pref-acc-header {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px 14px;
		background: var(--bg-tertiary);
		border: none;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}

	.pref-acc-header:hover {
		background: var(--bg-secondary);
	}

	.pref-acc-header-static {
		cursor: default;
	}

	.pref-acc-header-static:hover {
		background: var(--bg-tertiary);
	}

	.pref-acc-chevron {
		color: var(--text-muted);
		transition: transform 0.15s;
		flex-shrink: 0;
	}

	.pref-acc-chevron-open {
		transform: rotate(90deg);
	}

	.pref-acc-name {
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
	}

	.pref-acc-badge {
		padding: 2px 7px;
		background: var(--accent);
		border-radius: 8px;
		font-size: 0.65rem;
		font-weight: 700;
		color: #000;
		line-height: 1.3;
	}

	.pref-acc-total {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.pref-acc-body {
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	/* Pref rows */
	.pref-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 14px;
		border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
		transition: background 0.1s;
	}

	.pref-row-active {
		background: color-mix(in srgb, var(--accent) 4%, transparent);
	}

	.pref-toggle-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		flex-shrink: 0;
	}

	.pref-check {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px solid var(--border);
		border-radius: 4px;
		font-size: 0.65rem;
		font-weight: 700;
		color: transparent;
		background: var(--bg-secondary);
		transition: all 0.15s;
	}

	.pref-check-on {
		background: var(--accent);
		border-color: var(--accent);
		color: #000;
	}

	.pref-info {
		flex: 1;
		min-width: 0;
	}

	.pref-label {
		font-size: 0.84rem;
		font-weight: 500;
		color: var(--text-primary);
		display: block;
	}

	.pref-meta {
		font-size: 0.7rem;
		color: var(--text-muted);
		display: block;
		line-height: 1.3;
	}

	.pref-control {
		flex-shrink: 0;
	}

	.pref-bool {
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 0.72rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		color: var(--text-muted);
		min-width: 44px;
	}

	.pref-bool.on {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		border-color: var(--accent);
		color: var(--accent);
	}

	.pref-sel {
		padding: 4px 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.78rem;
		font-family: inherit;
		cursor: pointer;
		outline: none;
	}

	.pref-sel:focus {
		border-color: var(--accent);
	}

	.pref-val {
		width: 72px;
		padding: 4px 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.78rem;
		font-family: 'JetBrains Mono', monospace;
		outline: none;
	}

	.pref-val:focus {
		border-color: var(--accent);
	}

	.pref-rm {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.1rem;
		padding: 2px 4px;
		border-radius: 4px;
		transition: color 0.15s;
		line-height: 1;
		flex-shrink: 0;
	}

	.pref-rm:hover {
		color: var(--danger);
	}

	.custom-pref-toggle {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.78rem;
		color: var(--text-muted);
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: color 0.15s;
	}

	.custom-pref-toggle:hover {
		color: var(--text-secondary);
	}

	.custom-pref-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.custom-pref-input {
		flex: 1;
		padding: 10px 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.82rem;
		font-family: 'JetBrains Mono', monospace;
		outline: none;
	}

	.custom-pref-input:focus {
		border-color: var(--accent);
	}

	.custom-pref-type {
		padding: 10px 8px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.78rem;
		font-family: inherit;
		cursor: pointer;
		outline: none;
	}

	.custom-pref-add {
		padding: 10px 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.82rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.custom-pref-add:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.pref-error {
		font-size: 0.78rem;
		color: var(--danger);
	}

	.pref-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
	}

	/* Dotfiles */
	.system-dotfiles {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 20px 24px;
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}

	.dotfiles-label {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.dotfiles-input {
		flex: 1;
		min-width: 200px;
		padding: 10px 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.85rem;
		font-family: inherit;
		outline: none;
	}

	.dotfiles-input:focus {
		border-color: var(--accent);
	}

	.dotfiles-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.4;
	}

	/* Script */
	.script-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
	}

	.script-bar {
		padding: 12px 18px;
		background: var(--bg-tertiary);
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.script-filename {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.script-edit-btn {
		padding: 5px 14px;
		background: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--accent);
		font-size: 0.8rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.script-edit-btn:hover {
		border-color: var(--accent);
		background: rgba(34, 197, 94, 0.08);
	}

	.script-preview {
		padding: 16px 20px;
		margin: 0;
		color: var(--text-secondary);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.82rem;
		line-height: 1.7;
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 160px;
		overflow: hidden;
		cursor: pointer;
	}

	.script-empty {
		padding: 24px 20px;
		color: var(--text-muted);
		font-size: 0.85rem;
		text-align: center;
		cursor: pointer;
	}

	.script-empty:hover {
		color: var(--text-secondary);
	}

	/* Script modal */
	.script-modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
	}

	.script-modal-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
	}

	.script-modal {
		position: relative;
		width: 100%;
		max-width: 860px;
		height: 80vh;
		max-height: 700px;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
	}

	.script-modal-bar {
		padding: 14px 20px;
		background: var(--bg-tertiary);
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.script-modal-filename {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.script-modal-actions {
		display: flex;
		gap: 8px;
	}

	.script-modal-cancel {
		padding: 6px 16px;
		background: none;
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.82rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.script-modal-cancel:hover {
		border-color: var(--text-muted);
	}

	.script-modal-save {
		padding: 6px 16px;
		background: var(--accent);
		border: none;
		border-radius: 8px;
		color: #000;
		font-size: 0.82rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.script-modal-save:hover {
		opacity: 0.9;
	}

	.script-modal-body {
		flex: 1;
		overflow: hidden;
	}


	.script-modal-hint {
		padding: 10px 20px;
		background: var(--bg-tertiary);
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.75rem;
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.editor {
			padding: 0 16px 80px;
		}

		.name-input {
			font-size: 1.4rem;
		}

		.identity-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.editor-header {
			flex-wrap: wrap;
			gap: 12px;
		}

		.dna-preview {
			display: none;
		}
	}
</style>
