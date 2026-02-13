<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let activeTab = $state('overview');
	let copied = $state(false);
	let copiedCli = $state(false);
	let showShareModal = $state(false);
	let shareCopied = $state(false);
	let forking = $state(false);
	let forkError = $state('');

	function getInstallCommand() {
		return `curl -fsSL https://openboot.dev/${data.configUser.username}/${data.config.slug} | bash`;
	}

	function getCliInstallCommand() {
		return `openboot install ${data.configUser.username}/${data.config.slug}`;
	}

	function copyCommand() {
		navigator.clipboard.writeText(getInstallCommand());
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function copyCliCommand() {
		navigator.clipboard.writeText(getCliInstallCommand());
		copiedCli = true;
		setTimeout(() => (copiedCli = false), 2000);
	}

	function getShareUrl() {
		return `https://openboot.dev/${data.configUser.username}/${data.config.slug}`;
	}

	function openShareModal() {
		shareCopied = false;
		showShareModal = true;
	}

	function closeShareModal() {
		showShareModal = false;
	}

	function shareCopyLink() {
		navigator.clipboard.writeText(getShareUrl());
		shareCopied = true;
		setTimeout(() => shareCopied = false, 2000);
	}

	function shareOnTwitter() {
		const text = `My dev stack: ${data.config.name} — set up in minutes with @openbootdotdev`;
		const hashtags = 'OpenBoot,macOS,DevTools';
		const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getShareUrl())}&hashtags=${encodeURIComponent(hashtags)}`;
		window.open(tweetUrl, '_blank', 'width=550,height=420');
	}



	async function forkConfig() {
		forking = true;
		forkError = '';

		try {
			const authCheck = await fetch('/api/user');
			if (!authCheck.ok) {
				window.location.href = `/login?return_to=${encodeURIComponent(window.location.pathname)}`;
				return;
			}

			const forkResponse = await fetch('/api/configs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			name: `${data.config.name} (fork)`,
			description: `Forked from @${data.configUser.username}`,
			base_preset: data.config.base_preset,
			packages: data.config.packages,
			visibility: 'unlisted',
			custom_script: data.config.custom_script || '',
			dotfiles_repo: data.config.dotfiles_repo || '',
			snapshot: data.config.snapshot || null,
			snapshot_at: data.config.snapshot_at || null,
			forked_from: data.config.id
		})
			});

			if (!forkResponse.ok) {
				const error = await forkResponse.json();
				forkError = error.error || 'Failed to fork config';
				forking = false;
				return;
			}

			goto('/dashboard');
		} catch (err) {
			forkError = 'Network error. Please try again.';
			forking = false;
		}
	}

	function getPackageUrl(name: string, type: 'formula' | 'cask' | 'npm'): string {
		if (type === 'npm') return `https://www.npmjs.com/package/${name}`;
		if (type === 'cask') return `https://formulae.brew.sh/cask/${name}`;
		return `https://formulae.brew.sh/formula/${name}`;
	}

	const snapshot = $derived(data.config.snapshot || {});
	const snapshotPkgs = $derived(snapshot.packages || {});
	const macosPrefs = $derived(snapshot.macos_prefs || []);
	const shell = $derived(snapshot.shell || {});
	const git = $derived(snapshot.git || {});
	const devTools = $derived(snapshot.dev_tools || []);

	const configPkgs: { name: string; type: string }[] = $derived(Array.isArray(data.config.packages)
		? data.config.packages.map((p: any) => (typeof p === 'string' ? { name: p, type: 'formula' } : p))
		: []);

	const hasOpenBootPackage = $derived(configPkgs.some((p: any) => p.name === 'openboot'));

	const configCli = $derived(configPkgs.filter((p: any) => p.type !== 'cask' && p.type !== 'npm'));
	const configApps = $derived(configPkgs.filter((p: any) => p.type === 'cask'));
	const configNpm = $derived(configPkgs.filter((p: any) => p.type === 'npm'));

	const formulae = $derived(snapshotPkgs.formulae?.length ? snapshotPkgs.formulae : configCli.map((p: any) => p.name));
	const casks = $derived(snapshotPkgs.casks?.length ? snapshotPkgs.casks : configApps.map((p: any) => p.name));
	const taps = $derived(snapshotPkgs.taps || []);
	const hasSnapshot = $derived(!!(snapshotPkgs.formulae?.length || snapshotPkgs.casks?.length));

	const tabs = $derived([
		{ id: 'overview', label: 'Overview' },
		{ id: 'formulae', label: 'CLI' },
		{ id: 'casks', label: 'Apps' },
		...(configNpm.length > 0 ? [{ id: 'npm', label: 'NPM' }] : []),
		...(macosPrefs.length > 0 ? [{ id: 'macos', label: 'macOS' }] : []),
		...(shell.default || shell.oh_my_zsh ? [{ id: 'shell', label: 'Shell' }] : [])
	]);
</script>

<svelte:head>
	<title>{data.config.name} - OpenBoot</title>
	<meta name="description" content={data.config.description || `Install ${data.config.name} with OpenBoot`} />
	<meta property="og:title" content="{data.config.name} - OpenBoot" />
	<meta property="og:description" content={data.config.description || `Install ${data.config.name} with OpenBoot — one command to set up your Mac.`} />
	<meta property="og:url" content="https://openboot.dev/{data.configUser.username}/{data.config.slug}" />
	<meta property="og:image" content="https://openboot.dev/{data.configUser.username}/{data.config.slug}/og" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://openboot.dev/{data.configUser.username}/{data.config.slug}/og" />
</svelte:head>

<main class="container">
	<section class="hero">
		<div class="hero-header">
			<button class="share-btn" onclick={openShareModal}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
				Share
			</button>
		</div>
		<div class="config-meta">
			{#if data.configUser.avatar_url}
				<img src={data.configUser.avatar_url} alt={data.configUser.username} class="user-avatar" />
			{:else}
				<div class="user-avatar-placeholder">{data.configUser.username.charAt(0).toUpperCase()}</div>
			{/if}
			<span class="author">@{data.configUser.username}</span>
			<span class="separator">/</span>
			<span class="config-slug">{data.config.slug}</span>
		</div>
		<h1 class="config-name">{data.config.name}</h1>
		{#if data.config.description}
			<p class="config-description">{data.config.description}</p>
		{/if}

		<div class="install-box">
			<div class="install-label">Install with one command</div>
			{#if hasOpenBootPackage}
				<div class="install-command recommended">
					<div class="command-label">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
						Recommended (with OpenBoot installed)
					</div>
					<div class="command-row">
						<code>{getCliInstallCommand()}</code>
						<button class="copy-btn" onclick={copyCliCommand}>
							{copiedCli ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</div>
				<div class="install-command">
					<div class="command-label">First time installation</div>
					<div class="command-row">
						<code>{getInstallCommand()}</code>
						<button class="copy-btn" onclick={copyCommand}>
							{copied ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</div>
			{:else}
				<div class="install-command single">
					<div class="command-row">
						<code>{getInstallCommand()}</code>
						<button class="copy-btn" onclick={copyCommand}>
							{copied ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</div>
			{/if}
			<button class="fork-btn" onclick={forkConfig} disabled={forking}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>
				{forking ? 'Forking...' : 'Fork Config'}
			</button>
			{#if forkError}
				<div class="fork-error">{forkError}</div>
			{/if}
		</div>

		<div class="stats">
			<div class="stat">
				<span class="stat-value">{formulae.length}</span>
				<span class="stat-label">CLI</span>
			</div>
			<div class="stat">
				<span class="stat-value">{casks.length}</span>
				<span class="stat-label">Apps</span>
			</div>
			{#if configNpm.length > 0}
				<div class="stat">
					<span class="stat-value">{configNpm.length}</span>
					<span class="stat-label">NPM</span>
				</div>
			{/if}
			{#if devTools.length > 0}
				<div class="stat">
					<span class="stat-value">{devTools.length}</span>
					<span class="stat-label">Dev Tools</span>
				</div>
			{/if}
			{#if macosPrefs.length > 0}
				<div class="stat">
					<span class="stat-value">{macosPrefs.length}</span>
					<span class="stat-label">Preferences</span>
				</div>
			{/if}
			<div class="stat">
				<span class="stat-value">{data.config.install_count || 0}</span>
				<span class="stat-label">Installs</span>
			</div>
		</div>
	</section>

	<nav class="tabs">
		{#each tabs as tab}
			<button
				class="tab"
				class:active={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
				{#if tab.id === 'formulae' && formulae.length > 0}
					<span class="tab-count">{formulae.length}</span>
				{:else if tab.id === 'casks' && casks.length > 0}
					<span class="tab-count">{casks.length}</span>
				{:else if tab.id === 'npm' && configNpm.length > 0}
					<span class="tab-count">{configNpm.length}</span>
				{:else if tab.id === 'macos' && macosPrefs.length > 0}
					<span class="tab-count">{macosPrefs.length}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<section class="tab-content">
		{#if activeTab === 'overview'}
			<div class="overview">
				<div class="overview-categories">
					{#if formulae.length > 0}
						<div class="category-card">
							<div class="category-header">
								<span class="category-icon">⌘</span>
								<div>
									<h3 class="category-title">CLI Tools</h3>
									<span class="category-count">{formulae.length} packages</span>
								</div>
							</div>
							<div class="category-items">
								{#each formulae.slice(0, 6) as pkg}
									<a href={getPackageUrl(pkg, 'formula')} target="_blank" rel="noopener noreferrer" class="category-item">
										<span class="item-name">{pkg}</span>
										{#if data.packageDescriptions[pkg]}
											<span class="item-desc">{data.packageDescriptions[pkg]}</span>
										{/if}
									</a>
								{/each}
							</div>
							{#if formulae.length > 6}
								<button class="see-all" onclick={() => activeTab = 'formulae'}>See all {formulae.length} →</button>
							{/if}
						</div>
					{/if}

					{#if casks.length > 0}
						<div class="category-card apps-showcase">
							<div class="category-header">
								<span class="category-icon">🖥</span>
								<div>
									<h3 class="category-title">Applications</h3>
									<span class="category-count">{casks.length} apps</span>
								</div>
							</div>
							<div class="apps-grid">
								{#each casks.slice(0, 6) as pkg, i}
									<a href={getPackageUrl(pkg, 'cask')} target="_blank" rel="noopener noreferrer" class="app-card" data-index={i}>
										<div class="app-icon">{pkg.charAt(0).toUpperCase()}</div>
										<div class="app-info">
											<span class="app-name">{pkg}</span>
											{#if data.packageDescriptions[pkg]}
												<span class="app-desc">{data.packageDescriptions[pkg]}</span>
											{/if}
										</div>
									</a>
								{/each}
							</div>
							{#if casks.length > 6}
								<button class="see-all" onclick={() => activeTab = 'casks'}>See all {casks.length} →</button>
							{/if}
						</div>
					{/if}

					{#if configNpm.length > 0}
						<div class="category-card">
							<div class="category-header">
								<span class="category-icon">📦</span>
								<div>
									<h3 class="category-title">NPM Global</h3>
									<span class="category-count">{configNpm.length} packages</span>
								</div>
							</div>
							<div class="category-items">
								{#each configNpm.slice(0, 6) as pkg}
									<a href={getPackageUrl(pkg.name, 'npm')} target="_blank" rel="noopener noreferrer" class="category-item">
										<span class="item-name">{pkg.name}</span>
										{#if data.packageDescriptions[pkg.name]}
											<span class="item-desc">{data.packageDescriptions[pkg.name]}</span>
										{/if}
									</a>
								{/each}
							</div>
							{#if configNpm.length > 6}
								<button class="see-all" onclick={() => activeTab = 'npm'}>See all {configNpm.length} →</button>
							{/if}
						</div>
					{/if}
				</div>

				<div class="overview-info">
					<div class="info-card">
						<h4 class="info-card-title">Preset</h4>
						<span class="info-card-value">{data.config.base_preset}</span>
						<p class="info-card-desc">Base configuration template</p>
					</div>

					{#if data.config.dotfiles_repo}
						<div class="info-card">
							<h4 class="info-card-title">Dotfiles</h4>
							<a href={data.config.dotfiles_repo} target="_blank" rel="noopener noreferrer" class="info-card-link">{data.config.dotfiles_repo.replace('https://github.com/', '')}</a>
							<p class="info-card-desc">Deployed via GNU Stow</p>
						</div>
					{/if}

					{#if shell.default || shell.oh_my_zsh}
						<div class="info-card">
							<h4 class="info-card-title">Shell</h4>
							<span class="info-card-value">{shell.default || 'zsh'}{shell.oh_my_zsh ? ' + Oh My Zsh' : ''}</span>
							{#if shell.theme}
								<p class="info-card-desc">Theme: {shell.theme}</p>
							{/if}
							{#if shell.plugins && shell.plugins.length > 0}
								<div class="info-card-tags">
									{#each shell.plugins.slice(0, 5) as plugin}
										<span class="mini-tag">{plugin}</span>
									{/each}
									{#if shell.plugins.length > 5}
										<span class="mini-tag muted">+{shell.plugins.length - 5}</span>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

		{:else if activeTab === 'formulae'}
			{#if formulae.length === 0}
				<div class="empty-state">No CLI packages configured.</div>
			{:else}
				<div class="package-grid">
					{#each formulae as pkg}
						<a href={getPackageUrl(pkg, 'formula')} target="_blank" rel="noopener noreferrer" class="package-item" data-tooltip={data.packageDescriptions[pkg] || ''}>{pkg}</a>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'casks'}
			{#if casks.length === 0}
				<div class="empty-state">No apps configured.</div>
			{:else}
				<div class="package-grid">
					{#each casks as pkg}
						<a href={getPackageUrl(pkg, 'cask')} target="_blank" rel="noopener noreferrer" class="package-item" data-tooltip={data.packageDescriptions[pkg] || ''}>{pkg}</a>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'npm'}
			{#if configNpm.length === 0}
				<div class="empty-state">No npm packages configured.</div>
			{:else}
				<div class="package-grid">
					{#each configNpm as pkg}
						<a href={getPackageUrl(pkg.name, 'npm')} target="_blank" rel="noopener noreferrer" class="package-item" data-tooltip={data.packageDescriptions[pkg.name] || ''}>{pkg.name}</a>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'macos'}
			{#if macosPrefs.length === 0}
				<div class="empty-state">No macOS preferences in this snapshot.</div>
			{:else}
				<div class="prefs-list">
					{#each macosPrefs as pref}
						<div class="pref-item">
							<div class="pref-header">
								<span class="pref-key">{pref.key}</span>
								<span class="pref-domain">{pref.domain}</span>
							</div>
							{#if pref.desc}
								<p class="pref-desc">{pref.desc}</p>
							{/if}
							<code class="pref-value">{pref.value}</code>
						</div>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'shell'}
			<div class="shell-detail">
				{#if !shell.default && !shell.oh_my_zsh}
					<div class="empty-state">No shell configuration in this snapshot.</div>
				{:else}
					<div class="overview-card wide">
						<h3 class="card-title">Shell Configuration</h3>
						<div class="shell-info">
							{#if shell.default}
								<div class="info-row">
									<span class="info-label">Default Shell</span>
									<span class="info-value mono">{shell.default}</span>
								</div>
							{/if}
							{#if shell.oh_my_zsh}
								<div class="info-row">
									<span class="info-label">Oh My Zsh</span>
									<span class="info-value badge">Installed</span>
								</div>
							{/if}
							{#if shell.theme}
								<div class="info-row">
									<span class="info-label">Theme</span>
									<span class="info-value mono">{shell.theme}</span>
								</div>
							{/if}
						</div>
						{#if shell.plugins && shell.plugins.length > 0}
							<h4 class="sub-title">Plugins ({shell.plugins.length})</h4>
							<div class="plugin-grid">
								{#each shell.plugins as plugin}
									<span class="plugin-tag">{plugin}</span>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</section>

	<section class="cta-section">
		<div class="cta-card">
			<div class="cta-content">
				<h3 class="cta-title">Like this setup?</h3>
				<p class="cta-desc">Create your own config and share it with your team in minutes.</p>
			</div>
			<a href="/login?return_to=/dashboard" class="cta-button">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
				</svg>
				Create Your Own
			</a>
		</div>
	</section>
</main>

{#if showShareModal}
	<div class="share-overlay" onclick={closeShareModal} onkeydown={(e) => e.key === 'Escape' && closeShareModal()} role="dialog" tabindex="0">
		<div class="share-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
			<div class="share-modal-header">
				<h3 class="share-modal-title">Share Configuration</h3>
				<button class="share-close-btn" onclick={closeShareModal}>&times;</button>
			</div>
			<div class="share-modal-body">
				<div class="share-url-display">
					<code>{getShareUrl()}</code>
				</div>

				<div class="share-options">
					<button class="share-option" onclick={shareCopyLink}>
						<span class="share-option-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
						</span>
						<span class="share-option-label">{shareCopied ? 'Copied!' : 'Copy Link'}</span>
					</button>

					<button class="share-option" onclick={shareOnTwitter}>
						<span class="share-option-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
						</span>
						<span class="share-option-label">Share on X</span>
					</button>

					</div>
			</div>
		</div>
	</div>
{/if}

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && showShareModal) closeShareModal(); }} />

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 80px 24px 40px;
	}

	.hero {
		text-align: center;
		margin-bottom: 40px;
		position: relative;
	}

	.hero-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 16px;
	}

	.config-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 0.9rem;
		color: var(--text-muted);
		margin-bottom: 8px;
	}

	.user-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 2px solid var(--border);
		object-fit: cover;
	}

	.user-avatar-placeholder {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 2px solid var(--border);
		background: var(--accent);
		color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.2rem;
	}

	.author {
		color: var(--accent);
	}

	.separator {
		color: var(--text-muted);
	}

	.config-slug {
		font-family: 'JetBrains Mono', monospace;
	}

	.config-name {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 8px;
	}

	.config-description {
		color: var(--text-secondary);
		font-size: 1.1rem;
		margin-bottom: 24px;
	}

	.install-box {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 24px;
	}

	.install-label {
		font-size: 0.8rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 12px;
	}

	.install-command {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px 16px;
		margin-bottom: 12px;
	}

	.install-command.single {
		flex-direction: row;
		align-items: center;
		gap: 12px;
	}

	.install-command:last-of-type {
		margin-bottom: 16px;
	}

	.install-command.recommended {
		background: color-mix(in srgb, var(--accent) 5%, var(--bg-tertiary));
		border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
	}

	.command-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.command-label svg {
		color: var(--accent);
	}

	.command-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.install-command code {
		flex: 1;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--accent);
		word-break: break-all;
	}

	.copy-btn {
		background: var(--accent);
		color: #000;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.copy-btn:hover {
		background: var(--accent-hover);
	}

	.fork-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		margin-top: 12px;
		padding: 10px 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.fork-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--bg-secondary);
	}

	.fork-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.fork-error {
		margin-top: 8px;
		padding: 8px 12px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 6px;
		color: #ef4444;
		font-size: 0.85rem;
		text-align: center;
	}

	.stats {
		display: flex;
		justify-content: center;
		gap: 32px;
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent);
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.tabs {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 24px;
		overflow-x: auto;
	}

	.tab {
		background: none;
		border: none;
		padding: 12px 16px;
		font-size: 0.9rem;
		color: var(--text-secondary);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text-primary);
	}

	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	.tab-count {
		background: var(--bg-tertiary);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.tab.active .tab-count {
		background: var(--accent);
		color: #000;
	}

	.tab-content {
		min-height: 300px;
	}

	.overview-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
	}

	.overview-card.wide {
		grid-column: 1 / -1;
	}

	.card-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 16px;
		color: var(--text-primary);
	}

	.sub-title {
		font-size: 0.9rem;
		font-weight: 500;
		margin-top: 20px;
		margin-bottom: 12px;
		color: var(--text-secondary);
	}

	.shell-info {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.info-label {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.info-value {
		font-size: 0.85rem;
		color: var(--text-primary);
	}

	.info-value.mono {
		font-family: 'JetBrains Mono', monospace;
	}

	.info-value.badge {
		background: var(--accent);
		color: #000;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.plugin-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.plugin-tag {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 4px 10px;
		border-radius: 4px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
	}

	.package-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 8px;
	}

	.package-item {
		display: block;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 10px 14px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-primary);
		text-decoration: none;
		transition: border-color 0.2s, background 0.2s;
	}

	.package-item:hover {
		border-color: var(--accent);
		background: var(--bg-tertiary);
	}

	.package-item {
		position: relative;
	}

	.package-item[data-tooltip]:not([data-tooltip=""])::after {
		content: attr(data-tooltip);
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 6px 10px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-family: 'Outfit', sans-serif;
		white-space: nowrap;
		max-width: 280px;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s;
		z-index: 10;
	}

	.package-item[data-tooltip]:not([data-tooltip=""]):hover::after {
		opacity: 1;
	}

	.overview {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.overview-categories {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
	}

	.category-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
	}

	.category-card.apps-showcase {
		grid-column: 1 / -1;
	}

	.apps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
	}

	.app-card {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 16px;
		background: var(--bg-tertiary);
		border: 2px solid transparent;
		border-radius: 10px;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.app-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--accent);
		opacity: 0;
		transition: opacity 0.2s;
	}

	.app-card:hover {
		background: var(--bg-secondary);
		border-color: var(--accent);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.app-card:hover::before {
		opacity: 1;
	}

	.app-card[data-index="0"] { border-color: rgba(34, 197, 94, 0.2); }
	.app-card[data-index="1"] { border-color: rgba(59, 130, 246, 0.2); }
	.app-card[data-index="2"] { border-color: rgba(168, 85, 247, 0.2); }
	.app-card[data-index="3"] { border-color: rgba(251, 146, 60, 0.2); }
	.app-card[data-index="4"] { border-color: rgba(236, 72, 153, 0.2); }
	.app-card[data-index="5"] { border-color: rgba(14, 165, 233, 0.2); }

	.app-icon {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.5rem;
		flex-shrink: 0;
		background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
		color: #000;
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
	}

	.app-card[data-index="1"] .app-icon {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
	}

	.app-card[data-index="2"] .app-icon {
		background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
		box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
	}

	.app-card[data-index="3"] .app-icon {
		background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
		box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2);
	}

	.app-card[data-index="4"] .app-icon {
		background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
		box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
	}

	.app-card[data-index="5"] .app-icon {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
	}

	.app-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.app-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.app-desc {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.category-icon {
		font-size: 1.5rem;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border-radius: 10px;
	}

	.category-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.category-count {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.category-items {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.category-item {
		display: flex;
		flex-direction: column;
		padding: 8px 10px;
		border-radius: 6px;
		transition: background 0.15s;
		text-decoration: none;
		color: inherit;
	}

	.category-item:hover {
		background: var(--bg-tertiary);
	}

	.item-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-primary);
	}

	.item-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.see-all {
		display: block;
		width: 100%;
		background: none;
		border: none;
		padding: 10px;
		margin-top: 8px;
		color: var(--accent);
		font-size: 0.8rem;
		cursor: pointer;
		text-align: center;
		border-radius: 6px;
		transition: background 0.15s;
	}

	.see-all:hover {
		background: var(--bg-tertiary);
	}

	.overview-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	.info-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 16px;
	}

	.info-card-title {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 6px;
	}

	.info-card-value {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		display: block;
	}

	.info-card-link {
		font-size: 0.85rem;
		color: var(--accent);
		text-decoration: none;
		word-break: break-all;
	}

	.info-card-link:hover {
		text-decoration: underline;
	}

	.info-card-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.info-card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 8px;
	}

	.mini-tag {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 2px 8px;
		border-radius: 4px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
	}

	.mini-tag.muted {
		color: var(--text-muted);
	}

	.prefs-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.pref-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 16px;
	}

	.pref-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.pref-key {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.pref-domain {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.pref-desc {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.pref-value {
		display: block;
		background: var(--bg-tertiary);
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 0.8rem;
		color: var(--accent);
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: var(--text-muted);
	}

	.shell-detail {
		max-width: 600px;
	}

	.share-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-family: inherit;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.share-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.share-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 20px;
	}

	.share-modal {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		width: 100%;
		max-width: 420px;
		overflow-y: auto;
	}

	.share-modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.share-modal-title {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.share-close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px 8px;
	}

	.share-close-btn:hover {
		color: var(--text-primary);
	}

	.share-modal-body {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.share-url-display {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px 16px;
	}

	.share-url-display code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--accent);
		word-break: break-all;
	}

	.share-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.share-option {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.share-option:hover {
		border-color: var(--accent);
		background: var(--bg-secondary);
	}

	.share-option-icon {
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

	.share-option:hover .share-option-icon {
		color: var(--accent);
	}

	.share-option-label {
		font-weight: 500;
	}

	.cta-section {
		margin-top: 48px;
		padding-top: 48px;
		border-top: 1px solid var(--border);
	}

	.cta-card {
		background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(34, 197, 94, 0.05) 100%);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: 16px;
		padding: 32px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		transition: all 0.3s;
	}

	.cta-card:hover {
		border-color: rgba(34, 197, 94, 0.4);
		box-shadow: 0 8px 32px rgba(34, 197, 94, 0.1);
	}

	.cta-content {
		flex: 1;
	}

	.cta-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 8px;
		color: var(--text-primary);
	}

	.cta-desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 14px 28px;
		background: var(--accent);
		color: #000;
		border: none;
		border-radius: 10px;
		font-size: 0.95rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.cta-button:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
	}

	@media (max-width: 600px) {
		.config-name {
			font-size: 1.5rem;
		}

		.stats {
			gap: 20px;
		}

		.install-command {
			flex-direction: column;
			align-items: stretch;
		}

		.install-command code {
			text-align: center;
			margin-bottom: 8px;
		}

		.package-grid {
			grid-template-columns: 1fr;
		}

		.apps-grid {
			grid-template-columns: 1fr;
		}

		.cta-card {
			flex-direction: column;
			text-align: center;
		}

		.cta-button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
