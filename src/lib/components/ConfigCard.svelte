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

	let copiedCmd = $state(false);

	const packages = $derived(
		Array.isArray(config.packages)
			? config.packages.map((p: any) =>
					typeof p === 'string' ? { name: p, type: 'formula' } : p
				)
			: []
	);

	const stats = $derived({
		total: packages.length,
		apps: packages.filter((p: any) => p.type === 'cask').length,
		cli: packages.filter((p: any) => p.type !== 'cask' && p.type !== 'npm').length,
		npm: packages.filter((p: any) => p.type === 'npm').length,
	});

	const installCmd = $derived(
		config.alias
			? `openboot install ${config.alias}`
			: `openboot install ${username}/${config.slug}`
	);

	// Subtle accent color per card
	const ACCENTS = [
		'99, 102, 241',   // indigo
		'236, 72, 153',   // pink
		'59, 130, 246',   // blue
		'16, 185, 129',   // emerald
		'245, 158, 11',   // amber
		'139, 92, 246',   // violet
		'20, 184, 166',   // teal
		'244, 63, 94',    // rose
	];

	function hashStr(s: string): number {
		let h = 0;
		for (let i = 0; i < s.length; i++) {
			h = ((h << 5) - h) + s.charCodeAt(i);
			h |= 0;
		}
		return Math.abs(h);
	}

	const accent = $derived(ACCENTS[hashStr(config.name) % ACCENTS.length]);

	function copyCommand(e: MouseEvent) {
		e.stopPropagation();
		navigator.clipboard.writeText(installCmd);
		copiedCmd = true;
		setTimeout(() => (copiedCmd = false), 2000);
	}

	const menuItems = $derived([
		{ label: 'Duplicate', action: 'duplicate' },
		{ label: 'Share', action: 'share' },
		{ label: 'Export JSON', action: 'export' },
		...(config.visibility !== 'public'
			? [{ label: 'Push to Community', action: 'push' }]
			: []),
		{ label: 'Delete', action: 'delete', danger: true },
	]);
</script>

<div
	class="card"
	style="
		--card-accent: {accent};
		--card-glow: rgba({accent}, 0.06);
		--card-glow-hover: rgba({accent}, 0.12);
		--card-border-hover: rgba({accent}, 0.3);
	"
	onclick={() => onaction('edit', config.slug)}
	onkeydown={(e) => e.key === 'Enter' && onaction('edit', config.slug)}
	role="button"
	tabindex="0"
>
	<!-- Subtle top glow -->
	<div class="glow"></div>


	<div class="card-inner">
		<!-- Header row -->
		<div class="card-top">
			<div class="card-identity">
				<h3 class="card-name">{config.name}</h3>
				<span class="card-slug">
					{#if config.alias}
						<span class="alias-highlight">/{config.alias}</span>
					{:else}
						/{config.slug}
					{/if}
				</span>
			</div>
			<div class="card-meta" onclick={(e) => e.stopPropagation()} role="presentation">
				<span
					class="vis-tag"
					class:public={config.visibility === 'public'}
					class:unlisted={config.visibility === 'unlisted'}
					class:private={config.visibility === 'private'}
				>
					{config.visibility}
				</span>
				<ContextMenu items={menuItems} onselect={(action) => onaction(action, config.slug)} />
			</div>
		</div>

		{#if config.description}
			<p class="card-desc">{config.description}</p>
		{/if}

		<!-- Stats row -->
		<div class="stats">
			<div class="stat">
				<span class="stat-val">{stats.total}</span>
				<span class="stat-lbl">packages</span>
			</div>
			{#if stats.apps > 0}
				<div class="stat">
					<span class="stat-val" style="color: rgb({accent})">{stats.apps}</span>
					<span class="stat-lbl">apps</span>
				</div>
			{/if}
			{#if stats.cli > 0}
				<div class="stat">
					<span class="stat-val" style="color: rgb({accent})">{stats.cli}</span>
					<span class="stat-lbl">cli</span>
				</div>
			{/if}
			{#if stats.npm > 0}
				<div class="stat">
					<span class="stat-val" style="color: rgb({accent})">{stats.npm}</span>
					<span class="stat-lbl">npm</span>
				</div>
			{/if}
		</div>

		<!-- Terminal -->
		<div class="terminal" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="term-chrome">
				<span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
			</div>
			<div class="term-row">
				<code><span class="prompt">$</span> {installCmd}<span class="caret"></span></code>
				<button class="cp" class:copied={copiedCmd} onclick={copyCommand}>
					{#if copiedCmd}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
					{:else}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.card {
		position: relative;
		border-radius: 16px;
		overflow: hidden;
		cursor: pointer;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.card:hover {
		border-color: var(--card-border-hover);
		transform: translateY(-4px);
		box-shadow: 0 20px 50px -12px rgba(var(--card-accent), 0.15);
	}

	.card:focus-visible {
		outline: 2px solid rgb(var(--card-accent));
		outline-offset: 2px;
	}

	/* Subtle ambient glow at top */
	.glow {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 120px;
		background: radial-gradient(ellipse at 30% 0%, var(--card-glow) 0%, transparent 70%);
		pointer-events: none;
		transition: background 0.35s;
	}

	.card:hover .glow {
		background: radial-gradient(ellipse at 30% 0%, var(--card-glow-hover) 0%, transparent 70%);
	}

	.card-inner {
		position: relative;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* Top row */
	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.card-identity {
		min-width: 0;
	}

	.card-name {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.3;
	}

	.card-slug {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.76rem;
		color: var(--text-muted);
		margin-top: 3px;
		display: block;
	}

	.alias-highlight {
		color: rgb(var(--card-accent));
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.vis-tag {
		padding: 3px 8px;
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border-radius: 5px;
		background: var(--bg-tertiary);
		color: var(--text-muted);
		border: 1px solid var(--border);
	}

	.vis-tag.public { color: var(--accent); border-color: rgba(34, 197, 94, 0.2); }
	.vis-tag.private { color: var(--danger); border-color: rgba(239, 68, 68, 0.2); }

	.card-desc {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Stats */
	.stats {
		display: flex;
		gap: 28px;
		padding: 4px 0;
	}

	.stat {
		display: flex;
		flex-direction: column;
	}

	.stat-val {
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.stat-lbl {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin-top: 3px;
	}

	/* Terminal */
	.terminal {
		background: #08080a;
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		overflow: hidden;
	}

	[data-theme='light'] .terminal {
		background: #1a1a2e;
	}

	.term-chrome {
		display: flex;
		gap: 5px;
		padding: 8px 12px 0;
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		opacity: 0.7;
	}

	.dot.r { background: #ff5f57; }
	.dot.y { background: #febc2e; }
	.dot.g { background: #28c840; }

	.term-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px 12px;
		gap: 8px;
	}

	.term-row code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.76rem;
		color: #4ade80;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.prompt {
		color: #555;
		margin-right: 4px;
	}

	.caret {
		display: inline-block;
		width: 7px;
		height: 14px;
		background: #4ade80;
		margin-left: 2px;
		vertical-align: text-bottom;
		animation: blink 1.1s step-end infinite;
	}

	@keyframes blink {
		50% { opacity: 0; }
	}

	.cp {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 6px;
		color: #555;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.cp:hover {
		color: #4ade80;
		background: rgba(74, 222, 128, 0.08);
		border-color: rgba(74, 222, 128, 0.15);
	}

	.cp.copied { color: #4ade80; }

	@media (max-width: 600px) {
		.stats { gap: 20px; }
		.stat-val { font-size: 1.25rem; }
	}
</style>
