<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let copied = $state(false);
	let showShareModal = $state(false);
	let shareCopied = $state(false);
	let forking = $state(false);
	let forkError = $state('');
	let showAllApps = $state(false);
	let showAllCli = $state(false);

	function getInstallCommand() {
		if (data.config.alias) {
			return `openboot install ${data.config.alias}`;
		}
		return `openboot install ${data.configUser.username}/${data.config.slug}`;
	}

	function copyCommand() {
		navigator.clipboard.writeText(getInstallCommand());
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function getShareUrl() {
		if (data.config.alias) {
			return `https://openboot.dev/${data.config.alias}`;
		}
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

	function getAppGradient(index: number): string {
		const gradients = [
			'linear-gradient(135deg, #22c55e, #3b82f6)',
			'linear-gradient(135deg, #a855f7, #ec4899)',
			'linear-gradient(135deg, #f97316, #ef4444)',
			'linear-gradient(135deg, #06b6d4, #3b82f6)',
			'linear-gradient(135deg, #eab308, #f97316)',
			'linear-gradient(135deg, #8b5cf6, #6366f1)',
			'linear-gradient(135deg, #10b981, #06b6d4)',
			'linear-gradient(135deg, #f43f5e, #ec4899)',
		];
		return gradients[index % gradients.length];
	}

	function highlightBash(code: string): string {
		return code
			.replace(/^(#.*)$/gm, '<span class="comment">$1</span>')
			.replace(/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|export|source|cd|mkdir|chmod|chown|sudo|brew|npm|git|curl|wget)\b/g, '<span class="keyword">$1</span>')
			.replace(/(["'])(.*?)\1/g, '<span class="string">$1$2$1</span>')
			.replace(/(\$\w+|\$\{[^}]+\})/g, '<span class="variable">$1</span>');
	}

	const snapshot = $derived(data.config.snapshot || {});
	const snapshotPkgs = $derived(snapshot.packages || {});
	const macosPrefs = $derived(snapshot.macos_prefs || []);
	const shell = $derived(snapshot.shell || {});
	const git = $derived(snapshot.git || {});
	const devToolsRaw = $derived(snapshot.dev_tools || []);
	const devTools = $derived(devToolsRaw.map((t: any) => typeof t === 'string' ? t : (t?.name || String(t))));

	const configPkgs: { name: string; type: string }[] = $derived(Array.isArray(data.config.packages)
		? data.config.packages.map((p: any) => (typeof p === 'string' ? { name: p, type: 'formula' } : p))
		: []);

	const configCli = $derived(configPkgs.filter((p: any) => p.type !== 'cask' && p.type !== 'npm'));
	const configApps = $derived(configPkgs.filter((p: any) => p.type === 'cask'));
	const configNpm = $derived(configPkgs.filter((p: any) => p.type === 'npm'));

	const formulaeRaw = $derived(snapshotPkgs.formulae?.length ? snapshotPkgs.formulae : configCli.map((p: any) => p.name));
	const casksRaw = $derived(snapshotPkgs.casks?.length ? snapshotPkgs.casks : configApps.map((p: any) => p.name));
	
	const formulae = $derived(formulaeRaw.map((f: any) => typeof f === 'string' ? f : (f?.name || String(f))));
	const casks = $derived(casksRaw.map((c: any) => typeof c === 'string' ? c : (c?.name || String(c))));
	const taps = $derived(snapshotPkgs.taps || []);

	const displayedApps = $derived(showAllApps ? casks : casks.slice(0, 12));
	const displayedCli = $derived(showAllCli ? formulae : formulae.slice(0, 24));
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

<div class="page">
	<section class="hero">
		<button class="share-btn" onclick={openShareModal}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
			Share
		</button>

		<div class="hero-meta">
			{#if data.configUser.avatar_url}
				<img src={data.configUser.avatar_url} alt={data.configUser.username} class="avatar" />
			{:else}
				<div class="avatar-placeholder">{data.configUser.username.charAt(0).toUpperCase()}</div>
			{/if}
			<div class="meta-text">
				<span class="username">@{data.configUser.username}</span>
				<span class="sep">/</span>
				<span class="slug">{data.config.slug}</span>
			</div>
		</div>

		<h1 class="title">{data.config.name}</h1>
		{#if data.config.description}
			<p class="desc">{data.config.description}</p>
		{/if}

		<div class="install-box">
			<div class="terminal">
				<code>$ {getInstallCommand()}</code>
				<button class="copy" onclick={copyCommand}>
					{#if copied}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
					{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
					{/if}
				</button>
			</div>
			<div class="install-actions">
				<button class="share-inline" onclick={openShareModal}>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
					Share
				</button>
				<button class="fork" onclick={forkConfig} disabled={forking}>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>
					{forking ? 'Forking...' : 'Fork to Dashboard'}
				</button>
			</div>
			{#if forkError}
				<div class="error">{forkError}</div>
			{/if}
		</div>

		<div class="stats">
			<div class="stat">
				<div class="stat-val">{casks.length}</div>
				<div class="stat-lbl">Apps</div>
			</div>
			<div class="stat">
				<div class="stat-val">{formulae.length}</div>
				<div class="stat-lbl">CLI</div>
			</div>
			{#if devTools.length > 0}
				<div class="stat">
					<div class="stat-val">{devTools.length}</div>
					<div class="stat-lbl">Dev</div>
				</div>
			{/if}
			<div class="stat">
				<div class="stat-val">{data.config.install_count || 0}</div>
				<div class="stat-lbl">Installs</div>
			</div>
		</div>
	</section>

	<main class="content">
		{#if casks.length > 0}
			<section class="section">
				<h2 class="section-title">📱 Applications</h2>
				<div class="app-grid">
					{#each displayedApps as app, i}
						<a href={getPackageUrl(app, 'cask')} target="_blank" rel="noopener noreferrer" class="app-card">
							<div class="app-icon" style="background: {getAppGradient(i)}">
								{app.charAt(0).toUpperCase()}
							</div>
							<div class="app-name">{app}</div>
						</a>
					{/each}
				</div>
				{#if casks.length > 12}
					<button class="show-more" onclick={() => showAllApps = !showAllApps}>
						{showAllApps ? 'Show less' : `Show all ${casks.length} apps →`}
					</button>
				{/if}
			</section>
		{/if}

		{#if devTools.length > 0}
			<section class="section">
				<h2 class="section-title">⚙️ Development Tools</h2>
				<div class="dev-grid">
					{#each devTools as tool, i}
						<div class="dev-card">
							<div class="dev-icon" style="background: {getAppGradient(i + 2)}">
								{tool.charAt(0).toUpperCase()}
							</div>
							<div class="dev-name">{tool}</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if formulae.length > 0}
			<section class="section">
				<h2 class="section-title">⌘ CLI Tools</h2>
				<div class="cli-tags">
					{#each displayedCli as pkg}
						<a href={getPackageUrl(pkg, 'formula')} target="_blank" rel="noopener noreferrer" class="cli-tag">{pkg}</a>
					{/each}
				</div>
				{#if formulae.length > 24}
					<button class="show-more" onclick={() => showAllCli = !showAllCli}>
						{showAllCli ? 'Show less' : `Show all ${formulae.length} tools →`}
					</button>
				{/if}
			</section>
		{/if}

		{#if configNpm.length > 0}
			<section class="section">
				<h2 class="section-title">📦 NPM Packages</h2>
				<div class="cli-tags">
					{#each configNpm as pkg}
						<a href={getPackageUrl(pkg.name, 'npm')} target="_blank" rel="noopener noreferrer" class="cli-tag">{pkg.name}</a>
					{/each}
				</div>
			</section>
		{/if}

		<section class="section">
			<h2 class="section-title">🔧 Configuration</h2>

			{#if data.config.dotfiles_repo}
				<details class="detail-card" open>
					<summary>
						<span class="detail-icon">📁</span>
						<span class="detail-title">Dotfiles Repository</span>
					</summary>
					<div class="detail-content">
						<a href={data.config.dotfiles_repo} target="_blank" rel="noopener noreferrer" class="link">
							{data.config.dotfiles_repo}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
						</a>
						<p class="detail-desc">Deployed automatically via GNU Stow</p>
					</div>
				</details>
			{/if}

			{#if shell.default || shell.oh_my_zsh}
				<details class="detail-card">
					<summary>
						<span class="detail-icon">🐚</span>
						<span class="detail-title">Shell Setup</span>
					</summary>
					<div class="detail-content">
						<div class="kv-grid">
							{#if shell.default}
								<div class="kv">
									<span class="k">Shell</span>
									<span class="v">{shell.default}</span>
								</div>
							{/if}
							{#if shell.oh_my_zsh}
								<div class="kv">
									<span class="k">Oh My Zsh</span>
									<span class="v badge">Installed</span>
								</div>
							{/if}
							{#if shell.theme}
								<div class="kv">
									<span class="k">Theme</span>
									<span class="v">{shell.theme}</span>
								</div>
							{/if}
						</div>
						{#if shell.plugins && shell.plugins.length > 0}
							<div class="plugins">
								<div class="plugins-label">Plugins ({shell.plugins.length})</div>
								<div class="cli-tags">
									{#each shell.plugins as plugin}
										<span class="cli-tag">{plugin}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</details>
			{/if}

			{#if Object.keys(git).length > 0}
				<details class="detail-card">
					<summary>
						<span class="detail-icon">🔀</span>
						<span class="detail-title">Git Configuration</span>
					</summary>
					<div class="detail-content">
						<div class="kv-grid">
							{#each Object.entries(git) as [key, value]}
								<div class="kv">
									<span class="k">{key}</span>
									<span class="v">{value}</span>
								</div>
							{/each}
						</div>
					</div>
				</details>
			{/if}

		{#if data.config.custom_script}
			<details class="detail-card">
				<summary>
					<span class="detail-icon">⚡</span>
					<span class="detail-title">Custom Installation Script</span>
				</summary>
				<div class="code-block">
					<div class="code-header">
						<span>custom-script.sh</span>
						<button onclick={() => {
							navigator.clipboard.writeText(data.config.custom_script || '');
							const btn = event?.currentTarget as HTMLButtonElement;
							if (btn) {
								btn.textContent = 'Copied!';
								setTimeout(() => btn.textContent = 'Copy', 2000);
							}
						}}>Copy</button>
						</div>
					<pre><code>{@html highlightBash(data.config.custom_script)}</code></pre>
					</div>
				</details>
			{/if}
		</section>

		{#if taps.length > 0 || macosPrefs.length > 0}
			<section class="section">
				<h2 class="section-title">📋 Additional</h2>

				{#if taps.length > 0}
					<details class="detail-card">
						<summary>
							<span class="detail-icon">🚰</span>
							<span class="detail-title">Homebrew Taps ({taps.length})</span>
						</summary>
						<div class="detail-content">
							<div class="tap-list">
								{#each taps as tap}
									<div class="tap-item">{tap}</div>
								{/each}
							</div>
						</div>
					</details>
				{/if}

				{#if macosPrefs.length > 0}
					<details class="detail-card">
						<summary>
							<span class="detail-icon">🍎</span>
							<span class="detail-title">macOS Preferences ({macosPrefs.length})</span>
						</summary>
						<div class="detail-content">
							<div class="prefs">
								{#each macosPrefs as pref}
									<div class="pref">
										<div class="pref-header">
											<span class="pref-key">{pref.key}</span>
											<span class="pref-domain">{pref.domain}</span>
										</div>
										{#if pref.desc}
											<p class="pref-desc">{pref.desc}</p>
										{/if}
										<div class="pref-val">{pref.value}</div>
									</div>
								{/each}
							</div>
						</div>
					</details>
				{/if}
			</section>
		{/if}

		<section class="cta">
			<div class="cta-icon">✨</div>
			<div class="cta-text">
				<h3>Create Your Own Configuration</h3>
				<p>Build and share your perfect dev environment in minutes</p>
			</div>
			<a href="/login?return_to=/dashboard" class="cta-btn">
				Get Started
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
			</a>
		</section>
	</main>
</div>

{#if showShareModal}
	<div class="share-overlay" onclick={closeShareModal} onkeydown={(e) => e.key === 'Escape' && closeShareModal()} role="dialog" tabindex="0">
		<div class="share-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
			<div class="share-modal-header">
				<h3 class="share-modal-title">Share Configuration</h3>
				<button class="share-close-btn" onclick={closeShareModal} aria-label="Close share modal">
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
	* {
		box-sizing: border-box;
	}

	.page {
		min-height: 100vh;
		background: var(--bg-primary);
	}

	.hero {
		position: relative;
		max-width: 1000px;
		margin: 0 auto;
		padding: 120px 32px 80px;
		text-align: center;
	}

	.share-btn {
		position: absolute;
		top: 20px;
		right: 32px;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.share-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.hero-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 24px;
	}

	.avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		border: 2px solid var(--border);
	}

	.avatar-placeholder {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		border: 2px solid var(--border);
		background: linear-gradient(135deg, var(--accent), #3b82f6);
		color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.5rem;
	}

	.meta-text {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1.1rem;
	}

	.username {
		color: var(--accent);
		font-weight: 600;
	}

	.sep {
		color: var(--text-muted);
	}

	.slug {
		font-family: 'JetBrains Mono', monospace;
		color: var(--text-primary);
		font-weight: 500;
	}

	.title {
		font-size: 3.5rem;
		font-weight: 800;
		margin: 0 0 16px;
		line-height: 1.1;
		background: linear-gradient(135deg, var(--text-primary), var(--accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.desc {
		font-size: 1.2rem;
		color: var(--text-secondary);
		margin: 0 0 48px;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.6;
	}

	.install-box {
		max-width: 700px;
		margin: 0 auto 48px;
	}

	.terminal {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--bg-tertiary);
		border: 2px solid var(--border);
		border-radius: 12px;
		padding: 20px 24px;
		margin-bottom: 12px;
		transition: border-color 0.2s;
	}

	.terminal:hover {
		border-color: var(--accent);
	}

	.terminal code {
		flex: 1;
		font-family: 'JetBrains Mono', monospace;
		font-size: 1rem;
		color: var(--accent);
		font-weight: 500;
		text-align: left;
	}

	.copy {
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
		transition: all 0.2s;
	}

	.copy:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
	}

	.fork {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 14px;
		background: color-mix(in srgb, var(--bg-secondary) 85%, transparent);
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.install-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	.share-inline {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 14px;
		background: color-mix(in srgb, var(--bg-secondary) 85%, transparent);
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.share-inline:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
	}

	.fork:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
	}

	.fork:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		margin-top: 12px;
		padding: 12px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #ef4444;
		font-size: 0.9rem;
	}

	.stats {
		display: flex;
		justify-content: center;
		gap: 32px;
		flex-wrap: wrap;
	}

	.stat {
		text-align: center;
	}

	.stat-val {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--accent);
		line-height: 1;
		margin-bottom: 8px;
	}

	.stat-lbl {
		font-size: 0.85rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 600;
	}

	.content {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 32px 120px;
	}

	.section {
		margin-bottom: 80px;
	}

	.section-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 32px;
		color: var(--text-primary);
	}

	.app-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 24px;
		margin-bottom: 24px;
	}

	.app-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		text-decoration: none;
		transition: transform 0.2s;
	}

	.app-card:hover {
		transform: translateY(-4px);
	}

	.app-icon {
		width: 80px;
		height: 80px;
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 700;
		color: #fff;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.app-name {
		font-size: 0.9rem;
		color: var(--text-primary);
		font-weight: 500;
		text-align: center;
		word-break: break-word;
	}

	.dev-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 20px;
		margin-bottom: 24px;
	}

	.dev-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.dev-icon {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		color: #fff;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.dev-name {
		font-size: 0.9rem;
		color: var(--text-primary);
		font-weight: 500;
		text-transform: capitalize;
	}

	.cli-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 24px;
	}

	.cli-tag {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		padding: 8px 14px;
		border-radius: 8px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-primary);
		text-decoration: none;
		transition: all 0.2s;
	}

	.cli-tag:hover {
		border-color: var(--accent);
		background: var(--bg-tertiary);
	}

	.show-more {
		display: block;
		margin: 0 auto;
		padding: 12px 24px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.show-more:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.detail-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		margin-bottom: 16px;
		overflow: hidden;
	}

	.detail-card summary {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 24px 32px;
		cursor: pointer;
		user-select: none;
		transition: background 0.2s;
	}

	.detail-card summary:hover {
		background: var(--bg-tertiary);
	}

	.detail-icon {
		font-size: 1.5rem;
	}

	.detail-title {
		flex: 1;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.detail-content {
		padding: 0 32px 32px;
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--accent);
		text-decoration: none;
		font-weight: 500;
		word-break: break-all;
		transition: opacity 0.2s;
	}

	.link:hover {
		opacity: 0.8;
	}

	.detail-desc {
		margin: 12px 0 0;
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	.kv-grid {
		display: grid;
		gap: 12px;
	}

	.kv {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
	}

	.k {
		font-size: 0.9rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.v {
		font-size: 0.95rem;
		color: var(--text-primary);
		font-weight: 600;
		font-family: 'JetBrains Mono', monospace;
	}

	.v.badge {
		background: var(--accent);
		color: #000;
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 0.8rem;
	}

	.plugins {
		margin-top: 20px;
	}

	.plugins-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 12px;
	}

	.code-block {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.code-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
	}

	.code-header span {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.code-header button {
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

	.code-header button:hover {
		background: var(--accent-hover);
	}

	.code-block pre {
		margin: 0;
		padding: 24px;
		overflow-x: auto;
	}

	.code-block code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-primary);
	}

	.code-block :global(.comment) {
		color: var(--text-muted);
		font-style: italic;
	}

	.code-block :global(.keyword) {
		color: #c678dd;
		font-weight: 600;
	}

	.code-block :global(.string) {
		color: #98c379;
	}

	.code-block :global(.variable) {
		color: #e5c07b;
	}

	.tap-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.tap-item {
		padding: 14px 18px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.prefs {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.pref {
		padding: 20px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 12px;
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
		background: var(--bg-secondary);
		padding: 4px 10px;
		border-radius: 6px;
	}

	.pref-desc {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0 0 10px;
		line-height: 1.5;
	}

	.pref-val {
		padding: 12px 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--accent);
	}

	.cta {
		display: flex;
		align-items: center;
		gap: 24px;
		padding: 48px;
		background: var(--bg-secondary);
		border: 2px solid var(--border);
		border-radius: 20px;
		transition: all 0.3s;
	}

	.cta:hover {
		border-color: var(--accent);
		transform: translateY(-2px);
	}

	.cta-icon {
		font-size: 3rem;
		flex-shrink: 0;
	}

	.cta-text {
		flex: 1;
	}

	.cta-text h3 {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 8px;
		color: var(--text-primary);
	}

	.cta-text p {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 16px 32px;
		background: var(--accent);
		color: #000;
		border: none;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.cta-btn:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
	}

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
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
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

	@media (max-width: 768px) {
		.hero {
			padding: 100px 20px 60px;
		}

		.share-btn {
			right: 20px;
		}

		.title {
			font-size: 2.5rem;
		}

		.desc {
			font-size: 1rem;
		}

		.content {
			padding: 0 20px 80px;
		}

		.section {
			margin-bottom: 60px;
		}

		.section-title {
			font-size: 1.5rem;
		}

		.app-grid {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
			gap: 16px;
		}

		.app-icon {
			width: 64px;
			height: 64px;
			font-size: 1.5rem;
		}

		.dev-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		}

		.dev-icon {
			width: 48px;
			height: 48px;
			font-size: 1.2rem;
		}

		.detail-card summary {
			padding: 20px;
		}

		.detail-content {
			padding: 0 20px 20px;
		}

		.cta {
			flex-direction: column;
			text-align: center;
			padding: 32px 24px;
		}

		.cta-btn {
			width: 100%;
			justify-content: center;
		}

		.terminal {
			flex-direction: column;
			align-items: stretch;
		}

		.terminal code {
			text-align: center;
		}

		.copy {
			width: 100%;
			justify-content: center;
		}

		.install-actions {
			justify-content: stretch;
		}

		.fork {
			width: 100%;
			border-radius: 12px;
			padding: 12px 14px;
		}

		.share-inline {
			width: 100%;
			border-radius: 12px;
			padding: 12px 14px;
		}
	}
</style>
