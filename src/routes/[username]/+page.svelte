<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import ConfigDetail from '$lib/components/ConfigDetail.svelte';

	let { data }: { data: PageData } = $props();

	let copiedId = $state('');
	let copiedUrl = $state(false);

	const totalPackages = $derived(
		data.configs.reduce((sum: number, config: any) => {
			const count = getPackageCount(config.packages);
			return sum + count;
		}, 0)
	);

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
		if (isNaN(date.getTime())) return '';
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	function getPackageCount(packages: any[]): number {
		if (!Array.isArray(packages)) return 0;
		return packages.length;
	}

	function getPackageBreakdown(packages: any[]): string {
		if (!Array.isArray(packages)) return '0 packages';
		const cli = packages.filter((p: any) => p.type !== 'cask' && p.type !== 'npm').length;
		const apps = packages.filter((p: any) => p.type === 'cask').length;
		const parts = [];
		if (cli > 0) parts.push(`${cli} cli`);
		if (apps > 0) parts.push(`${apps} apps`);
		return parts.length > 0 ? parts.join(' · ') : '0 packages';
	}

	function copyCommand(configSlug: string, configId: string) {
		const cmd = `openboot install ${data.profileUser.username}/${configSlug}`;
		navigator.clipboard.writeText(cmd);
		copiedId = configId;
		setTimeout(() => copiedId = '', 2000);
	}

	function copyProfileUrl() {
		const url = `openboot.dev/${data.profileUser.username}`;
		navigator.clipboard.writeText(url);
		copiedUrl = true;
		setTimeout(() => copiedUrl = false, 2000);
	}

	function formatInstallCount(count: number): string {
		if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
		return count.toString();
	}

	function formatDate2(dateStr?: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
		if (isNaN(date.getTime())) return '';
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getCardColor(index: number): string {
		const colors = ['green', 'blue', 'purple', 'orange', 'pink', 'cyan'];
		return colors[index % colors.length];
	}
</script>

<svelte:head>
	{#if data.viewType === 'config'}
		<title>{data.config.name} - OpenBoot</title>
		<meta name="description" content={data.config.description || `Install ${data.config.name} with OpenBoot`} />
		<meta property="og:title" content="{data.config.name} - OpenBoot" />
		<meta property="og:description" content={data.config.description || `Install ${data.config.name} with OpenBoot — one command to set up your Mac.`} />
	{:else}
		<title>@{data.profileUser.username} - OpenBoot</title>
		<meta name="description" content="Public configurations by @{data.profileUser.username} on OpenBoot" />
		<meta property="og:title" content="@{data.profileUser.username} - OpenBoot" />
		<meta property="og:description" content="Public configurations by @{data.profileUser.username} on OpenBoot" />
		<meta property="og:url" content="https://openboot.dev/{data.profileUser.username}" />
	{/if}
</svelte:head>

{#if data.viewType === 'config'}
<ConfigDetail configUser={data.configUser} config={data.config} packageDescriptions={data.packageDescriptions} />
{:else}

<div class="page">
	<main class="container">
		<section class="profile-hero">
			<div class="hero-glow"></div>
			<div class="grid-pattern"></div>
			
			<div class="avatar-wrapper">
				{#if data.profileUser.avatar_url}
					<img src={data.profileUser.avatar_url} alt={data.profileUser.username} class="profile-avatar" />
				{:else}
					<div class="profile-avatar-placeholder">{data.profileUser.username.charAt(0).toUpperCase()}</div>
				{/if}
			</div>
			
			<h1 class="profile-username">@{data.profileUser.username}</h1>
			
			<button class="profile-url" onclick={copyProfileUrl}>
				openboot.dev/{data.profileUser.username}
				{#if copiedUrl}
					<span class="copied-tooltip">Copied!</span>
				{/if}
			</button>
			
			<p class="member-since">Member since {formatDate(data.profileUser.created_at)}</p>
			
			<div class="profile-stats">
				<div class="stat-card stat-configs">
					<div class="stat-bar"></div>
					<span class="stat-value">{data.configs.length}</span>
					<span class="stat-label">Configs</span>
				</div>
				<div class="stat-card stat-installs">
					<div class="stat-bar"></div>
					<span class="stat-value">{formatInstallCount(data.totalInstalls)}</span>
					<span class="stat-label">Installs</span>
				</div>
				<div class="stat-card stat-packages">
					<div class="stat-bar"></div>
					<span class="stat-value">{totalPackages}</span>
					<span class="stat-label">Packages</span>
				</div>
			</div>
		</section>

		{#if data.configs.length === 0}
			<section class="empty-state">
				<svg class="empty-icon" width="120" height="120" viewBox="0 0 120 120" fill="none">
					<rect x="20" y="30" width="80" height="50" rx="4" stroke="currentColor" stroke-width="2"/>
					<line x1="30" y1="45" x2="70" y2="45" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					<line x1="30" y1="55" x2="90" y2="55" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					<line x1="30" y1="65" x2="60" y2="65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					<circle cx="85" cy="45" r="3" fill="var(--accent)"/>
				</svg>
				<h3 class="empty-title">No public configurations yet</h3>
				<p class="empty-desc">This user hasn't shared any public configs.</p>
				<a href="/login?return_to=/dashboard" class="empty-cta">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
					</svg>
					Create your own config
				</a>
			</section>
		{:else}
			<section class="configs-section">
				<div class="section-header-with-desc">
					<h2 class="section-title">Public Configurations</h2>
					<p class="section-desc">Setups @{data.profileUser.username} has chosen to share with the community</p>
				</div>
				<div class="configs-list">
					{#each data.configs as config, index}
						<div class="config-card" data-color={getCardColor(index)}>
							<div class="card-accent"></div>
							<a href="/{data.profileUser.username}/{config.slug}" class="config-link">
								<div class="config-header">
									<h3 class="config-name">{config.name}</h3>
									<span class="config-badge">{config.base_preset}</span>
								</div>
								{#if config.description}
									<p class="config-description">{config.description}</p>
								{/if}
								<div class="config-meta">
									<span class="config-meta-item">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
										{getPackageBreakdown(config.packages)}
									</span>
									<span class="config-meta-item">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
										{config.install_count || 0} installs
									</span>
									{#if config.updated_at}
										<span class="config-meta-item">
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
											{formatDate2(config.updated_at)}
										</span>
									{/if}
								</div>
								<div class="view-arrow">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
									</svg>
								</div>
							</a>
							<div class="config-install">
								<code class="install-command"><span class="prompt">$</span> openboot install {data.profileUser.username}/{config.slug}</code>
								<button class="copy-button" onclick={() => copyCommand(config.slug, config.id)}>
									{copiedId === config.id ? 'Copied!' : 'Copy'}
								</button>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<section class="cta-section">
			<div class="cta-card">
				<div class="cta-glow"></div>
				<div class="cta-content">
					<h3 class="cta-title">Create your own config</h3>
					<p class="cta-desc">Build custom install scripts for your team or projects in minutes.</p>
				</div>
				<a href="/login?return_to=/dashboard" class="cta-button">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
					</svg>
					Get Started
				</a>
			</div>
		</section>
	</main>
</div>
{/if}

<style>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 90%, var(--bg-secondary)) 50%, var(--bg-primary) 100%);
		position: relative;
	}

	.page::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		opacity: 0.04;
		mix-blend-mode: multiply;
		pointer-events: none;
		z-index: 1;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 80px 24px 40px;
		position: relative;
		z-index: 2;
	}

	.profile-hero {
		text-align: center;
		padding: 80px 0 88px;
		position: relative;
		overflow: hidden;
	}

	.hero-glow {
		position: absolute;
		top: -100px;
		left: 50%;
		transform: translateX(-50%);
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
		pointer-events: none;
		z-index: -1;
	}

	.grid-pattern {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 100%;
		background-image: 
			linear-gradient(var(--border) 1px, transparent 1px),
			linear-gradient(90deg, var(--border) 1px, transparent 1px);
		background-size: 40px 40px;
		opacity: 0.3;
		mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 80%);
		-webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 80%);
		pointer-events: none;
		z-index: -1;
	}

	.avatar-wrapper {
		display: inline-block;
		position: relative;
		margin-bottom: 24px;
	}

	.avatar-wrapper::before {
		content: '';
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		border: 3px solid var(--accent);
		pointer-events: none;
	}

	.avatar-wrapper::after {
		content: '';
		position: absolute;
		inset: -8px;
		border-radius: 50%;
		border: 2px solid var(--accent);
		opacity: 0;
		animation: pulse-ring 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		pointer-events: none;
	}

	.avatar-wrapper:hover::after {
		animation: pulse-ring 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@keyframes pulse-ring {
		0% {
			transform: scale(1);
			opacity: 0.6;
		}
		100% {
			transform: scale(1.2);
			opacity: 0;
		}
	}

	.profile-avatar {
		width: 104px;
		height: 104px;
		border-radius: 50%;
		object-fit: cover;
		display: block;
		box-shadow: 0 0 40px var(--accent-glow);
	}

	.profile-avatar-placeholder {
		width: 104px;
		height: 104px;
		border-radius: 50%;
		background: var(--accent);
		color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 2.75rem;
		box-shadow: 0 0 40px var(--accent-glow);
	}

	.profile-username {
		font-size: 2.75rem;
		font-weight: 800;
		margin-bottom: 12px;
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.04em;
	}

	.profile-url {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-muted);
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 8px 14px;
		border-radius: 6px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		display: inline-block;
		margin-bottom: 8px;
	}

	.profile-url:hover {
		background: var(--bg-secondary);
		color: var(--accent);
	}

	.copied-tooltip {
		position: absolute;
		top: -32px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent);
		color: #000;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		animation: fade-in-up 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.member-since {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: 48px;
	}

	.profile-stats {
		display: flex;
		justify-content: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 28px 36px;
		min-width: 160px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.stat-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		opacity: 0.6;
		transition: opacity 0.3s;
	}

	.stat-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
	}

	.stat-card:hover .stat-bar {
		opacity: 1;
	}

	.stat-configs .stat-bar {
		background: linear-gradient(90deg, var(--accent) 0%, transparent 100%);
	}

	.stat-configs .stat-value {
		color: var(--accent);
	}

	.stat-installs .stat-bar {
		background: linear-gradient(90deg, #3b82f6 0%, transparent 100%);
	}

	.stat-installs .stat-value {
		color: #3b82f6;
	}

	.stat-packages .stat-bar {
		background: linear-gradient(90deg, #a855f7 0%, transparent 100%);
	}

	.stat-packages .stat-value {
		color: #a855f7;
	}

	.stat-value {
		font-family: 'JetBrains Mono', monospace;
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.empty-state {
		text-align: center;
		padding: 96px 32px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		margin-bottom: 64px;
	}

	.empty-icon {
		margin: 0 auto 32px;
		color: var(--text-muted);
		opacity: 0.5;
	}

	.empty-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 12px;
		color: var(--text-primary);
	}

	.empty-desc {
		color: var(--text-secondary);
		font-size: 0.95rem;
		margin-bottom: 32px;
	}

	.empty-cta {
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
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.empty-cta:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent);
	}

	.configs-section {
		margin-bottom: 80px;
	}

	.section-header-with-desc {
		margin-bottom: 32px;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.section-desc {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.configs-list {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.config-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 28px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.card-accent {
		position: absolute;
		top: 0;
		left: 0;
		width: 4px;
		height: 100%;
		opacity: 0.7;
		transition: all 0.3s;
	}

	.config-card[data-color="green"] .card-accent { background: var(--accent); }
	.config-card[data-color="blue"] .card-accent { background: #3b82f6; }
	.config-card[data-color="purple"] .card-accent { background: #a855f7; }
	.config-card[data-color="orange"] .card-accent { background: #fb923c; }
	.config-card[data-color="pink"] .card-accent { background: #ec4899; }
	.config-card[data-color="cyan"] .card-accent { background: #0ea5e9; }

	.config-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
	}

	.config-card:hover .card-accent {
		width: 5px;
		opacity: 1;
	}

	.config-card[data-color="green"]:hover {
		box-shadow: 0 8px 32px rgba(34, 197, 94, 0.15);
	}

	.config-card[data-color="blue"]:hover {
		box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
	}

	.config-card[data-color="purple"]:hover {
		box-shadow: 0 8px 32px rgba(168, 85, 247, 0.15);
	}

	.config-card[data-color="orange"]:hover {
		box-shadow: 0 8px 32px rgba(251, 146, 60, 0.15);
	}

	.config-card[data-color="pink"]:hover {
		box-shadow: 0 8px 32px rgba(236, 72, 153, 0.15);
	}

	.config-card[data-color="cyan"]:hover {
		box-shadow: 0 8px 32px rgba(14, 165, 233, 0.15);
	}

	.config-link {
		display: block;
		text-decoration: none;
		color: inherit;
		margin-bottom: 20px;
		position: relative;
	}

	.config-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 12px;
	}

	.config-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.config-link:hover .config-name {
		color: var(--accent);
	}

	.config-badge {
		display: inline-block;
		padding: 4px 10px;
		font-size: 0.7rem;
		border-radius: 6px;
		text-transform: uppercase;
		font-weight: 600;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.config-description {
		color: var(--text-secondary);
		font-size: 0.85rem;
		margin-bottom: 16px;
		line-height: 1.6;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.config-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
	}

	.config-meta-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.config-meta-item svg {
		opacity: 0.6;
		flex-shrink: 0;
	}

	.view-arrow {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%) translateX(8px);
		opacity: 0;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		color: var(--accent);
	}

	.config-link:hover .view-arrow {
		opacity: 1;
		transform: translateY(-50%) translateX(0);
	}

	.config-install {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 14px 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.install-command {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--text-secondary);
		word-break: break-all;
		flex: 1;
	}

	.install-command .prompt {
		color: var(--accent);
		margin-right: 8px;
		font-weight: 700;
	}

	.copy-button {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		font-family: inherit;
		font-weight: 500;
		flex-shrink: 0;
	}

	.copy-button:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
		border-color: var(--border-hover);
	}

	.cta-section {
		padding-top: 64px;
		border-top: 1px solid var(--border);
	}

	.cta-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 40px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 32px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.cta-glow {
		position: absolute;
		inset: -1px;
		border-radius: 16px;
		padding: 1px;
		background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 30%, transparent), transparent);
		opacity: 0;
		transition: opacity 0.3s;
		pointer-events: none;
		z-index: -1;
	}

	.cta-card:hover {
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
		box-shadow: 0 8px 32px var(--accent-glow);
	}

	.cta-card:hover .cta-glow {
		opacity: 1;
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
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.cta-button:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent);
	}

	@media (max-width: 768px) {
		.profile-hero {
			padding: 60px 0 72px;
		}

		.profile-avatar,
		.profile-avatar-placeholder {
			width: 80px;
			height: 80px;
			font-size: 2rem;
		}

		.profile-username {
			font-size: 2rem;
		}

		.profile-stats {
			flex-direction: column;
			gap: 16px;
			width: 100%;
		}

		.stat-card {
			width: 100%;
			padding: 24px 28px;
		}

		.stat-value {
			font-size: 2rem;
		}

		.grid-pattern {
			display: none;
		}

		.config-card {
			padding: 24px;
		}

		.config-install {
			flex-direction: column;
			align-items: stretch;
		}

		.install-command {
			text-align: center;
			margin-bottom: 12px;
		}

		.copy-button {
			width: 100%;
		}

		.cta-card {
			flex-direction: column;
			text-align: center;
			padding: 32px 24px;
		}

		.cta-button {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.profile-username {
			font-size: 1.5rem;
		}
	}
</style>
