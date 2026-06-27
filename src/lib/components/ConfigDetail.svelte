<script lang="ts">
	import { goto } from '$app/navigation';
	import { getCatalogItem } from '$lib/macos-prefs-catalog';
	import ShareModal from '$lib/components/ShareModal.svelte';
	import MacOSPreferencesDisplay from '$lib/components/MacOSPreferencesDisplay.svelte';

	let {
		configUser,
		config,
		packageDescriptions = {}
	}: {
		configUser: { username: string; avatar_url: string | null };
		config: any;
		packageDescriptions: Record<string, string>;
	} = $props();

	let showShareModal = $state(false);
	let curlCopied = $state(false);
	let forking = $state(false);
	let forkError = $state('');

	function getCurlCommand() {
		if (config.alias) return `curl -fsSL openboot.dev/${config.alias} | bash`;
		return `curl -fsSL openboot.dev/${configUser.username}/${config.slug} | bash`;
	}

	function getInstallCommand() {
		if (config.alias) return `openboot install ${config.alias}`;
		return `openboot install ${configUser.username}/${config.slug}`;
	}

	function getShareUrl() {
		if (config.alias) return `https://openboot.dev/${config.alias}`;
		return `https://openboot.dev/${configUser.username}/${config.slug}`;
	}

	function copyCurl() {
		navigator.clipboard.writeText(getCurlCommand());
		curlCopied = true;
		setTimeout(() => (curlCopied = false), 1600);
	}

	async function useThisConfig() {
		forking = true;
		forkError = '';
		try {
			const authCheck = await fetch('/api/user');
			if (!authCheck.ok) {
				window.location.href = `/login?return_to=${encodeURIComponent(window.location.pathname)}`;
				return;
			}
			const res = await fetch('/api/configs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: `${config.name} (fork)`,
					description: `Forked from @${configUser.username}`,
					base_preset: config.base_preset,
					packages: config.packages,
					visibility: 'unlisted',
					custom_script: config.custom_script || '',
					dotfiles_repo: config.dotfiles_repo || '',
					snapshot: config.snapshot || null,
					snapshot_at: config.snapshot_at || null,
					forked_from: config.id
				})
			});
			if (!res.ok) {
				const error = await res.json();
				forkError = error.error || 'Failed to use config';
				forking = false;
				return;
			}
			goto('/dashboard');
		} catch {
			forkError = 'Network error. Please try again.';
			forking = false;
		}
	}

	function getPackageUrl(name: string, type: 'formula' | 'cask' | 'npm'): string {
		if (type === 'npm') return `https://www.npmjs.com/package/${name}`;
		if (type === 'cask') return `https://formulae.brew.sh/cask/${name}`;
		if (name.includes('/')) {
			const parts = name.split('/');
			return `https://github.com/${parts[0]}/homebrew-${parts[1]}`;
		}
		return `https://formulae.brew.sh/formula/${name}`;
	}

	/** "cirruslabs/cli/tart" → "tart" */
	function displayName(name: string): string {
		if (name.includes('/')) return name.split('/').pop() as string;
		return name;
	}

	function formatDate(value: unknown): string {
		if (value == null) return '';
		let ms: number;
		if (typeof value === 'number') ms = value < 1e12 ? value * 1000 : value;
		else ms = Date.parse(String(value));
		if (Number.isNaN(ms)) return '';
		return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	/** Color comments muted and the leading command token accent, comp-style. */
	function scriptLine(line: string): string {
		const esc = escapeHtml(line);
		if (/^\s*#/.test(line)) return `<span class="cmt">${esc}</span>`;
		return esc.replace(/^(\s*)([\w./-]+)/, (_m, sp, cmd) => `${sp}<span class="cmd">${cmd}</span>`);
	}

	const dotfilesLabel = $derived(
		config.dotfiles_repo ? config.dotfiles_repo.replace(/^https?:\/\//, '').replace(/\.git$/, '') : ''
	);

	const configPkgs: { name: string; type: string }[] = $derived(
		Array.isArray(config.packages)
			? config.packages.map((p: any) => (typeof p === 'string' ? { name: p, type: 'formula' } : p))
			: []
	);

	const configCli = $derived(
		configPkgs.filter((p) => p.type !== 'cask' && p.type !== 'npm' && p.type !== 'tap')
	);
	const configApps = $derived(configPkgs.filter((p) => p.type === 'cask'));
	const configNpm = $derived(configPkgs.filter((p) => p.type === 'npm'));
	const configTaps = $derived(configPkgs.filter((p) => p.type === 'tap'));

	// Package "DNA" — one segment per package, opacity ramping within each group.
	type Seg = { color: string; opacity: number };
	const dna = $derived.by((): Seg[] => {
		const groups: [number, string][] = [
			[configCli.length, 'var(--accent)'],
			[configApps.length, 'var(--amber)'],
			[configNpm.length, '#7aa2e3']
		];
		const segs: Seg[] = [];
		for (const [n, color] of groups) {
			for (let i = 0; i < n; i++) {
				segs.push({ color, opacity: 0.55 + (i / Math.max(n - 1, 1)) * 0.45 });
			}
		}
		return segs;
	});

	const dnaLegend = $derived(
		[
			{ n: configCli.length, label: configCli.length === 1 ? 'formula' : 'formulae', color: 'var(--accent)' },
			{ n: configApps.length, label: configApps.length === 1 ? 'cask' : 'casks', color: 'var(--amber)' },
			{ n: configNpm.length, label: 'npm', color: '#7aa2e3' }
		].filter((x) => x.n > 0)
	);

	const visibility = $derived((config.visibility || 'public') as string);

	const snapshot = $derived(config.snapshot || {});
	const macosPrefs = $derived(snapshot.macos_prefs || []);
	const shell = $derived(snapshot.shell || {});
	const git = $derived(snapshot.git || {});
	const devToolsRaw = $derived(snapshot.dev_tools || []);
	const devTools = $derived(
		devToolsRaw.map((t: any) => (typeof t === 'string' ? t : t?.name || String(t)))
	);

	const prefsByCategory = $derived.by(() => {
		const map: Record<string, { pref: any; catalogItem: ReturnType<typeof getCatalogItem> }[]> = {};
		for (const pref of macosPrefs) {
			const catalogItem = getCatalogItem(pref.domain, pref.key);
			const category = catalogItem?.category ?? 'Custom';
			if (!map[category]) map[category] = [];
			map[category] = [...map[category], { pref, catalogItem }];
		}
		return map;
	});
	const prefCategoryNames = $derived(Object.keys(prefsByCategory));
</script>

<div class="page">
	<div class="container">
		<div class="topbar">
			<a href="/explore" class="back">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
				Back to explore
			</a>
			<button class="share" onclick={() => (showShareModal = true)}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
				Share
			</button>
		</div>

		<div class="grid">
			<!-- main -->
			<div class="main">
				<div class="byline">
					{#if configUser.avatar_url}
						<img src={configUser.avatar_url} alt={configUser.username} class="avatar" />
					{:else}
						<span class="avatar avatar-ph">{configUser.username.charAt(0).toLowerCase()}</span>
					{/if}
					<a href="/{configUser.username}" class="user">@{configUser.username}</a>
					<span class="vis-badge" class:public={visibility === 'public'}>{visibility}</span>
				</div>

				<h1 class="title">{config.name}</h1>
				{#if config.description}
					<p class="desc">{config.description}</p>
				{/if}

				<div class="meta">
					<span class="meta-item">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
						<span class="strong">{config.install_count || 0}</span> installs
					</span>
					{#if formatDate(config.updated_at)}
						<span>updated {formatDate(config.updated_at)}</span>
					{/if}
					{#if config.base_preset}
						<span>base preset <span class="strong">{config.base_preset}</span></span>
					{/if}
				</div>

				{#if dna.length > 0}
					<div class="dna">
						{#each dna as seg}
							<span style="flex:1; height:100%; background:{seg.color}; opacity:{seg.opacity};"></span>
						{/each}
					</div>
					<div class="dna-legend">
						{#each dnaLegend as l}
							<span><span class="swatch" style="background:{l.color};"></span>{l.n} {l.label}</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- rail -->
			<div class="rail">
				<div class="rail-card">
					<div class="rail-label">Install this setup</div>
					<button class="curl-btn" onclick={copyCurl}>
						<code><span class="prompt">$</span> {getCurlCommand()}</code>
						<span class="curl-copy">{curlCopied ? '✓ copied' : 'copy'}</span>
					</button>
					<button class="use" onclick={useThisConfig} disabled={forking}>
						{forking ? 'Working…' : 'Use this config'}
					</button>
					{#if forkError}
						<p class="fork-error">{forkError}</p>
					{/if}
					<p class="rail-hint">
						Already have OpenBoot?<br /><code>{getInstallCommand()}</code>
					</p>
				</div>

				<div class="rail-card meta-card">
					<div class="kv"><span class="k">Visibility</span><span class="v cap">{visibility}</span></div>
					{#if config.base_preset}
						<div class="kv"><span class="k">Base preset</span><span class="v">{config.base_preset}</span></div>
					{/if}
					{#if config.dotfiles_repo}
						<div class="kv"><span class="k">Dotfiles</span><a class="v link" href={config.dotfiles_repo} target="_blank" rel="noopener noreferrer">{dotfilesLabel}</a></div>
					{/if}
					<div class="kv"><span class="k">macOS prefs</span><span class="v">{macosPrefs.length} applied</span></div>
				</div>
			</div>
		</div>

		<div class="sections">
			{#if configCli.length > 0}
				<section class="pkg-section">
					<h3 class="pkg-head"><span class="swatch" style="background:var(--accent);"></span>Formulae <span class="count">{configCli.length}</span></h3>
					<div class="pkg-grid">
						{#each configCli as p}
							<a class="pkg-card" href={getPackageUrl(p.name, 'formula')} target="_blank" rel="noopener noreferrer">
								<span class="pkg-name accent">{displayName(p.name)}</span>
								{#if packageDescriptions[p.name]}<span class="pkg-desc">{packageDescriptions[p.name]}</span>{/if}
							</a>
						{/each}
					</div>
				</section>
			{/if}

			{#if configApps.length > 0}
				<section class="pkg-section">
					<h3 class="pkg-head"><span class="swatch" style="background:var(--amber);"></span>Casks <span class="count">{configApps.length}</span></h3>
					<div class="pkg-grid">
						{#each configApps as p}
							<a class="pkg-card" href={getPackageUrl(p.name, 'cask')} target="_blank" rel="noopener noreferrer">
								<span class="pkg-name amber">{displayName(p.name)}</span>
								{#if packageDescriptions[p.name]}<span class="pkg-desc">{packageDescriptions[p.name]}</span>{/if}
							</a>
						{/each}
					</div>
				</section>
			{/if}

			{#if configNpm.length > 0}
				<section class="pkg-section">
					<h3 class="pkg-head"><span class="swatch" style="background:#7aa2e3;"></span>NPM globals <span class="count">{configNpm.length}</span></h3>
					<div class="chips">
						{#each configNpm as p}
							<a class="chip npm" href={getPackageUrl(p.name, 'npm')} target="_blank" rel="noopener noreferrer">{p.name}</a>
						{/each}
					</div>
				</section>
			{/if}

			{#if configTaps.length > 0}
				<section class="pkg-section">
					<h3 class="pkg-head"><span class="swatch" style="background:var(--text-muted);"></span>Homebrew taps <span class="count">{configTaps.length}</span></h3>
					<div class="chips">
						{#each configTaps as p}
							<span class="chip">{p.name}</span>
						{/each}
					</div>
				</section>
			{/if}

			{#if config.custom_script}
				<section class="pkg-section">
					<h3 class="pkg-head">Custom script</h3>
					<div class="term">
						<div class="term-head">runs after packages install</div>
						<div class="term-body">
							{#each config.custom_script.split('\n') as line}
								<div>{@html scriptLine(line)}</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			{#if macosPrefs.length > 0}
				<section class="pkg-section">
					<h3 class="pkg-head">macOS preferences <span class="count">{macosPrefs.length}</span></h3>
					<MacOSPreferencesDisplay {prefsByCategory} {prefCategoryNames} />
				</section>
			{/if}

			{#if shell.default || shell.oh_my_zsh || Object.keys(git).length > 0}
				<section class="pkg-section">
					<h3 class="pkg-head">Shell &amp; Git</h3>
					<div class="kv-list">
						{#if shell.default}<div class="kv-row"><span class="k">Shell</span><span class="v">{shell.default}</span></div>{/if}
						{#if shell.oh_my_zsh}<div class="kv-row"><span class="k">Oh My Zsh</span><span class="v accent">installed</span></div>{/if}
						{#if shell.theme}<div class="kv-row"><span class="k">Theme</span><span class="v">{shell.theme}</span></div>{/if}
						{#each Object.entries(git) as [key, value]}
							<div class="kv-row"><span class="k">git.{key}</span><span class="v">{value}</span></div>
						{/each}
					</div>
				</section>
			{/if}

			{#if devTools.length > 0}
				<section class="pkg-section">
					<h3 class="pkg-head">Dev tools <span class="count">{devTools.length}</span></h3>
					<div class="chips">
						{#each devTools as tool}
							<span class="chip">{tool}</span>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>

<ShareModal bind:show={showShareModal} shareUrl={getShareUrl()} configName={config.name} />

<style>
	.page {
		min-height: 100vh;
		padding-top: 56px;
		padding-bottom: 96px;
	}

	.container {
		max-width: 1160px;
		margin: 0 auto;
		padding: 0 36px;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 40px 0 20px;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: var(--text-secondary);
		transition: color 0.15s ease;
	}

	.back:hover {
		color: var(--text-primary);
	}

	.share {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 7px 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.8rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.share:hover {
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.grid {
		display: grid;
		grid-template-columns: 1.35fr 1fr;
		gap: 40px;
		align-items: start;
	}

	/* ---------- main column ---------- */
	.byline {
		display: flex;
		align-items: center;
		gap: 11px;
		margin-bottom: 16px;
	}

	.avatar {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.avatar-ph {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-hover);
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.user {
		font-size: 0.9rem;
		color: var(--text-secondary);
		transition: color 0.15s ease;
	}

	.user:hover {
		color: var(--text-primary);
	}

	.vis-badge {
		font-size: 0.66rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		border: 1px solid var(--border-hover);
		border-radius: 5px;
		padding: 2px 7px;
	}

	.vis-badge.public {
		color: var(--accent);
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.title {
		font-size: 2.1rem;
		font-weight: 500;
		letter-spacing: -0.03em;
		margin: 0 0 12px;
		color: var(--text-primary);
	}

	.desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.65;
		max-width: 60ch;
		margin: 0 0 20px;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
		font-size: 0.82rem;
		color: var(--text-muted);
		margin-bottom: 18px;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.meta .strong {
		color: var(--text-secondary);
	}

	.dna {
		display: flex;
		height: 8px;
		gap: 2px;
		max-width: 420px;
	}

	.dna-legend {
		display: flex;
		gap: 18px;
		flex-wrap: wrap;
		margin-top: 11px;
		font-size: 0.74rem;
		color: var(--text-muted);
	}

	.swatch {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 2px;
		margin-right: 5px;
		vertical-align: middle;
	}

	/* ---------- rail ---------- */
	.rail {
		position: sticky;
		top: 80px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.rail-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 20px;
	}

	.rail-label {
		font-size: 0.74rem;
		color: var(--text-muted);
		margin-bottom: 11px;
	}

	.curl-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-hover);
		border-radius: 9px;
		padding: 12px 13px;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		margin-bottom: 12px;
		transition: border-color 0.15s ease;
	}

	.curl-btn:hover {
		border-color: var(--border-hover);
	}

	.curl-btn code {
		flex: 1;
		min-width: 0;
		font-family: inherit;
		font-size: 0.74rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.curl-btn .prompt {
		color: var(--accent);
	}

	.curl-copy {
		flex-shrink: 0;
		font-size: 0.68rem;
		color: var(--accent);
	}

	.use {
		width: 100%;
		padding: 12px;
		background: var(--accent);
		color: var(--bg-primary);
		border: none;
		border-radius: 9px;
		font-family: inherit;
		font-size: 0.86rem;
		font-weight: 500;
		cursor: pointer;
		transition: filter 0.15s ease, transform 0.15s ease;
	}

	.use:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.use:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.fork-error {
		margin: 10px 0 0;
		font-size: 0.78rem;
		color: var(--danger);
	}

	.rail-hint {
		font-size: 0.72rem;
		color: var(--text-muted);
		margin: 11px 0 0;
		line-height: 1.6;
	}

	.rail-hint code {
		font-family: inherit;
		color: var(--text-secondary);
	}

	.meta-card {
		display: flex;
		flex-direction: column;
		gap: 13px;
	}

	.kv {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 0.8rem;
	}

	.kv .k {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.kv .v {
		color: var(--text-secondary);
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.kv .v.cap {
		text-transform: capitalize;
	}

	.kv .v.link {
		color: var(--accent);
	}

	/* ---------- full-width sections ---------- */
	.sections {
		padding-bottom: 60px;
	}

	.pkg-section {
		margin-top: 30px;
	}

	.pkg-head {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 0.95rem;
		font-weight: 500;
		margin: 0 0 14px;
		color: var(--text-primary);
	}

	.pkg-head .swatch {
		margin-right: 0;
	}

	.pkg-head .count {
		color: var(--text-muted);
		font-weight: 400;
	}

	.pkg-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.pkg-card {
		display: flex;
		align-items: baseline;
		gap: 10px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 9px;
		padding: 11px 13px;
		transition: border-color 0.15s ease;
	}

	.pkg-card:hover {
		border-color: var(--border-hover);
	}

	.pkg-name {
		font-size: 0.84rem;
	}

	.pkg-name.accent {
		color: var(--accent);
	}

	.pkg-name.amber {
		color: var(--amber);
	}

	.pkg-desc {
		font-size: 0.76rem;
		color: var(--text-muted);
		margin-left: auto;
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chips {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.chip {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 8px 13px;
		font-size: 0.82rem;
		color: var(--text-secondary);
		transition: border-color 0.15s ease;
	}

	.chip.npm {
		color: #7aa2e3;
	}

	a.chip:hover {
		border-color: var(--border-hover);
	}

	.term {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.term-head {
		padding: 10px 14px;
		border-bottom: 1px solid var(--border);
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.term-body {
		padding: 16px 18px;
		font-size: 0.78rem;
		line-height: 1.85;
		color: var(--text-secondary);
		overflow-x: auto;
	}

	.term-body :global(.cmd) {
		color: var(--accent);
	}

	.term-body :global(.cmt) {
		color: var(--text-muted);
	}

	.kv-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 6px 16px;
	}

	.kv-row {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 11px 0;
		font-size: 0.82rem;
		border-bottom: 1px solid var(--border);
	}

	.kv-row:last-child {
		border-bottom: none;
	}

	.kv-row .k {
		color: var(--text-muted);
	}

	.kv-row .v {
		color: var(--text-secondary);
	}

	.kv-row .v.accent {
		color: var(--accent);
	}

	@media (max-width: 880px) {
		.grid {
			grid-template-columns: 1fr;
			gap: 28px;
		}

		.rail {
			position: static;
		}

		.pkg-grid {
			grid-template-columns: 1fr;
		}

		.container {
			padding: 0 22px;
		}
	}
</style>
