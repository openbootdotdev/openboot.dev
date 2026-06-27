<script lang="ts">
	import ContextMenu from './ContextMenu.svelte';
	import PackageFingerprint from './PackageFingerprint.svelte';

	interface Config {
		id: string;
		slug: string;
		name: string;
		description: string;
		base_preset: string;
		visibility: string;
		alias: string | null;
		packages?: any[];
		updated_at?: string;
		install_count?: number;
	}

	let { config, username, onaction }: {
		config: Config;
		username: string;
		onaction: (action: string, slug: string) => void;
	} = $props();

	const packages = $derived(
		Array.isArray(config.packages)
			? config.packages.map((p: any) =>
					typeof p === 'string' ? { name: p, type: 'formula' } : p
				)
			: []
	);

	const cli = $derived(packages.filter((p: any) => p.type !== 'cask' && p.type !== 'npm').length);
	const apps = $derived(packages.filter((p: any) => p.type === 'cask').length);
	const npm = $derived(packages.filter((p: any) => p.type === 'npm').length);

	const installUrl = $derived(
		config.alias ? `openboot.dev/${config.alias}` : `openboot.dev/${username}/${config.slug}`
	);

	let copied = $state(false);
	function copyInstall() {
		navigator.clipboard?.writeText(`curl -fsSL ${installUrl} | bash`).catch(() => {});
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
		if (isNaN(date.getTime())) return '';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const menuItems = $derived([
		{ label: 'Share', action: 'share' },
		{ label: 'Duplicate', action: 'duplicate' },
		{ label: 'Export JSON', action: 'export' },
		...(config.visibility !== 'public'
			? [{ label: 'Push to Community', action: 'push' }]
			: []),
		{ label: 'Delete', action: 'delete', danger: true },
	]);
</script>

<div class="row">
	<div class="row-top">
		<div class="identity">
			<div class="id-head">
				<h3 class="row-name">{config.name}</h3>
				<span class="vis-tag" class:public={config.visibility === 'public'}>{config.visibility}</span>
			</div>
			{#if cli + apps + npm > 0}
				<div class="fingerprint" aria-hidden="true">
					<PackageFingerprint counts={{ cli, cask: apps, npm }} seed={config.slug ?? config.name} />
				</div>
			{/if}
			{#if config.description}
				<p class="row-desc">{config.description}</p>
			{/if}
		</div>

		<div class="stats">
			<span class="stat-installs">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
				{config.install_count ?? 0}
			</span>
			<span class="stat-meta">{cli} cli · {apps} apps</span>
			<span class="stat-meta">updated {formatDate(config.updated_at)}</span>
		</div>
	</div>

	<div class="row-actions">
		<button class="copy-cmd" onclick={copyInstall} aria-label={copied ? 'Copied install command' : 'Copy install command'}>
			<code><span class="prompt">$</span> curl -fsSL {installUrl} | bash</code>
			<span class="copy-label" class:copied>
				{#if copied}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
				{:else}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
				{/if}
			</span>
		</button>
		<button class="icon-btn" aria-label="Edit" onclick={() => onaction('edit', config.slug)}>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
		</button>
		<ContextMenu square items={menuItems} onselect={(action) => onaction(action, config.slug)} />
	</div>
</div>

<style>
	.row {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 20px 22px;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.row:hover {
		transform: translateY(-3px);
		border-color: var(--border-hover);
		box-shadow: 0 16px 34px -16px var(--shadow);
	}

	.row-top {
		display: flex;
		align-items: flex-start;
		gap: 24px;
	}

	/* ── identity + fingerprint ── */
	.identity {
		flex: 1 1 0;
		min-width: 0;
	}

	.id-head {
		display: flex;
		align-items: center;
		gap: 11px;
		margin-bottom: 12px;
	}

	.row-name {
		font-size: 1.05rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.vis-tag {
		font-size: 0.66rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border-radius: 5px;
		padding: 2px 7px;
		color: var(--text-muted);
		border: 1px solid var(--border-hover);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.vis-tag.public {
		color: var(--accent);
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.fingerprint {
		display: flex;
		align-items: flex-end;
		height: 24px;
		gap: 2px;
		margin-bottom: 11px;
		max-width: 300px;
	}

	.row-desc {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.55;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* ── stats ── */
	.stats {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 7px;
		padding-left: 8px;
	}

	.stat-installs {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.85rem;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.stat-meta {
		font-size: 0.72rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	/* ── install command = hero action ── */
	.row-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 16px;
	}

	.copy-cmd {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 9px;
		padding: 11px 13px;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: border-color 0.15s ease;
	}

	.copy-cmd:hover {
		border-color: var(--border-hover);
		background: var(--bg-hover);
	}

	.copy-cmd code {
		flex: 1;
		min-width: 0;
		font-family: inherit;
		font-size: 0.76rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.copy-cmd .prompt {
		color: var(--accent);
	}

	.copy-label {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.7rem;
		color: var(--text-muted);
		transition: color 0.15s ease;
	}

	.copy-cmd:hover .copy-label {
		color: var(--text-secondary);
	}

	.copy-label.copied,
	.copy-cmd:hover .copy-label.copied {
		color: var(--accent);
	}

	.icon-btn {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 9px;
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.icon-btn:hover {
		border-color: var(--border-hover);
		color: var(--text-primary);
		background: var(--bg-hover);
	}

	@media (max-width: 640px) {
		.row-top {
			flex-direction: column;
			gap: 14px;
		}

		.stats {
			flex-direction: row;
			align-items: center;
			gap: 14px;
			padding-left: 0;
			flex-wrap: wrap;
		}
	}
</style>
