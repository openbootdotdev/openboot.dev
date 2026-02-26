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
	<div class="page-bg"></div>
	<svg class="noise" xmlns="http://www.w3.org/2000/svg">
		<filter id="noise">
			<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
			<feColorMatrix type="saturate" values="0"/>
		</filter>
		<rect width="100%" height="100%" filter="url(#noise)" opacity="0.04"/>
	</svg>

	<div class="container">
		<section class="hero">
			<div class="hero-bg"></div>
			<div class="hero-content">
				<h1 class="hero-title">Explore</h1>
				<p class="hero-subtitle">Discover developer configurations shared by the community</p>
				{#if total > 0}
					<p class="hero-count">{total} public configurations shared by developers like you</p>
				{/if}
		</div>
		<div class="sort-controls">
			<label for="sort-select" class="sort-label">Sort by:</label>
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
									<span class="official-badge">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
										Official
									</span>
								{/if}
							</div>
							{#if config.featured === 1}
								<span class="featured-badge">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
									Featured
								</span>
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
							<code><span class="prompt">$</span> openboot install {config.username}/{config.slug}</code>
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
		overflow: hidden;
	}

	.page-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-primary);
		z-index: -2;
	}

	.noise {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: -1;
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 24px;
		position: relative;
	}

	.hero {
		padding: 80px 0 60px;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.hero-bg {
		position: absolute;
		top: -100px;
		left: 50%;
		transform: translateX(-50%);
		width: 1200px;
		height: 600px;
		background: radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%);
		pointer-events: none;
		z-index: -1;
	}

	.hero::before {
		content: '';
		position: absolute;
		inset: -60px -200px;
		background-image: 
			repeating-linear-gradient(0deg, transparent 0px, transparent 39px, color-mix(in srgb, var(--text-primary) 8%, transparent) 39px, transparent 40px),
			repeating-linear-gradient(90deg, transparent 0px, transparent 39px, color-mix(in srgb, var(--text-primary) 8%, transparent) 39px, transparent 40px);
		mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
		-webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
		pointer-events: none;
		z-index: -1;
	}

	.hero-content {
		margin-bottom: 32px;
	}

	.hero-title {
		font-size: 3.5rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-fill-color: transparent;
		margin-bottom: 12px;
	}

	.hero-subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.hero-count {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.sort-controls {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.sort-label {
		font-size: 0.9rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.sort-select {
		padding: 10px 16px;
		padding-right: 36px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
	}

	.sort-select:hover {
		border-color: var(--accent);
		background-color: var(--bg-tertiary);
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
		gap: 20px;
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
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 12px;
		color: var(--text-primary);
	}

	.empty-desc {
		font-size: 1.05rem;
		color: var(--text-secondary);
		margin-bottom: 32px;
	}

	.empty-desc code {
		font-family: 'JetBrains Mono', monospace;
		background: var(--bg-tertiary);
		padding: 3px 10px;
		border-radius: 6px;
		color: var(--accent);
		font-size: 0.95rem;
	}

	.empty-cta {
		display: inline-block;
		padding: 14px 32px;
		background: var(--accent);
		color: #000;
		text-decoration: none;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.95rem;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.empty-cta:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
	}

	.config-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 20px;
		text-decoration: none;
		color: inherit;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
		height: 3px;
		background: var(--card-color);
		transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.config-card:hover {
		transform: translateY(-6px);
		box-shadow: 0 0 30px color-mix(in srgb, var(--card-color) 20%, transparent);
		background: color-mix(in srgb, var(--bg-secondary) 95%, var(--card-color) 5%);
	}

	.config-card:hover .card-accent {
		height: 4px;
	}

	.config-card:hover .config-name {
		color: var(--card-color);
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
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid var(--card-color);
	}

	.username {
		font-size: 0.85rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.official-badge {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 2px 6px;
		background: color-mix(in srgb, #3b82f6 15%, transparent);
		color: #3b82f6;
		border-radius: 4px;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		margin-left: 4px;
	}

	.featured-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		color: var(--accent);
		border-radius: 6px;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.config-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.config-description {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-footer {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-top: auto;
		padding-top: 12px;
		border-top: 1px solid var(--border);
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.stat.packages {
		font-family: 'JetBrains Mono', monospace;
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
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		padding: 0 12px;
		background: var(--code-bg);
		border-radius: 8px;
	}

	.install-preview code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: var(--text-secondary);
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 10px 0;
	}

	.install-preview .prompt {
		color: var(--card-color);
		font-weight: 700;
	}

	.load-more-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 40px 0;
	}

	.load-more-count {
		font-size: 0.9rem;
		color: var(--text-muted);
		font-family: 'JetBrains Mono', monospace;
	}

	.load-more-btn {
		padding: 14px 40px;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		font-family: inherit;
	}

	.load-more-btn:hover:not(:disabled) {
		border-color: var(--accent);
		background: var(--accent);
		color: #000;
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(34, 197, 94, 0.2);
	}

	.load-more-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cta-banner {
		position: relative;
		padding: 100px 0;
		margin-top: 60px;
		overflow: hidden;
	}

	.cta-glow {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 800px;
		height: 400px;
		background: radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%);
		pointer-events: none;
	}

	.cta-content {
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
		position: relative;
	}

	.cta-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 16px;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.cta-desc {
		font-size: 1.05rem;
		color: var(--text-secondary);
		margin-bottom: 32px;
		line-height: 1.6;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 16px 36px;
		background: var(--accent);
		color: #000;
		border: none;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.cta-button:hover {
		background: var(--accent-hover);
		transform: translateY(-3px);
		box-shadow: 0 12px 32px rgba(34, 197, 94, 0.4);
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
