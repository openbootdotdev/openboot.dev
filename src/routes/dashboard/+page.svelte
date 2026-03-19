<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import ConfigCard from '$lib/components/ConfigCard.svelte';
	import { auth } from '$lib/stores/auth';

	interface Config {
		id: string;
		slug: string;
		name: string;
		description: string;
		base_preset: string;
		visibility: string;
		alias: string | null;
		packages?: any[];
		custom_script?: string;
		dotfiles_repo?: string;
		updated_at?: string;
		install_count?: number;
		snapshot?: Record<string, unknown> | null;
	}

	let configs = $state<Config[]>([]);
	let loading = $state(true);
	let toast = $state('');

	let showImportModal = $state(false);
	let brewfileContent = $state('');
	let importLoading = $state(false);
	let importError = $state('');

	let showShareModal = $state(false);
	let shareUrl = $state('');
	let shareConfigName = $state('');
	let shareCopied = $state(false);

	const totalInstalls = $derived(
		configs.reduce((sum, c) => sum + (c.install_count || 0), 0)
	);

	onMount(async () => {
		await auth.check();
		if (!$auth.user && !$auth.loading) {
			goto('/login?return_to=/dashboard');
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

	async function deleteConfig(slug: string) {
		if (!confirm('Delete this configuration?')) return;
		try {
			const response = await fetch(`/api/configs/${slug}`, { method: 'DELETE' });
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				alert(data.error || 'Failed to delete');
				return;
			}
			await loadConfigs();
		} catch {
			alert('Failed to delete configuration');
		}
	}

	async function duplicateConfig(slug: string) {
		try {
			const response = await fetch(`/api/configs/${slug}`);
			const data = await response.json();
			const source = data.config;
			sessionStorage.setItem(
				'openboot_prefill',
				JSON.stringify({
					name: source.name + ' (Copy)',
					description: source.description || '',
					base_preset: source.base_preset,
					packages: source.packages || [],
					custom_script: source.custom_script || '',
					dotfiles_repo: source.dotfiles_repo || '',
					snapshot: source.snapshot || null,
				})
			);
			goto('/dashboard/edit/new');
		} catch {
			alert('Failed to duplicate');
		}
	}

	async function exportConfig(slug: string) {
		try {
			const response = await fetch(`/api/configs/${slug}`);
			const data = await response.json();
			const config = data.config;
			const exported = {
				name: config.name,
				description: config.description || '',
				base_preset: config.base_preset,
				packages: config.packages || [],
				custom_script: config.custom_script || '',
				dotfiles_repo: config.dotfiles_repo || '',
				snapshot: config.snapshot || null,
				visibility: config.visibility || 'unlisted',
				alias: config.alias || null,
			};
			const blob = new Blob([JSON.stringify(exported, null, 2)], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${slug}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			alert('Failed to export');
		}
	}

	function shareConfig(config: Config) {
		shareUrl = config.alias
			? `https://openboot.dev/${config.alias}`
			: `https://openboot.dev/${$auth.user?.username}/${config.slug}`;
		shareConfigName = config.name;
		shareCopied = false;
		showShareModal = true;
	}

	function shareCopyLink() {
		navigator.clipboard.writeText(shareUrl);
		shareCopied = true;
		setTimeout(() => (shareCopied = false), 2000);
	}

	function shareOnTwitter() {
		const text = `My dev stack: ${shareConfigName} — set up in minutes with @openbootdotdev`;
		const hashtags = 'OpenBoot,macOS,DevTools';
		const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags)}`;
		window.open(tweetUrl, '_blank', 'width=550,height=420');
	}

	async function pushToCommunity(config: Config) {
		const pkgs = Array.isArray(config.packages) ? config.packages : [];
		if (pkgs.length < 5 || config.name === 'Default' || !config.description) {
			alert(
				'Needs at least 5 packages, a custom name, and a description to share publicly.'
			);
			return;
		}
		try {
			const response = await fetch(`/api/configs/${config.slug}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...config, visibility: 'public' }),
			});
			if (!response.ok) {
				const data = await response.json();
				alert(data.error || 'Failed to push');
				return;
			}
			toast = `${config.name} is now live on Explore!`;
			setTimeout(() => (toast = ''), 3000);
			await loadConfigs();
		} catch {
			alert('Failed to push to community');
		}
	}

	function handleAction(action: string, slug: string) {
		const config = configs.find((c) => c.slug === slug);
		if (!config) return;

		switch (action) {
			case 'edit':
				goto(`/dashboard/edit/${slug}`);
				break;
			case 'delete':
				deleteConfig(slug);
				break;
			case 'duplicate':
				duplicateConfig(slug);
				break;
			case 'share':
				shareConfig(config);
				break;
			case 'export':
				exportConfig(slug);
				break;
			case 'push':
				pushToCommunity(config);
				break;
		}
	}

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
			showImportModal = false;
			brewfileContent = '';
			sessionStorage.setItem(
				'openboot_prefill',
				JSON.stringify({
					name: 'Imported Config',
					description: `Imported from Brewfile (${data.packages.length} packages)`,
					base_preset: 'minimal',
					packages: data.packages.map((pkg: string) => ({
						name: pkg,
						type: (data.casks || []).includes(pkg) ? 'cask' : 'formula',
					})),
				})
			);
			goto('/dashboard/edit/new');
		} catch {
			importError = 'Failed to parse Brewfile';
		} finally {
			importLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Dashboard - OpenBoot</title>
</svelte:head>

<main class="dashboard">
	{#if loading}
		<div class="loading">
			<div class="loader"></div>
		</div>
	{:else}
		<div class="page-header">
			<div>
				<h1 class="page-title">My Configurations</h1>
				<p class="page-stats">
					{configs.length} config{configs.length !== 1 ? 's' : ''}
					{#if totalInstalls > 0}
						<span class="stats-sep">&middot;</span>
						{totalInstalls} install{totalInstalls !== 1 ? 's' : ''}
					{/if}
				</p>
			</div>
			<div class="header-actions">
				<Button variant="secondary" onclick={() => (showImportModal = true)}>
					Import Brewfile
				</Button>
				<Button variant="primary" onclick={() => goto('/dashboard/edit/new')}>
					+ New Config
				</Button>
			</div>
		</div>

		{#if configs.length === 0}
			<div class="empty">
				<div class="empty-glyph">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="3" width="20" height="14" rx="2" />
						<path d="M8 21h8" />
						<path d="M12 17v4" />
						<path d="M7 8h2" />
						<path d="M7 11h4" />
					</svg>
				</div>
				<h3 class="empty-title">No configurations yet</h3>
				<p class="empty-desc">
					Define your machine's DNA. Create a config to get a custom install URL.
				</p>
				<Button variant="primary" onclick={() => goto('/dashboard/edit/new')}>
					Create First Config
				</Button>
			</div>
		{:else}
			<div class="grid">
				{#each configs as config, i}
					<div class="card-wrap" style="animation-delay: {i * 50}ms">
						<ConfigCard
							{config}
							username={$auth.user?.username ?? ''}
							onaction={handleAction}
						/>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</main>

<!-- Import Modal -->
{#if showImportModal}
	<div
		class="overlay"
		onclick={() => (showImportModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showImportModal = false)}
		role="dialog"
		tabindex="0"
	>
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="modal-head">
				<h3>Import Brewfile</h3>
				<button class="close" onclick={() => (showImportModal = false)}>&times;</button>
			</div>
			<div class="modal-body">
				{#if importError}
					<div class="modal-error">{importError}</div>
				{/if}
				<textarea
					class="import-input"
					bind:value={brewfileContent}
					placeholder={'tap "homebrew/cask"\nbrew "git"\nbrew "node"\ncask "visual-studio-code"'}
				></textarea>
				<p class="modal-hint">Supports tap, brew, and cask entries</p>
			</div>
			<div class="modal-foot">
				<Button variant="secondary" onclick={() => (showImportModal = false)}>
					Cancel
				</Button>
				<Button variant="primary" onclick={importBrewfile}>
					{importLoading ? 'Parsing...' : 'Import'}
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Share Modal -->
{#if showShareModal}
	<div
		class="overlay"
		onclick={() => (showShareModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showShareModal = false)}
		role="dialog"
		tabindex="0"
	>
		<div
			class="modal share-modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="modal-head">
				<h3>Share Configuration</h3>
				<button class="close" onclick={() => (showShareModal = false)}>&times;</button>
			</div>
			<div class="modal-body share-body">
				<div class="share-url">
					<code>{shareUrl}</code>
				</div>
				<div class="share-options">
					<button class="share-opt" onclick={shareCopyLink}>
						<span class="share-icon">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="9" y="9" width="13" height="13" rx="2" />
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
							</svg>
						</span>
						{shareCopied ? 'Copied!' : 'Copy Link'}
					</button>
					<button class="share-opt" onclick={shareOnTwitter}>
						<span class="share-icon">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
							</svg>
						</span>
						Share on X
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if toast}
	<div class="toast">{toast}</div>
{/if}

<style>
	.dashboard {
		max-width: 1000px;
		margin: 0 auto;
		padding: 80px 24px 60px;
	}

	.loading {
		display: flex;
		justify-content: center;
		padding: 80px;
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
		to { transform: rotate(360deg); }
	}

	/* Header */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 36px;
	}

	.page-title {
		font-size: 2.2rem;
		font-weight: 800;
		background: linear-gradient(135deg, var(--text-primary), var(--accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1.2;
	}

	.page-stats {
		color: var(--text-muted);
		font-size: 0.88rem;
		margin-top: 6px;
		font-variant-numeric: tabular-nums;
	}

	.stats-sep {
		margin: 0 4px;
	}

	.header-actions {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	/* Empty state */
	.empty {
		text-align: center;
		padding: 80px 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.empty-glyph {
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 20px;
		color: var(--text-muted);
		margin-bottom: 8px;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-desc {
		color: var(--text-muted);
		font-size: 0.95rem;
		max-width: 360px;
		margin: 0;
	}

	/* Card grid */
	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.card-wrap {
		animation: fadeUp 0.4s ease-out both;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Modals */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 20px;
		animation: fadeIn 0.15s;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		width: 100%;
		max-width: 480px;
		overflow: hidden;
		animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(16px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.share-modal {
		max-width: 420px;
	}

	.modal-head {
		padding: 20px 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-head h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0;
	}

	.close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px 8px;
	}

	.close:hover {
		color: var(--text-primary);
	}

	.modal-body {
		padding: 24px;
	}

	.modal-foot {
		padding: 16px 24px;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	.modal-error {
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: var(--danger);
		padding: 10px 14px;
		border-radius: 8px;
		margin-bottom: 14px;
		font-size: 0.85rem;
	}

	.modal-hint {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-top: 8px;
	}

	.import-input {
		width: 100%;
		min-height: 180px;
		padding: 14px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.82rem;
		resize: vertical;
	}

	.import-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	/* Share */
	.share-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.share-url {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 12px 16px;
	}

	.share-url code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.82rem;
		color: var(--accent);
		word-break: break-all;
	}

	.share-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.share-opt {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.share-opt:hover {
		border-color: var(--accent);
		background: var(--bg-secondary);
	}

	.share-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--bg-secondary);
		border-radius: 8px;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.share-opt:hover .share-icon {
		color: var(--accent);
	}

	/* Toast */
	.toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: #22c55e;
		color: #000;
		padding: 12px 24px;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.88rem;
		box-shadow: 0 4px 24px rgba(34, 197, 94, 0.3);
		z-index: 9999;
		animation: toastIn 0.3s ease-out;
	}

	@keyframes toastIn {
		from { opacity: 0; transform: translateX(-50%) translateY(12px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
