<script lang="ts">
	import ContextMenu from './ContextMenu.svelte';

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

	const installUrl = $derived(
		config.alias ? `openboot.dev/${config.alias}` : `openboot.dev/${username}/${config.slug}`
	);

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
		if (isNaN(date.getTime())) return '';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const menuItems = $derived([
		{ label: 'Duplicate', action: 'duplicate' },
		{ label: 'Export JSON', action: 'export' },
		...(config.visibility !== 'public'
			? [{ label: 'Push to Community', action: 'push' }]
			: []),
		{ label: 'Delete', action: 'delete', danger: true },
	]);
</script>

<div class="card">
	<div class="card-head">
		<h3 class="card-name">{config.name}</h3>
		<span
			class="vis-tag"
			class:public={config.visibility === 'public'}
		>
			{config.visibility}
		</span>
	</div>

	{#if config.description}
		<p class="card-desc">{config.description}</p>
	{/if}

	<div class="card-foot">
		<span class="foot-pkgs">{cli} cli · {apps} apps</span>
		<span class="foot-stat">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
			{config.install_count ?? 0}
		</span>
		<span class="foot-date">{formatDate(config.updated_at)}</span>
	</div>

	<div class="install">
		<code><span class="prompt">$</span> curl -fsSL {installUrl} | bash</code>
	</div>

	<div class="actions">
		<button class="act" onclick={() => onaction('edit', config.slug)}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
			Edit
		</button>
		<button class="act" onclick={() => onaction('share', config.slug)}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
			Share
		</button>
		<ContextMenu items={menuItems} onselect={(action) => onaction(action, config.slug)} />
	</div>
</div>

<style>
	.card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease;
	}

	.card:hover {
		border-color: var(--border-hover);
		box-shadow:
			0 0 0 1px var(--accent-glow),
			0 14px 40px -22px var(--shadow);
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 10px;
	}

	.card-name {
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin: 0;
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

	.card-desc {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
		min-height: 2.6em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-foot {
		display: flex;
		gap: 14px;
		align-items: center;
		padding-top: 14px;
		border-top: 1px solid var(--border);
		font-size: 0.78rem;
	}

	.foot-pkgs {
		color: var(--accent);
		font-size: 0.75rem;
	}

	.foot-stat {
		display: flex;
		align-items: center;
		gap: 5px;
		color: var(--text-secondary);
	}

	.foot-date {
		margin-left: auto;
		color: var(--text-muted);
	}

	.install {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 9px 11px;
		overflow: hidden;
	}

	.install code {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-secondary);
		white-space: nowrap;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.install .prompt {
		color: var(--accent);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 2px;
	}

	.act {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 7px;
		font-family: inherit;
		font-size: 0.76rem;
		color: var(--text-primary);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.act:hover {
		border-color: var(--border-hover);
		color: var(--accent);
	}
</style>
