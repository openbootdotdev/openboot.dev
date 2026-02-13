<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let activeSection = $state('overview');
	let copied = $state(false);
	let showShareModal = $state(false);
	let shareCopied = $state(false);
	let forking = $state(false);
	let forkError = $state('');

	function getInstallCommand() {
		return `openboot install ${data.configUser.username}/${data.config.slug}`;
	}

	function copyCommand() {
		navigator.clipboard.writeText(getInstallCommand());
		copied = true;
		setTimeout(() => (copied = false), 2000);
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

	const configCli = $derived(configPkgs.filter((p: any) => p.type !== 'cask' && p.type !== 'npm'));
	const configApps = $derived(configPkgs.filter((p: any) => p.type === 'cask'));
	const configNpm = $derived(configPkgs.filter((p: any) => p.type === 'npm'));

	const formulae = $derived(snapshotPkgs.formulae?.length ? snapshotPkgs.formulae : configCli.map((p: any) => p.name));
	const casks = $derived(snapshotPkgs.casks?.length ? snapshotPkgs.casks : configApps.map((p: any) => p.name));
	const taps = $derived(snapshotPkgs.taps || []);
	const hasSnapshot = $derived(!!(snapshotPkgs.formulae?.length || snapshotPkgs.casks?.length));

	const navItems = $derived([
		{ id: 'overview', label: 'Overview', icon: '📋', show: true },
		{ id: 'packages', label: 'Packages', icon: '📦', show: formulae.length > 0 || casks.length > 0 || configNpm.length > 0 },
		{ id: 'dev-tools', label: 'Dev Tools', icon: '🛠', show: devTools.length > 0 },
		{ id: 'custom-script', label: 'Custom Script', icon: '⚡️', show: !!data.config.custom_script },
		{ id: 'git', label: 'Git Config', icon: '🔀', show: Object.keys(git).length > 0 },
		{ id: 'shell', label: 'Shell', icon: '🐚', show: shell.default || shell.oh_my_zsh },
		{ id: 'macos', label: 'macOS', icon: '🍎', show: macosPrefs.length > 0 }
	].filter(item => item.show));

	function highlightBash(code: string): string {
		return code
			.replace(/^(#.*)$/gm, '<span class="comment">$1</span>')
			.replace(/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|export|source|cd|mkdir|chmod|chown|sudo|brew|npm|git|curl|wget)\b/g, '<span class="keyword">$1</span>')
			.replace(/(["'])(.*?)\1/g, '<span class="string">$1$2$1</span>')
			.replace(/(\$\w+|\$\{[^}]+\})/g, '<span class="variable">$1</span>');
	}
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

<div class="page-wrapper">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-bg"></div>
		<div class="hero-content">
			<button class="share-btn" onclick={openShareModal}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
				Share
			</button>

			<div class="config-meta">
				{#if data.configUser.avatar_url}
					<img src={data.configUser.avatar_url} alt={data.configUser.username} class="user-avatar" />
				{:else}
					<div class="user-avatar-placeholder">{data.configUser.username.charAt(0).toUpperCase()}</div>
				{/if}
				<div class="meta-text">
					<span class="author">@{data.configUser.username}</span>
					<span class="separator">/</span>
					<span class="config-slug">{data.config.slug}</span>
				</div>
			</div>

			<h1 class="config-name">{data.config.name}</h1>
			{#if data.config.description}
				<p class="config-description">{data.config.description}</p>
			{/if}

			<div class="install-card">
				<div class="install-header">
					<span class="install-icon">⚡️</span>
					<span class="install-label">Install with one command</span>
				</div>
				<div class="install-command">
					<code>{getInstallCommand()}</code>
					<button class="copy-btn" onclick={copyCommand}>
						{#if copied}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
							Copied
						{:else}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
							Copy
						{/if}
					</button>
				</div>
				<button class="fork-btn" onclick={forkConfig} disabled={forking}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>
					{forking ? 'Forking...' : 'Fork This Config'}
				</button>
				{#if forkError}
					<div class="fork-error">{forkError}</div>
				{/if}
			</div>

			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-icon">⌘</div>
					<div class="stat-content">
						<div class="stat-value">{formulae.length}</div>
						<div class="stat-label">CLI Tools</div>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">🖥</div>
					<div class="stat-content">
						<div class="stat-value">{casks.length}</div>
						<div class="stat-label">Applications</div>
					</div>
				</div>
				{#if configNpm.length > 0}
					<div class="stat-card">
						<div class="stat-icon">📦</div>
						<div class="stat-content">
							<div class="stat-value">{configNpm.length}</div>
							<div class="stat-label">NPM Packages</div>
						</div>
					</div>
				{/if}
				{#if devTools.length > 0}
					<div class="stat-card">
						<div class="stat-icon">🛠</div>
						<div class="stat-content">
							<div class="stat-value">{devTools.length}</div>
							<div class="stat-label">Dev Tools</div>
						</div>
					</div>
				{/if}
				<div class="stat-card">
					<div class="stat-icon">📥</div>
					<div class="stat-content">
						<div class="stat-value">{data.config.install_count || 0}</div>
						<div class="stat-label">Installs</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content -->
	<div class="content-wrapper">
		<!-- Sidebar Navigation -->
		<aside class="sidebar">
			<nav class="nav-menu">
				{#each navItems as item}
					<button
						class="nav-item"
						class:active={activeSection === item.id}
						onclick={() => (activeSection = item.id)}
					>
						<span class="nav-icon">{item.icon}</span>
						<span class="nav-label">{item.label}</span>
					</button>
				{/each}
			</nav>
		</aside>

		<!-- Content Area -->
		<main class="main-content">
			{#if activeSection === 'overview'}
				<div class="section-header">
					<h2 class="section-title">Configuration Overview</h2>
					<p class="section-desc">Complete summary of this development environment setup</p>
				</div>

				<div class="cards-grid">
					<!-- Base Preset Card -->
					<div class="info-card">
						<div class="card-icon">🎯</div>
						<div class="card-body">
							<h3 class="card-title">Base Preset</h3>
							<div class="card-value">{data.config.base_preset}</div>
							<p class="card-desc">Foundation template for this configuration</p>
						</div>
					</div>

					<!-- Dotfiles Card -->
					{#if data.config.dotfiles_repo}
						<div class="info-card highlight">
							<div class="card-icon">📁</div>
							<div class="card-body">
								<h3 class="card-title">Dotfiles Repository</h3>
								<a href={data.config.dotfiles_repo} target="_blank" rel="noopener noreferrer" class="card-link">
									{data.config.dotfiles_repo.replace('https://github.com/', '')}
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
								</a>
								<p class="card-desc">Deployed automatically via GNU Stow</p>
							</div>
						</div>
					{/if}

					<!-- Shell Card -->
					{#if shell.default || shell.oh_my_zsh}
						<div class="info-card">
							<div class="card-icon">🐚</div>
							<div class="card-body">
								<h3 class="card-title">Shell Configuration</h3>
								<div class="card-value">{shell.default || 'zsh'}{shell.oh_my_zsh ? ' + Oh My Zsh' : ''}</div>
								{#if shell.theme}
									<p class="card-desc">Theme: <span class="mono">{shell.theme}</span></p>
								{/if}
								{#if shell.plugins && shell.plugins.length > 0}
									<div class="tag-list">
										{#each shell.plugins.slice(0, 4) as plugin}
											<span class="tag">{plugin}</span>
										{/each}
										{#if shell.plugins.length > 4}
											<span class="tag muted">+{shell.plugins.length - 4} more</span>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Snapshot Metadata -->
					{#if data.config.snapshot_at}
						<div class="info-card">
							<div class="card-icon">📸</div>
							<div class="card-body">
								<h3 class="card-title">Snapshot</h3>
								<div class="card-value">{new Date(data.config.snapshot_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
								<p class="card-desc">Captured from live system</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Quick Package Preview -->
				<div class="preview-section">
					<h3 class="preview-title">Package Summary</h3>
					<div class="preview-grid">
						{#if formulae.length > 0}
							<div class="preview-card">
								<div class="preview-header">
									<span class="preview-icon">⌘</span>
									<span class="preview-label">CLI Tools ({formulae.length})</span>
								</div>
								<div class="preview-list">
									{#each formulae.slice(0, 8) as pkg}
										<span class="preview-item">{pkg}</span>
									{/each}
									{#if formulae.length > 8}
										<span class="preview-more">+{formulae.length - 8} more</span>
									{/if}
								</div>
							</div>
						{/if}

						{#if casks.length > 0}
							<div class="preview-card">
								<div class="preview-header">
									<span class="preview-icon">🖥</span>
									<span class="preview-label">Applications ({casks.length})</span>
								</div>
								<div class="preview-list">
									{#each casks.slice(0, 8) as pkg}
										<span class="preview-item">{pkg}</span>
									{/each}
									{#if casks.length > 8}
										<span class="preview-more">+{casks.length - 8} more</span>
									{/if}
								</div>
							</div>
						{/if}

						{#if configNpm.length > 0}
							<div class="preview-card">
								<div class="preview-header">
									<span class="preview-icon">📦</span>
									<span class="preview-label">NPM Packages ({configNpm.length})</span>
								</div>
								<div class="preview-list">
									{#each configNpm.slice(0, 8) as pkg}
										<span class="preview-item">{pkg.name}</span>
									{/each}
									{#if configNpm.length > 8}
										<span class="preview-more">+{configNpm.length - 8} more</span>
									{/if}
								</div>
							</div>
						{/if}

						{#if taps.length > 0}
							<div class="preview-card">
								<div class="preview-header">
									<span class="preview-icon">🚰</span>
									<span class="preview-label">Homebrew Taps ({taps.length})</span>
								</div>
								<div class="preview-list">
									{#each taps as tap}
										<span class="preview-item">{tap}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

			{:else if activeSection === 'packages'}
				<div class="section-header">
					<h2 class="section-title">Packages & Applications</h2>
					<p class="section-desc">All software that will be installed</p>
				</div>

				{#if formulae.length > 0}
					<div class="package-section">
						<div class="package-section-header">
							<span class="section-icon">⌘</span>
							<h3 class="package-section-title">CLI Tools</h3>
							<span class="package-count">{formulae.length}</span>
						</div>
						<div class="package-grid">
							{#each formulae as pkg}
								<a href={getPackageUrl(pkg, 'formula')} target="_blank" rel="noopener noreferrer" class="package-item">
									<span class="package-name">{pkg}</span>
									{#if data.packageDescriptions[pkg]}
										<span class="package-desc">{data.packageDescriptions[pkg]}</span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/if}

				{#if casks.length > 0}
					<div class="package-section">
						<div class="package-section-header">
							<span class="section-icon">🖥</span>
							<h3 class="package-section-title">Applications</h3>
							<span class="package-count">{casks.length}</span>
						</div>
						<div class="package-grid">
							{#each casks as pkg}
								<a href={getPackageUrl(pkg, 'cask')} target="_blank" rel="noopener noreferrer" class="package-item">
									<span class="package-name">{pkg}</span>
									{#if data.packageDescriptions[pkg]}
										<span class="package-desc">{data.packageDescriptions[pkg]}</span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/if}

				{#if configNpm.length > 0}
					<div class="package-section">
						<div class="package-section-header">
							<span class="section-icon">📦</span>
							<h3 class="package-section-title">NPM Global Packages</h3>
							<span class="package-count">{configNpm.length}</span>
						</div>
						<div class="package-grid">
							{#each configNpm as pkg}
								<a href={getPackageUrl(pkg.name, 'npm')} target="_blank" rel="noopener noreferrer" class="package-item">
									<span class="package-name">{pkg.name}</span>
									{#if data.packageDescriptions[pkg.name]}
										<span class="package-desc">{data.packageDescriptions[pkg.name]}</span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/if}

				{#if taps.length > 0}
					<div class="package-section">
						<div class="package-section-header">
							<span class="section-icon">🚰</span>
							<h3 class="package-section-title">Homebrew Taps</h3>
							<span class="package-count">{taps.length}</span>
						</div>
						<div class="taps-list">
							{#each taps as tap}
								<div class="tap-item">
									<span class="tap-name">{tap}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

			{:else if activeSection === 'dev-tools'}
				<div class="section-header">
					<h2 class="section-title">Development Tools</h2>
					<p class="section-desc">Programming languages and development environments</p>
				</div>

				{#if devTools.length === 0}
					<div class="empty-state">
						<div class="empty-icon">🛠</div>
						<p>No development tools configured</p>
					</div>
				{:else}
					<div class="dev-tools-grid">
						{#each devTools as tool}
							<div class="dev-tool-card">
								<div class="tool-icon">{tool.charAt(0).toUpperCase()}</div>
								<div class="tool-info">
									<div class="tool-name">{tool}</div>
									{#if tool === 'node'}
										<div class="tool-desc">JavaScript runtime environment</div>
									{:else if tool === 'python'}
										<div class="tool-desc">Python programming language</div>
									{:else if tool === 'ruby'}
										<div class="tool-desc">Ruby programming language</div>
									{:else if tool === 'go'}
										<div class="tool-desc">Go programming language</div>
									{:else if tool === 'rust'}
										<div class="tool-desc">Rust programming language</div>
									{:else if tool === 'java'}
										<div class="tool-desc">Java development kit</div>
									{:else}
										<div class="tool-desc">Development tool</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}

			{:else if activeSection === 'custom-script'}
				<div class="section-header">
					<h2 class="section-title">Custom Installation Script</h2>
					<p class="section-desc">Additional commands executed after package installation</p>
				</div>

				{#if !data.config.custom_script}
					<div class="empty-state">
						<div class="empty-icon">⚡️</div>
						<p>No custom script configured</p>
					</div>
				{:else}
					<div class="code-card">
						<div class="code-header">
							<div class="code-header-left">
								<span class="code-icon">⚡️</span>
								<span class="code-title">custom-script.sh</span>
							</div>
							<button class="code-copy-btn" onclick={() => {
								navigator.clipboard.writeText(data.config.custom_script || '');
								const btn = event?.currentTarget as HTMLButtonElement;
								if (btn) {
									btn.textContent = 'Copied!';
									setTimeout(() => btn.textContent = 'Copy', 2000);
								}
							}}>Copy</button>
						</div>
						<pre class="code-content"><code>{@html highlightBash(data.config.custom_script)}</code></pre>
					</div>
				{/if}

			{:else if activeSection === 'git'}
				<div class="section-header">
					<h2 class="section-title">Git Configuration</h2>
					<p class="section-desc">Version control settings and preferences</p>
				</div>

				{#if Object.keys(git).length === 0}
					<div class="empty-state">
						<div class="empty-icon">🔀</div>
						<p>No git configuration in snapshot</p>
					</div>
				{:else}
					<div class="config-grid">
						{#each Object.entries(git) as [key, value]}
							<div class="config-item">
								<div class="config-key">{key}</div>
								<div class="config-value">{value}</div>
							</div>
						{/each}
					</div>
				{/if}

			{:else if activeSection === 'shell'}
				<div class="section-header">
					<h2 class="section-title">Shell Configuration</h2>
					<p class="section-desc">Terminal shell settings and customizations</p>
				</div>

				{#if !shell.default && !shell.oh_my_zsh}
					<div class="empty-state">
						<div class="empty-icon">🐚</div>
						<p>No shell configuration in snapshot</p>
					</div>
				{:else}
					<div class="shell-config">
						<div class="config-grid">
							{#if shell.default}
								<div class="config-item">
									<div class="config-key">Default Shell</div>
									<div class="config-value mono">{shell.default}</div>
								</div>
							{/if}
							{#if shell.oh_my_zsh}
								<div class="config-item">
									<div class="config-key">Oh My Zsh</div>
									<div class="config-value badge">Installed</div>
								</div>
							{/if}
							{#if shell.theme}
								<div class="config-item">
									<div class="config-key">Theme</div>
									<div class="config-value mono">{shell.theme}</div>
								</div>
							{/if}
						</div>

						{#if shell.plugins && shell.plugins.length > 0}
							<div class="plugins-section">
								<h3 class="plugins-title">Plugins ({shell.plugins.length})</h3>
								<div class="plugins-grid">
									{#each shell.plugins as plugin}
										<div class="plugin-item">{plugin}</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

			{:else if activeSection === 'macos'}
				<div class="section-header">
					<h2 class="section-title">macOS Preferences</h2>
					<p class="section-desc">System defaults and configuration settings</p>
				</div>

				{#if macosPrefs.length === 0}
					<div class="empty-state">
						<div class="empty-icon">🍎</div>
						<p>No macOS preferences in snapshot</p>
					</div>
				{:else}
					<div class="prefs-list">
						{#each macosPrefs as pref}
							<div class="pref-card">
								<div class="pref-header">
									<span class="pref-key">{pref.key}</span>
									<span class="pref-domain">{pref.domain}</span>
								</div>
								{#if pref.desc}
									<p class="pref-desc">{pref.desc}</p>
								{/if}
								<div class="pref-value">{pref.value}</div>
							</div>
						{/each}
					</div>
				{/if}
			{/if}

			<!-- CTA Section -->
			<section class="cta-section">
				<div class="cta-card">
					<div class="cta-icon">✨</div>
					<div class="cta-content">
						<h3 class="cta-title">Create Your Own Configuration</h3>
						<p class="cta-desc">Build and share your perfect development environment in minutes</p>
					</div>
					<a href="/login?return_to=/dashboard" class="cta-button">
						Get Started
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
					</a>
				</div>
			</section>
		</main>
	</div>
</div>

<!-- Share Modal -->
{#if showShareModal}
	<div class="share-overlay" onclick={closeShareModal} onkeydown={(e) => e.key === 'Escape' && closeShareModal()} role="dialog" tabindex="0">
		<div class="share-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
			<div class="share-modal-header">
				<h3 class="share-modal-title">Share Configuration</h3>
				<button class="share-close-btn" onclick={closeShareModal}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
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
	:root {
		--gradient-primary: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
		--gradient-accent: linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%);
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
		--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
		--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
		--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.15);
	}

	* {
		box-sizing: border-box;
	}

	.page-wrapper {
		min-height: 100vh;
		background: var(--bg-primary);
	}

	/* Hero Section */
	.hero {
		position: relative;
		padding: 120px 24px 60px;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background: var(--gradient-primary);
		opacity: 0.5;
		z-index: 0;
	}

	.hero-content {
		position: relative;
		z-index: 1;
		max-width: 900px;
		margin: 0 auto;
	}

	.share-btn {
		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		background: var(--bg-secondary);
		backdrop-filter: blur(12px);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-family: inherit;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
	}

	.share-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.config-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.user-avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 3px solid var(--border);
		object-fit: cover;
		box-shadow: var(--shadow-md);
	}

	.user-avatar-placeholder {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 3px solid var(--border);
		background: var(--gradient-accent);
		color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.4rem;
		box-shadow: var(--shadow-md);
	}

	.meta-text {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1rem;
	}

	.author {
		color: var(--accent);
		font-weight: 600;
	}

	.separator {
		color: var(--text-muted);
	}

	.config-slug {
		font-family: 'JetBrains Mono', monospace;
		color: var(--text-primary);
		font-weight: 500;
	}

	.config-name {
		font-size: 2.5rem;
		font-weight: 800;
		text-align: center;
		margin: 0 0 12px;
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1.2;
	}

	.config-description {
		text-align: center;
		color: var(--text-secondary);
		font-size: 1.15rem;
		line-height: 1.6;
		margin: 0 0 32px;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.install-card {
		background: var(--bg-secondary);
		backdrop-filter: blur(12px);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 24px;
		margin-bottom: 32px;
		box-shadow: var(--shadow-lg);
	}

	.install-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
	}

	.install-icon {
		font-size: 1.2rem;
	}

	.install-label {
		font-size: 0.85rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}

	.install-command {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--bg-tertiary);
		border: 2px solid var(--border);
		border-radius: 12px;
		padding: 16px 20px;
		margin-bottom: 12px;
		transition: border-color 0.2s;
	}

	.install-command:hover {
		border-color: var(--accent);
	}

	.install-command code {
		flex: 1;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.95rem;
		color: var(--accent);
		font-weight: 500;
		word-break: break-all;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--accent);
		color: #000;
		border: none;
		padding: 10px 18px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
	}

	.copy-btn:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
	}

	.fork-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 12px 20px;
		background: var(--bg-tertiary);
		border: 2px solid var(--border);
		border-radius: 12px;
		color: var(--text-primary);
		font-size: 0.95rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.fork-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--bg-secondary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.fork-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.fork-error {
		margin-top: 12px;
		padding: 12px 16px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #ef4444;
		font-size: 0.9rem;
		text-align: center;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--bg-secondary);
		backdrop-filter: blur(12px);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 16px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--accent);
	}

	.stat-icon {
		font-size: 1.8rem;
		line-height: 1;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent);
		line-height: 1;
		margin-bottom: 4px;
	}

	.stat-label {
		display: block;
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	/* Content Layout */
	.content-wrapper {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 24px 80px;
		display: grid;
		grid-template-columns: 240px 1fr;
		gap: 32px;
		align-items: start;
	}

	/* Sidebar */
	.sidebar {
		position: sticky;
		top: 100px;
	}

	.nav-menu {
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 8px;
		box-shadow: var(--shadow-sm);
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		text-align: left;
	}

	.nav-item:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.nav-item.active {
		background: var(--accent);
		color: #000;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
	}

	.nav-icon {
		font-size: 1.2rem;
		line-height: 1;
	}

	.nav-label {
		flex: 1;
	}

	/* Main Content */
	.main-content {
		min-width: 0;
	}

	.section-header {
		margin-bottom: 24px;
	}

	.section-title {
		font-size: 1.8rem;
		font-weight: 700;
		margin: 0 0 8px;
		color: var(--text-primary);
	}

	.section-desc {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
	}

	/* Cards Grid */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
		margin-bottom: 32px;
	}

	.info-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
		display: flex;
		gap: 16px;
	}

	.info-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--accent);
	}

	.info-card.highlight {
		background: var(--gradient-primary);
		border-color: rgba(34, 197, 94, 0.3);
	}

	.card-icon {
		font-size: 2rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.card-body {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-size: 0.8rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		margin: 0 0 8px;
	}

	.card-value {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 6px;
	}

	.card-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.95rem;
		color: var(--accent);
		text-decoration: none;
		font-weight: 500;
		word-break: break-all;
		transition: opacity 0.2s;
	}

	.card-link:hover {
		opacity: 0.8;
	}

	.card-desc {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin: 6px 0 0;
		line-height: 1.5;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
	}

	.tag {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 4px 10px;
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: var(--text-primary);
	}

	.tag.muted {
		color: var(--text-muted);
	}

	.mono {
		font-family: 'JetBrains Mono', monospace;
	}

	/* Preview Section */
	.preview-section {
		margin-top: 32px;
	}

	.preview-title {
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0 0 16px;
		color: var(--text-primary);
	}

	.preview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
	}

	.preview-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		box-shadow: var(--shadow-sm);
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border);
	}

	.preview-icon {
		font-size: 1.3rem;
	}

	.preview-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.preview-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.preview-item {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 6px 12px;
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--text-primary);
	}

	.preview-more {
		padding: 6px 12px;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	/* Package Section */
	.package-section {
		margin-bottom: 32px;
	}

	.package-section-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 2px solid var(--border);
	}

	.section-icon {
		font-size: 1.5rem;
	}

	.package-section-title {
		flex: 1;
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}

	.package-count {
		background: var(--accent);
		color: #000;
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 700;
	}

	.package-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
	}

	.package-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 14px 16px;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
	}

	.package-item:hover {
		border-color: var(--accent);
		background: var(--bg-tertiary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.package-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.package-desc {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.taps-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.tap-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 14px 18px;
		box-shadow: var(--shadow-sm);
	}

	.tap-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	/* Dev Tools */
	.dev-tools-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}

	.dev-tool-card {
		display: flex;
		align-items: center;
		gap: 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
	}

	.dev-tool-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--accent);
	}

	.tool-icon {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.5rem;
		background: var(--gradient-accent);
		color: #000;
		flex-shrink: 0;
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
	}

	.tool-info {
		flex: 1;
	}

	.tool-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
		text-transform: capitalize;
	}

	.tool-desc {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	/* Code Card */
	.code-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: var(--shadow-md);
	}

	.code-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		background: var(--bg-tertiary);
		border-bottom: 1px solid var(--border);
	}

	.code-header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.code-icon {
		font-size: 1.2rem;
	}

	.code-title {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.code-copy-btn {
		background: var(--accent);
		color: #000;
		border: none;
		padding: 6px 14px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.code-copy-btn:hover {
		background: var(--accent-hover);
	}

	.code-content {
		margin: 0;
		padding: 24px;
		background: var(--bg-tertiary);
		overflow-x: auto;
	}

	.code-content code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-primary);
	}

	.code-content :global(.comment) {
		color: var(--text-muted);
		font-style: italic;
	}

	.code-content :global(.keyword) {
		color: #c678dd;
		font-weight: 600;
	}

	.code-content :global(.string) {
		color: #98c379;
	}

	.code-content :global(.variable) {
		color: #e5c07b;
	}

	/* Config Grid */
	.config-grid {
		display: grid;
		gap: 12px;
	}

	.config-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 16px 20px;
		box-shadow: var(--shadow-sm);
	}

	.config-key {
		font-size: 0.9rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.config-value {
		font-size: 0.95rem;
		color: var(--text-primary);
		font-weight: 600;
	}

	.config-value.mono {
		font-family: 'JetBrains Mono', monospace;
	}

	.config-value.badge {
		background: var(--accent);
		color: #000;
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 0.8rem;
	}

	/* Shell Config */
	.shell-config {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.plugins-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		box-shadow: var(--shadow-sm);
	}

	.plugins-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 16px;
		color: var(--text-primary);
	}

	.plugins-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 8px;
	}

	.plugin-item {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 10px 14px;
		border-radius: 8px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-primary);
		text-align: center;
	}

	/* Prefs List */
	.prefs-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.pref-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		box-shadow: var(--shadow-sm);
	}

	.pref-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.pref-key {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.pref-domain {
		font-size: 0.8rem;
		color: var(--text-muted);
		background: var(--bg-tertiary);
		padding: 4px 10px;
		border-radius: 6px;
	}

	.pref-desc {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0 0 10px;
		line-height: 1.5;
	}

	.pref-value {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 12px 16px;
		border-radius: 8px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--accent);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 80px 20px;
		color: var(--text-muted);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.empty-state p {
		font-size: 1rem;
		margin: 0;
	}

	/* CTA Section */
	.cta-section {
		margin-top: 64px;
		padding-top: 48px;
		border-top: 1px solid var(--border);
	}

	.cta-card {
		background: var(--gradient-primary);
		border: 2px solid rgba(34, 197, 94, 0.3);
		border-radius: 16px;
		padding: 32px;
		display: flex;
		align-items: center;
		gap: 24px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-md);
	}

	.cta-card:hover {
		border-color: rgba(34, 197, 94, 0.5);
		box-shadow: var(--shadow-xl);
		transform: translateY(-2px);
	}

	.cta-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
	}

	.cta-content {
		flex: 1;
	}

	.cta-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 8px;
		color: var(--text-primary);
	}

	.cta-desc {
		font-size: 1rem;
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
		font-size: 1rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
	}

	.cta-button:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(34, 197, 94, 0.4);
	}

	/* Share Modal */
	.share-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 20px;
		animation: fadeIn 0.2s;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.share-modal {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		width: 100%;
		max-width: 480px;
		overflow: hidden;
		box-shadow: var(--shadow-xl);
		animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.share-modal-header {
		padding: 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.share-modal-title {
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}

	.share-close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px;
		border-radius: 6px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.share-close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
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
		border-radius: 10px;
		padding: 14px 18px;
	}

	.share-url-display code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--accent);
		word-break: break-all;
	}

	.share-options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.share-option {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-size: 0.95rem;
		font-family: inherit;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.share-option:hover {
		border-color: var(--accent);
		background: var(--bg-secondary);
		transform: translateX(4px);
	}

	.share-option-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: var(--bg-secondary);
		border-radius: 8px;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.share-option:hover .share-option-icon {
		color: var(--accent);
	}

	.share-option-label {
		flex: 1;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.content-wrapper {
			grid-template-columns: 1fr;
			gap: 24px;
		}

		.sidebar {
			position: static;
		}

		.nav-menu {
			flex-direction: row;
			overflow-x: auto;
		}

		.nav-item {
			white-space: nowrap;
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding: 100px 20px 40px;
		}

		.config-name {
			font-size: 2rem;
		}

		.config-description {
			font-size: 1rem;
		}

		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		}

		.content-wrapper {
			padding: 0 20px 60px;
		}

		.section-title {
			font-size: 1.5rem;
		}

		.cards-grid {
			grid-template-columns: 1fr;
		}

		.preview-grid {
			grid-template-columns: 1fr;
		}

		.package-grid {
			grid-template-columns: 1fr;
		}

		.dev-tools-grid {
			grid-template-columns: 1fr;
		}

		.cta-card {
			flex-direction: column;
			text-align: center;
			padding: 24px;
		}

		.cta-button {
			width: 100%;
			justify-content: center;
		}

		.install-command {
			flex-direction: column;
			align-items: stretch;
		}

		.copy-btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
