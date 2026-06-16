<script lang="ts">
	import { onMount } from 'svelte';

	interface Config {
		id: string;
		slug: string;
		name: string;
		description: string;
		base_preset: string;
		install_count: number;
		updated_at: string;
		created_at: string;
		username: string;
		avatar_url: string;
		packages?: any[];
		featured?: number;
	}

	let configs = $state<Config[]>([]);
	let loading = $state(true);
	let sortBy = $state<'featured' | 'installs' | 'trending' | 'new' | 'recent'>('featured');
	let offset = $state(0);
	let total = $state(0);
	let limit = 24;

	const cardColors = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#06b6d4', '#eab308', '#f43f5e'];

	async function loadConfigs(reset = false) {
		if (reset) {
			offset = 0;
			configs = [];
		}

		loading = true;
		try {
			const response = await fetch(`/api/configs/public?sort=${sortBy}&limit=${limit}&offset=${offset}&visibility=public`);
			if (response.ok) {
				const data = await response.json();
				if (reset) {
					configs = data.configs;
				} else {
					configs = [...configs, ...data.configs];
				}
				total = data.total;
			}
		} catch (e) {
			configs = [];
		} finally {
			loading = false;
		}
	}

	function handleSortChange(newSort: 'featured' | 'installs' | 'trending' | 'new' | 'recent') {
		sortBy = newSort;
		loadConfigs(true);
	}

	function loadMore() {
		offset += limit;
		loadConfigs(false);
	}

	function getPackages(config: Config): any[] {
		if (!config.packages) return [];
		if (typeof config.packages === 'string') {
			try {
				const parsed = JSON.parse(config.packages);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		return Array.isArray(config.packages) ? config.packages : [];
	}

	function getPackageBreakdown(config: Config): { cli: number; apps: number } {
		const packages = getPackages(config);
		const cli = packages.filter((p: any) => {
			const type = typeof p === 'string' ? 'formula' : p.type;
			return type !== 'cask' && type !== 'npm';
		}).length;
		const apps = packages.filter((p: any) => {
			const type = typeof p === 'string' ? 'formula' : p.type;
			return type === 'cask';
		}).length;
		return { cli, apps };
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
		if (isNaN(date.getTime())) return '';
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days}d ago`;
		if (days < 30) return `${Math.floor(days / 7)}w ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	onMount(async () => {
		await loadConfigs(true);
	});
</script>

<svelte:head>
	<title>Explore - OpenBoot</title>
	<meta name="description" content="Discover developer configurations shared by the community. Browse curated macOS development setups and install them with a single command." />
</svelte:head>

<main class="page">
	<div class="container">
		<section class="hero">
			<div class="hero-content">
				<p class="hero-prompt"><span class="accent">&gt;</span> explore</p>
				<h1 class="hero-title">Community configurations</h1>
				<p class="hero-subtitle">
					Developer setups shared by the community{#if total > 0} — {total} public {total === 1 ? 'config' : 'configs'} and counting{/if}.
				</p>
			</div>
			<div class="sort-controls">
				<label for="sort-select" class="sort-label">sort:</label>
				<select
					id="sort-select"
					class="sort-select"
					bind:value={sortBy}
					onchange={() => handleSortChange(sortBy)}
				>
					<option value="featured">Featured</option>
					<option value="installs">Most Installed</option>
					<option value="trending">This Week</option>
					<option value="new">New</option>
					<option value="recent">Recent</option>
				</select>
			</div>
		</section>

		{#if loading && configs.length === 0}
			<div class="configs-grid">
				{#each Array(6) as _, i}
					<div class="skeleton-card">
						<div class="skeleton-header">
							<div class="skeleton-avatar"></div>
							<div class="skeleton-text skeleton-username"></div>
						</div>
						<div class="skeleton-text skeleton-name"></div>
						<div class="skeleton-text skeleton-desc"></div>
						<div class="skeleton-text skeleton-desc short"></div>
						<div class="skeleton-footer">
							<div class="skeleton-text skeleton-stat"></div>
							<div class="skeleton-text skeleton-stat"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if configs.length === 0}
			<div class="empty-state">
				<svg class="empty-icon" width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="20" y="20" width="120" height="80" rx="6" stroke="var(--border)" stroke-width="2"/>
					<line x1="20" y1="35" x2="140" y2="35" stroke="var(--border)" stroke-width="2"/>
					<rect x="35" y="50" width="10" height="10" fill="var(--accent)"/>
					<rect x="50" y="50" width="3" height="10" fill="var(--text-muted)" class="cursor-blink"/>
					<circle cx="80" cy="80" r="2" fill="var(--text-muted)" opacity="0.3"/>
					<circle cx="90" cy="80" r="2" fill="var(--text-muted)" opacity="0.3"/>
					<circle cx="100" cy="80" r="2" fill="var(--text-muted)" opacity="0.3"/>
				</svg>
				<h3 class="empty-title">No configurations yet</h3>
				<p class="empty-desc">Be the first to share your setup with <code>openboot snapshot</code></p>
				<a href="/login" class="empty-cta">Get Started</a>
			</div>
		{:else}
			<div class="configs-grid">
				{#each configs as config, i}
					<a 
						href="/{config.username}/{config.slug}" 
						class="config-card"
						style="--card-color: {cardColors[i % cardColors.length]};"
					>
						<div class="card-accent"></div>
						<div class="card-header">
							<div class="user-info">
								<img 
									src={config.avatar_url} 
									alt={config.username} 
									class="avatar"
								/>
								<span class="username">@{config.username}</span>
								{#if config.username === 'openboot'}
									<span class="official-badge">[official]</span>
								{/if}
							</div>
							{#if config.featured === 1}
								<span class="featured-badge">[featured]</span>
							{/if}
						</div>
						<h3 class="config-name">{config.name}</h3>
						{#if config.description}
							<p class="config-description">{config.description}</p>
						{/if}
						<div class="card-footer">
							{#if getPackageBreakdown(config).cli > 0 || getPackageBreakdown(config).apps > 0}
								<div class="stat packages">
									{getPackageBreakdown(config).cli} cli · {getPackageBreakdown(config).apps} apps
								</div>
							{/if}
							<div class="stat installs">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
								{config.install_count}
							</div>
							<div class="stat date">
								{formatDate(config.updated_at)}
							</div>
						</div>
						<div class="install-preview">
							<code><span class="prompt">$</span> curl -fsSL openboot.dev/{config.username}/{config.slug} | bash</code>
						</div>
					</a>
				{/each}
			</div>

			{#if total > offset + limit}
				<div class="load-more-section">
					<p class="load-more-count">Showing {configs.length} of {total} configurations</p>
					<button class="load-more-btn" onclick={loadMore} disabled={loading}>
						{loading ? 'Loading...' : 'Load More'}
					</button>
				</div>
			{/if}
		{/if}
	</div>

	<section class="cta-banner">
		<div class="cta-glow"></div>
		<div class="container">
			<div class="cta-content">
				<h3 class="cta-title">Create your own config and share it with the community</h3>
				<p class="cta-desc">Capture your development environment in seconds and share it with a single command</p>
				<a href="/login?return_to=/dashboard" class="cta-button">
					Get Started
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
					</svg>
				</a>
			</div>
		</div>
	</section>
</main>

<style>
	.page {
		min-height: 100vh;
		position: relative;
	}

	.container {
		max-width: 1160px;
		margin: 0 auto;
		padding: 0 36px;
		position: relative;
	}

	.hero {
		padding: 104px 0 56px;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 32px;
		flex-wrap: wrap;
	}

	.hero-prompt {
		color: var(--text-muted);
		font-size: 0.85rem;
		letter-spacing: 0.01em;
		margin: 0 0 16px;
	}

	.hero-prompt .accent {
		color: var(--accent);
	}

	.hero-title {
		font-size: 1.9rem;
		font-weight: 500;
		letter-spacing: -0.025em;
		color: var(--text-primary);
		margin: 0 0 12px;
	}

	.hero-subtitle {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0;
		max-width: 60ch;
		line-height: 1.6;
	}

	.sort-controls {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.sort-label {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.sort-select {
		padding: 9px 34px 9px 13px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-hover);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.82rem;
		font-family: inherit;
		cursor: pointer;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
	}

	.sort-select:hover {
		border-color: var(--accent-deep);
	}

	.sort-select:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	.sort-select option {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.configs-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 60px;
	}

	.skeleton-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.skeleton-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.skeleton-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-text {
		height: 12px;
		background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%);
		background-size: 200% 100%;
		border-radius: 4px;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-username {
		width: 80px;
	}

	.skeleton-name {
		height: 20px;
		width: 60%;
	}

	.skeleton-desc {
		width: 100%;
	}

	.skeleton-desc.short {
		width: 75%;
	}

	.skeleton-footer {
		display: flex;
		gap: 16px;
		padding-top: 8px;
		border-top: 1px solid var(--border);
		margin-top: auto;
	}

	.skeleton-stat {
		width: 60px;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.empty-state {
		text-align: center;
		padding: 100px 20px;
	}

	.empty-icon {
		margin-bottom: 32px;
	}

	.cursor-blink {
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%, 49% {
			opacity: 1;
		}
		50%, 100% {
			opacity: 0;
		}
	}

	.empty-title {
		font-size: 1.4rem;
		font-weight: 500;
		margin-bottom: 12px;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.empty-desc {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-bottom: 28px;
	}

	.empty-desc code {
		font-family: var(--font-mono);
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 3px 10px;
		border-radius: 6px;
		color: var(--accent);
		font-size: 0.85rem;
	}

	.empty-cta {
		display: inline-block;
		padding: 13px 28px;
		background: var(--accent);
		color: var(--bg-primary);
		text-decoration: none;
		border-radius: 9px;
		font-weight: 500;
		font-size: 0.88rem;
		transition:
			background 0.18s ease,
			box-shadow 0.18s ease;
	}

	.empty-cta:hover {
		background: var(--accent-hover);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	.config-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease;
		display: flex;
		flex-direction: column;
		gap: 12px;
		position: relative;
		overflow: hidden;
	}

	.card-accent {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--card-color);
		opacity: 0.8;
	}

	.config-card:hover {
		border-color: var(--border-hover);
		box-shadow: 0 0 0 1px var(--accent-glow), 0 14px 40px -22px var(--shadow);
	}

	.config-card:hover .config-name {
		color: var(--accent);
	}

	.config-card:hover .install-preview {
		max-height: 100px;
		opacity: 1;
		margin-top: 8px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1px solid var(--border-hover);
	}

	.username {
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.official-badge,
	.featured-badge {
		font-size: 0.72rem;
		letter-spacing: 0.01em;
	}

	.official-badge {
		color: var(--text-secondary);
		margin-left: 4px;
	}

	.featured-badge {
		color: var(--accent);
	}

	.config-name {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.01em;
		transition: color 0.18s ease;
	}

	.config-description {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
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
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.78rem;
		color: var(--text-secondary);
	}

	.stat.packages {
		color: var(--accent);
		font-size: 0.75rem;
	}

	.stat.date {
		margin-left: auto;
		color: var(--text-muted);
	}

	.install-preview {
		max-height: 0;
		opacity: 0;
		overflow: hidden;
		transition:
			max-height 0.25s ease,
			opacity 0.25s ease,
			margin-top 0.25s ease;
		padding: 0 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.install-preview code {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--text-secondary);
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 10px 0;
	}

	.install-preview .prompt {
		color: var(--accent);
	}

	.load-more-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 40px 0;
	}

	.load-more-count {
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.load-more-btn {
		padding: 12px 32px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-hover);
		border-radius: 9px;
		color: var(--text-primary);
		font-size: 0.85rem;
		cursor: pointer;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease;
		font-family: inherit;
	}

	.load-more-btn:hover:not(:disabled) {
		border-color: var(--accent-deep);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	.load-more-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cta-banner {
		position: relative;
		padding: 80px 0;
		margin-top: 40px;
		border-top: 1px solid var(--border);
	}

	.cta-content {
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
		position: relative;
	}

	.cta-title {
		font-size: 1.5rem;
		font-weight: 500;
		margin-bottom: 14px;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.cta-desc {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-bottom: 28px;
		line-height: 1.6;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 13px 28px;
		background: var(--accent);
		color: var(--bg-primary);
		border: none;
		border-radius: 9px;
		font-size: 0.88rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition:
			background 0.18s ease,
			box-shadow 0.18s ease;
	}

	.cta-button:hover {
		background: var(--accent-hover);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	@media (max-width: 1200px) {
		.configs-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.hero-title {
			font-size: 2.5rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}

		.hero::before {
			display: none;
		}

		.configs-grid {
			grid-template-columns: 1fr;
		}

		.sort-controls {
			width: 100%;
			flex-direction: column;
			align-items: stretch;
		}

		.sort-select {
			width: 100%;
		}

		.cta-title {
			font-size: 1.5rem;
		}

		.cta-desc {
			font-size: 0.95rem;
		}
	}
</style>
