<script lang="ts">
	import type { PageData } from './$types';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { data }: { data: PageData } = $props();

	let activeTab = $state('overview');
	let copied = $state(false);

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'formulae', label: 'Formulae' },
		{ id: 'casks', label: 'Casks' },
		{ id: 'macos', label: 'macOS' },
		{ id: 'shell', label: 'Shell' }
	];

	function getInstallCommand() {
		return `curl -fsSL https://openboot.dev/${data.configUser.username}/${data.config.slug}/install | bash`;
	}

	function copyCommand() {
		navigator.clipboard.writeText(getInstallCommand());
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const snapshot = data.config.snapshot || {};
	const packages = snapshot.packages || {};
	const formulae = packages.formulae || [];
	const casks = packages.casks || [];
	const taps = packages.taps || [];
	const macosPrefs = snapshot.macos_prefs || [];
	const shell = snapshot.shell || {};
	const git = snapshot.git || {};
	const devTools = snapshot.dev_tools || [];
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

<header class="header">
	<a href="/" class="logo">OpenBoot</a>
	<div class="header-right">
		<ThemeToggle />
	</div>
</header>

<main class="container">
	<section class="hero">
		<div class="config-meta">
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
			<div class="install-command">
				<code>{getInstallCommand()}</code>
				<button class="copy-btn" onclick={copyCommand}>
					{copied ? 'Copied!' : 'Copy'}
				</button>
			</div>
		</div>

		<div class="stats">
			<div class="stat">
				<span class="stat-value">{formulae.length}</span>
				<span class="stat-label">Formulae</span>
			</div>
			<div class="stat">
				<span class="stat-value">{casks.length}</span>
				<span class="stat-label">Casks</span>
			</div>
			<div class="stat">
				<span class="stat-value">{devTools.length}</span>
				<span class="stat-label">Dev Tools</span>
			</div>
			<div class="stat">
				<span class="stat-value">{macosPrefs.length}</span>
				<span class="stat-label">Preferences</span>
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
				{:else if tab.id === 'macos' && macosPrefs.length > 0}
					<span class="tab-count">{macosPrefs.length}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<section class="tab-content">
		{#if activeTab === 'overview'}
			<div class="overview-grid">
				{#if devTools.length > 0}
					<div class="overview-card">
						<h3 class="card-title">Dev Tools</h3>
						<div class="tool-list">
							{#each devTools as tool}
								<div class="tool-item">
									<span class="tool-name">{tool.name}</span>
									<span class="tool-version">{tool.version}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if shell.default || shell.oh_my_zsh}
					<div class="overview-card">
						<h3 class="card-title">Shell</h3>
						<div class="shell-info">
							{#if shell.default}
								<div class="info-row">
									<span class="info-label">Shell</span>
									<span class="info-value">{shell.default}</span>
								</div>
							{/if}
							{#if shell.oh_my_zsh}
								<div class="info-row">
									<span class="info-label">Oh My Zsh</span>
									<span class="info-value badge">Enabled</span>
								</div>
							{/if}
							{#if shell.theme}
								<div class="info-row">
									<span class="info-label">Theme</span>
									<span class="info-value">{shell.theme}</span>
								</div>
							{/if}
							{#if shell.plugins && shell.plugins.length > 0}
								<div class="info-row plugins">
									<span class="info-label">Plugins</span>
									<div class="plugin-tags">
										{#each shell.plugins as plugin}
											<span class="plugin-tag">{plugin}</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				{#if taps.length > 0}
					<div class="overview-card">
						<h3 class="card-title">Homebrew Taps</h3>
						<div class="tap-list">
							{#each taps as tap}
								<span class="tap-item">{tap}</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'formulae'}
			{#if formulae.length === 0}
				<div class="empty-state">No formulae in this snapshot.</div>
			{:else}
				<div class="package-grid">
					{#each formulae as pkg}
						<div class="package-item">{pkg}</div>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'casks'}
			{#if casks.length === 0}
				<div class="empty-state">No casks in this snapshot.</div>
			{:else}
				<div class="package-grid">
					{#each casks as pkg}
						<div class="package-item">{pkg}</div>
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
</main>

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

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 40px 24px;
	}

	.hero {
		text-align: center;
		margin-bottom: 40px;
	}

	.config-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		font-size: 0.9rem;
		color: var(--text-muted);
		margin-bottom: 8px;
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
		align-items: center;
		gap: 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px 16px;
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

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
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

	.tool-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tool-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: var(--bg-tertiary);
		border-radius: 6px;
	}

	.tool-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
	}

	.tool-version {
		font-size: 0.8rem;
		color: var(--text-muted);
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

	.info-row.plugins {
		flex-direction: column;
		gap: 8px;
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

	.plugin-tags, .plugin-grid {
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

	.tap-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.tap-item {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.package-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 8px;
	}

	.package-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 10px 14px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
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
	}
</style>
