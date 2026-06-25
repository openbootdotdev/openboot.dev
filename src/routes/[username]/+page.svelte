<script lang="ts">
	import type { PageData } from './$types';
	import ConfigDetail from '$lib/components/ConfigDetail.svelte';

	let { data }: { data: PageData } = $props();

	let copiedUrl = $state(false);

	const totalPackages = $derived(
		data.viewType === 'profile' && data.configs
			? data.configs.reduce((sum: number, config: any) => {
				const count = getPackageCount(config.packages);
				return sum + count;
			}, 0)
			: 0
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

	function copyProfileUrl() {
		const url = `openboot.dev/${data.profileUser?.username}`;
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
			<div class="avatar">
				{#if data.profileUser.avatar_url}
					<img src={data.profileUser.avatar_url} alt={data.profileUser.username} class="avatar-img" />
				{:else}
					<span class="avatar-letter">{data.profileUser.username.charAt(0).toLowerCase()}</span>
				{/if}
			</div>

			<h1 class="profile-username"><span class="at">@</span>{data.profileUser.username}</h1>

			<button class="profile-url" onclick={copyProfileUrl}>
				openboot.dev/{data.profileUser.username}
				{#if copiedUrl}
					<span class="copied-tooltip">Copied!</span>
				{/if}
			</button>

			<p class="member-since">member since {formatDate(data.profileUser.created_at)}</p>

			<div class="profile-stats">
				<div class="stat-card">
					<div class="stat-value">{data.configs.length}</div>
					<div class="stat-label">configs</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{formatInstallCount(data.totalInstalls)}</div>
					<div class="stat-label">installs</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{totalPackages}</div>
					<div class="stat-label">packages</div>
				</div>
			</div>
		</section>

		{#if data.configs.length === 0}
			<section class="empty-state">
				<h3 class="empty-title">No public configurations yet</h3>
				<p class="empty-desc">This user hasn't shared any public configs.</p>
				<a href="/login?return_to=/dashboard" class="empty-cta">Create your own config</a>
			</section>
		{:else}
			<section class="configs-section">
				<p class="section-eyebrow"><span class="accent">&gt;</span> public configurations</p>
				<div class="configs-grid">
					{#each data.configs as config (config.id)}
						<a href="/{data.profileUser.username}/{config.slug}" class="config-card">
							<div class="card-header">
								<div class="user-info">
									{#if data.profileUser.avatar_url}
										<img src={data.profileUser.avatar_url} alt={data.profileUser.username} class="card-avatar" />
									{:else}
										<span class="card-avatar-letter">{data.profileUser.username.charAt(0).toLowerCase()}</span>
									{/if}
									<span class="card-username">@{data.profileUser.username}</span>
								</div>
								<span class="preset-badge">{config.base_preset}</span>
							</div>
							<h3 class="config-name">{config.name}</h3>
							{#if config.description}
								<p class="config-description">{config.description}</p>
							{/if}
							<div class="card-footer">
								<span class="stat-pkgs">{getPackageBreakdown(config.packages)}</span>
								<span class="stat-installs">
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
									{config.install_count || 0}
								</span>
								<span class="stat-date">{formatDate2(config.updated_at)}</span>
							</div>
							<div class="install-preview">
								<code><span class="prompt">$</span> curl -fsSL openboot.dev/{data.profileUser.username}/{config.slug} | bash</code>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<section class="cta-banner">
			<div>
				<h3 class="cta-title">Create your own config</h3>
				<p class="cta-desc">Build custom install scripts for your team or projects in minutes.</p>
			</div>
			<a href="/login?return_to=/dashboard" class="cta-button"><span class="pencil">✎</span> Get started</a>
		</section>
	</main>
</div>
{/if}

<style>
	.page {
		min-height: 100vh;
	}

	.container {
		max-width: 1160px;
		margin: 0 auto;
		padding: 0 36px;
		position: relative;
	}

	/* ---------- hero ---------- */
	.profile-hero {
		text-align: center;
		padding: 88px 0 56px;
	}

	.avatar {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		margin: 0 auto 26px;
		background: var(--bg-secondary);
		border: 1px solid var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 0 6px var(--accent-glow);
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.avatar-letter {
		font-size: 2.2rem;
		font-weight: 500;
		color: var(--accent);
	}

	.profile-username {
		font-size: 2.4rem;
		font-weight: 500;
		letter-spacing: -0.03em;
		color: var(--text-primary);
		margin: 0 0 10px;
	}

	.profile-username .at {
		color: var(--accent);
	}

	.profile-url {
		font-family: inherit;
		font-size: 0.85rem;
		color: var(--text-muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		margin: 0 0 6px;
		position: relative;
		display: inline-block;
		transition: color 0.15s ease;
	}

	.profile-url:hover {
		color: var(--accent);
	}

	.copied-tooltip {
		position: absolute;
		top: -30px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent);
		color: var(--bg-primary);
		padding: 5px 11px;
		border-radius: 6px;
		font-size: 0.72rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.member-since {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: 0;
	}

	.profile-stats {
		display: flex;
		justify-content: center;
		gap: 14px;
		margin-top: 36px;
		flex-wrap: wrap;
	}

	.stat-card {
		min-width: 128px;
		padding: 22px 26px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 600;
		color: var(--accent);
		line-height: 1;
	}

	.stat-label {
		font-size: 0.7rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-top: 10px;
	}

	/* ---------- configs ---------- */
	.configs-section {
		padding-bottom: 40px;
	}

	.section-eyebrow {
		color: var(--text-muted);
		font-size: 0.85rem;
		margin: 0 0 24px;
	}

	.section-eyebrow .accent {
		color: var(--accent);
	}

	.configs-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.config-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease;
	}

	.config-card:hover {
		border-color: var(--border-hover);
		box-shadow:
			0 0 0 1px var(--accent-glow),
			0 14px 40px -22px var(--shadow);
	}

	.config-card:hover .config-name {
		color: var(--accent);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 9px;
	}

	.card-avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1px solid var(--border-hover);
		object-fit: cover;
	}

	.card-avatar-letter {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-hover);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.72rem;
		color: var(--text-secondary);
	}

	.card-username {
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.preset-badge {
		font-size: 0.68rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border: 1px solid var(--border-hover);
		border-radius: 5px;
		padding: 2px 7px;
	}

	.config-name {
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin: 0;
		transition: color 0.18s ease;
	}

	.config-description {
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

	.card-footer {
		display: flex;
		gap: 14px;
		align-items: center;
		margin-top: auto;
		padding-top: 14px;
		border-top: 1px solid var(--border);
		font-size: 0.78rem;
	}

	.stat-pkgs {
		color: var(--accent);
		font-size: 0.75rem;
	}

	.stat-installs {
		display: flex;
		align-items: center;
		gap: 5px;
		color: var(--text-secondary);
	}

	.stat-date {
		margin-left: auto;
		color: var(--text-muted);
	}

	.install-preview {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 9px 11px;
		overflow: hidden;
	}

	.install-preview code {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-secondary);
		white-space: nowrap;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.install-preview .prompt {
		color: var(--accent);
	}

	/* ---------- empty ---------- */
	.empty-state {
		text-align: center;
		padding: 80px 20px;
	}

	.empty-title {
		font-size: 1.4rem;
		font-weight: 500;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		margin: 0 0 12px;
	}

	.empty-desc {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0 0 28px;
	}

	.empty-cta {
		display: inline-block;
		padding: 13px 28px;
		background: var(--accent);
		color: var(--bg-primary);
		border-radius: 9px;
		font-size: 0.88rem;
		font-weight: 500;
		text-decoration: none;
		transition:
			background 0.18s ease,
			box-shadow 0.18s ease;
	}

	.empty-cta:hover {
		background: var(--accent-hover);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	/* ---------- cta banner ---------- */
	.cta-banner {
		margin: 40px 0;
		padding: 32px 36px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
	}

	.cta-title {
		font-size: 1.2rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin: 0 0 8px;
	}

	.cta-desc {
		font-size: 0.86rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		padding: 12px 24px;
		background: var(--accent);
		color: var(--bg-primary);
		border: none;
		border-radius: 9px;
		font-family: inherit;
		font-size: 0.86rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background 0.18s ease,
			box-shadow 0.18s ease;
	}

	.cta-button:hover {
		background: var(--accent-hover);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	/* ---------- responsive ---------- */
	@media (max-width: 1024px) {
		.configs-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.profile-hero {
			padding: 64px 0 48px;
		}

		.profile-username {
			font-size: 2rem;
		}

		.cta-banner {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	@media (max-width: 600px) {
		.container {
			padding: 0 22px;
		}

		.configs-grid {
			grid-template-columns: 1fr;
		}

		.profile-stats {
			gap: 10px;
		}

		.stat-card {
			min-width: 0;
			flex: 1;
			padding: 18px;
		}
	}
</style>
