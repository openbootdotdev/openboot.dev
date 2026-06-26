<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import PackageManager from './PackageManager.svelte';
	import MacOSPreferencesEditor from './MacOSPreferencesEditor.svelte';
	import { PRESET_PACKAGES } from '$lib/presets';

	let { slug, skipAuth = false }: { slug?: string; skipAuth?: boolean } = $props();
	const isNew = !slug;

	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let editingConfig = $state<any>(null);
	let initialSnapshot = $state('');
	let initialPayload: any = null;
	let rawMode = $state(false);
	let rawJson = $state('');

	let formData = $state({
		name: '',
		description: '',
		base_preset: 'developer',
		visibility: 'unlisted' as string,
		alias: '',
		custom_script: '',
		dotfiles_repo: ''
	});

	let selectedPackages = $state(new Map<string, string>());
	let packageDescs = $state(new Map<string, string>());

	function pkgKey(name: string, type: string): string {
		return `${type}:${name}`;
	}

	interface MacOSPref {
		domain: string;
		key: string;
		type: string;
		value: string;
		desc: string;
		host?: string;
	}
	let macosPrefs = $state<MacOSPref[]>([]);

	const scriptPlaceholder =
		'#!/usr/bin/env bash\n# Runs after packages, shell, dotfiles, and macOS prefs.\n\n# npm install -g pnpm vercel\n# git config --global pull.rebase true';

	function captureSnapshot(): string {
		return JSON.stringify({
			formData,
			packages: [...selectedPackages.entries()].sort(),
			packageDescs: [...packageDescs.entries()].sort(),
			macosPrefs
		});
	}

	const dirty = $derived(initialSnapshot !== '' && captureSnapshot() !== initialSnapshot);
	const canSave = $derived(isNew || dirty || rawMode);

	function initPackagesForPreset(preset: string) {
		const p = PRESET_PACKAGES[preset];
		if (!p) return;
		const newMap = new Map<string, string>();
		for (const pkg of p.cli) newMap.set(pkgKey(pkg, 'formula'), 'formula');
		for (const pkg of p.cask) newMap.set(pkgKey(pkg, 'cask'), 'cask');
		if (p.npm) for (const pkg of p.npm) newMap.set(pkgKey(pkg, 'npm'), 'npm');
		selectedPackages = newMap;
	}

	function handlePresetChange(preset: string) {
		formData.base_preset = preset;
		if (preset === 'scratch') {
			selectedPackages = new Map();
			packageDescs = new Map();
		} else {
			initPackagesForPreset(preset);
		}
	}

	function togglePackage(name: string, type: string, desc: string = '') {
		const key = pkgKey(name, type);
		const newMap = new Map(selectedPackages);
		const newDescs = new Map(packageDescs);
		if (newMap.has(key)) {
			newMap.delete(key);
			newDescs.delete(key);
		} else {
			newMap.set(key, type);
			if (desc) newDescs.set(key, desc);
		}
		selectedPackages = newMap;
		packageDescs = newDescs;
	}

	function normalizePrefValue(type: string, value: string): string {
		if (type === 'bool') return value === '1' || value === 'true' ? 'true' : 'false';
		return value;
	}

	function mapPrefs(raw: any[]): MacOSPref[] {
		return raw.map((p: any) => {
			const type = p.type || '';
			const out: MacOSPref = {
				domain: p.domain || '',
				key: p.key || '',
				type,
				value: normalizePrefValue(type, String(p.value ?? '')),
				desc: p.desc || ''
			};
			if (typeof p.host === 'string' && p.host !== '') out.host = p.host;
			return out;
		});
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
						dotfiles_repo: data.dotfiles_repo || ''
					};
					if (data.packages?.length) {
						const map = new Map<string, string>();
						const descs = new Map<string, string>();
						for (const pkg of data.packages) {
							if (typeof pkg === 'string') {
								map.set(pkgKey(pkg, 'formula'), 'formula');
							} else {
								const t = pkg.type || 'formula';
								const k = pkgKey(pkg.name, t);
								map.set(k, t);
								if (pkg.desc) descs.set(k, pkg.desc);
							}
						}
						selectedPackages = map;
						packageDescs = descs;
					} else {
						initPackagesForPreset(formData.base_preset);
					}
					if (data.snapshot?.macos_prefs) macosPrefs = mapPrefs(data.snapshot.macos_prefs);
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
					dotfiles_repo: config.dotfiles_repo || ''
				};
				macosPrefs = Array.isArray(config.snapshot?.macos_prefs)
					? mapPrefs(config.snapshot.macos_prefs)
					: [];
				const savedPkgs = config.packages || [];
				if (savedPkgs.length > 0) {
					const newMap = new Map<string, string>();
					const newDescs = new Map<string, string>();
					for (const pkg of savedPkgs) {
						if (typeof pkg === 'string') {
							newMap.set(pkgKey(pkg, 'formula'), 'formula');
						} else {
							const t = pkg.type || 'formula';
							const k = pkgKey(pkg.name, t);
							newMap.set(k, t);
							if (pkg.desc) newDescs.set(k, pkg.desc);
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
			loading = false;
		}

		initialPayload = JSON.parse(JSON.stringify(buildPayload()));
		initialSnapshot = captureSnapshot();
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
			packages: Array.from(selectedPackages.entries()).map(([key, type]) => {
				const name = key.slice(type.length + 1);
				return { name, type, desc: packageDescs.get(key) || '' };
			}),
			snapshot: updatedSnapshot
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
			dotfiles_repo: parsed.dotfiles_repo || ''
		};
		const newMap = new Map<string, string>();
		const newDescs = new Map<string, string>();
		for (const pkg of parsed.packages || []) {
			if (typeof pkg === 'string') {
				newMap.set(pkgKey(pkg, 'formula'), 'formula');
			} else {
				const t = pkg.type || 'formula';
				const k = pkgKey(pkg.name, t);
				newMap.set(k, t);
				if (pkg.desc) newDescs.set(k, pkg.desc);
			}
		}
		selectedPackages = newMap;
		packageDescs = newDescs;
		macosPrefs = Array.isArray(parsed.snapshot?.macos_prefs) ? mapPrefs(parsed.snapshot.macos_prefs) : [];
	}

	function enterRawMode() {
		rawJson = JSON.stringify(buildPayload(), null, 2);
		rawMode = true;
		error = '';
	}

	function exitRawMode() {
		try {
			applyParsed(JSON.parse(rawJson));
			rawMode = false;
			error = '';
		} catch {
			error = 'Invalid JSON — fix before switching back';
		}
	}

	function toggleRaw() {
		if (rawMode) exitRawMode();
		else enterRawMode();
	}

	function discard() {
		if (initialPayload) applyParsed(JSON.parse(JSON.stringify(initialPayload)));
		error = '';
	}

	async function save() {
		let payload: any;
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
				body: JSON.stringify(payload)
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
	<div class="editor-loading"><div class="loader"></div></div>
{:else}
	<div class="editor">
		<!-- save bar -->
		<div class="savebar">
			<button class="back" onclick={() => goto('/dashboard')}>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
				Back to dashboard
			</button>
			<div class="savebar-right">
				{#if error}
					<span class="savebar-error">{error}</span>
				{:else if rawMode}
					<span class="status raw">editing config.json</span>
				{:else if dirty}
					<span class="status unsaved"><span class="status-dot"></span> Unsaved changes</span>
				{:else if !isNew}
					<span class="status saved">✓ All changes saved</span>
				{/if}
				<button class="raw-btn" class:active={rawMode} onclick={toggleRaw} title={rawMode ? 'Back to the form' : 'Edit raw JSON'}>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
					Raw
				</button>
				{#if dirty && !rawMode}
					<button class="discard" onclick={discard}>Discard</button>
				{/if}
				<button class="save" class:inactive={!canSave} disabled={saving || !canSave} onclick={save}>
					{saving ? 'Saving…' : 'Save changes'}
				</button>
			</div>
		</div>

		{#if rawMode}
			<div class="raw-wrap">
				<div class="term">
					<div class="term-head">
						<span class="dot dot-red"></span><span class="dot dot-amber"></span><span class="dot dot-green"></span>
						<span class="term-name">config.json</span>
						<span class="term-note">editable · consumed by the CLI</span>
					</div>
					<textarea class="raw-textarea" bind:value={rawJson} spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
				</div>
			</div>
		{:else}
			<div class="form-grid">
				<!-- IDENTITY -->
				<section class="col-full">
					<p class="eyebrow"><span class="gt">&gt;</span> IDENTITY</p>
					<div class="card identity-card">
						<input class="name-input" bind:value={formData.name} placeholder="Config name" />
						<input class="desc-input" bind:value={formData.description} placeholder="What's this config for?" />
						<div class="identity-foot">
							<div class="vis-pills">
								{#each ['public', 'unlisted', 'private'] as v (v)}
									<button class="vis-pill" class:active={formData.visibility === v} onclick={() => (formData.visibility = v)}>{v}</button>
								{/each}
							</div>
							<div class="alias-field">
								<span class="alias-prefix">openboot.dev/</span>
								<input class="alias-input" bind:value={formData.alias} placeholder="alias" />
							</div>
						</div>
					</div>
				</section>

				<!-- STACK -->
				<section>
					<div class="eyebrow-row">
						<p class="eyebrow"><span class="gt">&gt;</span> STACK</p>
						<span class="eyebrow-count">{selectedPackages.size} packages</span>
					</div>
					<PackageManager
						{selectedPackages}
						basePreset={formData.base_preset}
						{togglePackage}
						onPresetChange={handlePresetChange}
					/>
				</section>

				<!-- SYSTEM -->
				<section>
					<p class="eyebrow"><span class="gt">&gt;</span> SYSTEM</p>
					<div class="card">
						<div class="field-label">Dotfiles repository</div>
						<input class="text-input" bind:value={formData.dotfiles_repo} placeholder="https://github.com/you/dotfiles" />
						<p class="field-hint">Cloned &amp; deployed via GNU Stow after install.</p>
						<div class="field-label field-label-spaced">macOS preferences</div>
						<MacOSPreferencesEditor bind:macosPrefs />
					</div>
				</section>

				<!-- SCRIPT -->
				<section class="col-full">
					<p class="eyebrow"><span class="gt">&gt;</span> SCRIPT</p>
					<div class="term">
						<div class="term-head">
							<span class="dot dot-red"></span><span class="dot dot-amber"></span><span class="dot dot-green"></span>
							<span class="term-name">post-install.sh — runs after packages</span>
						</div>
						<textarea
							class="script-textarea"
							bind:value={formData.custom_script}
							spellcheck="false"
							placeholder={scriptPlaceholder}
						></textarea>
					</div>
				</section>
			</div>
		{/if}
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
		max-width: 1160px;
		margin: 0 auto;
		padding: 0 36px 96px;
	}

	/* ---------- save bar ---------- */
	.savebar {
		position: sticky;
		top: 56px;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 22px 0 16px;
		background: color-mix(in srgb, var(--bg-primary) 90%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border);
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.85rem;
		color: var(--text-secondary);
		padding: 0;
		transition: color 0.15s ease;
	}

	.back:hover {
		color: var(--text-primary);
	}

	.savebar-right {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 0.78rem;
		animation: ob-fade 0.25s ease;
	}

	.status.unsaved {
		color: var(--amber);
	}

	.status.saved {
		color: var(--accent);
	}

	.status.raw {
		color: var(--text-muted);
	}

	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--amber);
		animation: ob-pulse 1.5s ease infinite;
	}

	.savebar-error {
		font-size: 0.78rem;
		color: var(--danger);
	}

	.raw-btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 9px 15px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-hover);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.8rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.raw-btn:hover {
		color: var(--text-primary);
	}

	.raw-btn.active {
		background: var(--accent-glow);
		border-color: var(--accent);
		color: var(--accent);
	}

	.discard {
		padding: 9px 16px;
		background: none;
		border: 1px solid var(--border-hover);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.82rem;
		color: var(--text-secondary);
		cursor: pointer;
		animation: ob-fade 0.25s ease;
		transition: color 0.15s ease;
	}

	.discard:hover {
		color: var(--text-primary);
	}

	.save {
		padding: 10px 22px;
		background: var(--accent);
		color: var(--bg-primary);
		border: none;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.84rem;
		font-weight: 500;
		cursor: pointer;
		transition: filter 0.15s ease, transform 0.15s ease;
	}

	.save:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.save.inactive {
		background: var(--bg-tertiary);
		color: var(--text-muted);
		border: 1px solid var(--border);
		cursor: default;
	}

	.save:disabled {
		cursor: default;
	}

	/* ---------- form grid ---------- */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 30px 24px;
		align-items: start;
		padding-top: 30px;
	}

	.col-full {
		grid-column: 1 / -1;
	}

	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin: 0 0 16px;
	}

	.eyebrow .gt {
		color: var(--accent);
	}

	.eyebrow-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.eyebrow-row .eyebrow {
		margin: 0;
	}

	.eyebrow-count {
		font-size: 0.74rem;
		color: var(--text-muted);
	}

	.card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 22px;
	}

	.identity-card {
		padding: 24px;
	}

	.field-label {
		font-size: 0.74rem;
		color: var(--text-secondary);
		margin-bottom: 11px;
	}

	.field-label-spaced {
		margin-top: 22px;
	}

	.field-hint {
		font-size: 0.74rem;
		color: var(--text-muted);
		margin: 6px 0 0;
	}

	.text-input {
		width: 100%;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-hover);
		border-radius: 8px;
		padding: 11px 13px;
		font-family: inherit;
		font-size: 0.84rem;
		color: var(--text-primary);
		outline: none;
		transition: border-color 0.15s ease;
	}

	.text-input:focus {
		border-color: var(--accent);
	}

	/* ---------- identity ---------- */
	.name-input {
		width: 100%;
		background: transparent;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: 1.5rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.desc-input {
		width: 100%;
		background: transparent;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: 0.88rem;
		color: var(--text-secondary);
		margin-bottom: 20px;
	}

	.name-input::placeholder,
	.desc-input::placeholder {
		color: var(--text-muted);
	}

	.identity-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
		padding-top: 18px;
		border-top: 1px solid var(--border);
	}

	.vis-pills {
		display: flex;
		gap: 6px;
	}

	.vis-pill {
		padding: 7px 15px;
		border-radius: 7px;
		font-family: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-hover);
		text-transform: capitalize;
		transition: all 0.15s ease;
	}

	.vis-pill:hover {
		color: var(--text-primary);
	}

	.vis-pill.active {
		background: var(--accent);
		color: var(--bg-primary);
		border-color: var(--accent);
	}

	.alias-field {
		display: flex;
		align-items: center;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-hover);
		border-radius: 8px;
		overflow: hidden;
	}

	.alias-prefix {
		font-size: 0.82rem;
		color: var(--text-muted);
		padding: 9px 4px 9px 12px;
		white-space: nowrap;
	}

	.alias-input {
		background: transparent;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: 0.82rem;
		color: var(--accent);
		padding: 9px 12px 9px 0;
		width: 130px;
	}

	.alias-input::placeholder {
		color: var(--text-muted);
	}

	/* ---------- terminal (script + raw) ---------- */
	.term {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
	}

	.term-head {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 11px 15px;
		border-bottom: 1px solid var(--border);
	}

	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}

	.dot-red {
		background: var(--danger);
	}

	.dot-amber {
		background: var(--amber);
	}

	.dot-green {
		background: var(--accent);
	}

	.term-name {
		margin-left: 6px;
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.term-note {
		margin-left: auto;
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.script-textarea {
		width: 100%;
		min-height: 200px;
		padding: 18px 20px;
		background: transparent;
		border: none;
		outline: none;
		resize: vertical;
		font-family: inherit;
		font-size: 0.8rem;
		line-height: 1.9;
		color: var(--text-secondary);
	}

	.script-textarea::placeholder {
		color: var(--text-muted);
	}

	.raw-wrap {
		padding: 30px 0 0;
	}

	.raw-textarea {
		display: block;
		width: 100%;
		min-height: 58vh;
		padding: 20px 22px;
		background: transparent;
		border: none;
		outline: none;
		resize: vertical;
		font-family: inherit;
		font-size: 0.8rem;
		line-height: 1.75;
		color: var(--text-secondary);
	}

	@keyframes ob-fade {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes ob-pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.45;
			transform: scale(1.5);
		}
	}

	@media (max-width: 880px) {
		.editor {
			padding: 0 22px 80px;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
