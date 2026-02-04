<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Button from '$lib/components/Button.svelte';
	import { auth } from '$lib/stores/auth';

	let copied = $state('');
	let starCount = $state(0);

	onMount(() => {
		auth.check();

		fetch('https://api.github.com/repos/openbootdotdev/openboot')
			.then((r) => r.json())
			.then((data) => {
				if (data.stargazers_count) starCount = data.stargazers_count;
			})
			.catch(() => {});
	});

	function copyCommand(command: string, id: string) {
		navigator.clipboard.writeText(command);
		copied = id;
		setTimeout(() => (copied = ''), 2000);
	}

	const presets = [
		{
			id: 'minimal',
			name: 'minimal',
			icon: '🎯',
			description: 'CLI essentials for servers, containers, or minimalists. Fast and lightweight.',
			tools: ['ripgrep', 'fd', 'bat', 'fzf', 'lazygit', 'gh']
		},
		{
			id: 'developer',
			name: 'developer',
			icon: '⚡',
			badge: 'Recommended',
			description: 'Ready-to-code Mac setup. Everything you need to start building immediately.',
			tools: ['node', 'go', 'docker', 'VS Code', 'Chrome', 'OrbStack']
		},
		{
			id: 'full',
			name: 'full',
			icon: '🌟',
			description: 'Complete dev environment with languages, DevOps, databases, and AI tools.',
			tools: ['python', 'rust', 'kubectl', 'terraform', 'ollama', 'Cursor']
		}
	];
</script>

<svelte:head>
	<title>OpenBoot - One-line macOS Development Environment Setup</title>
	<meta name="description" content="Bootstrap your Mac development environment in minutes. One command to install everything you need - Homebrew, CLI tools, GUI apps, dotfiles, and Oh-My-Zsh. Snapshot your current setup and share it with your team." />
</svelte:head>

<header class="site-header">
	<div class="header-container">
		<a href="/" class="header-logo">OpenBoot</a>
		<div class="header-right">
			<ThemeToggle />
			{#if $auth.loading}
				<span class="loading-text">...</span>
			{:else if $auth.user}
				<Button href="/dashboard" variant="secondary">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
						<rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
					</svg>
					Dashboard
				</Button>
			{:else}
				<Button href="/api/auth/login" variant="secondary">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
					</svg>
					Login
				</Button>
			{/if}
		</div>
	</div>
</header>

<main>
	<div class="container">
		<section class="hero">
			<div class="hero-split">
				<div class="hero-left">
					<h1>One-line macOS<br />Dev Environment Setup</h1>
					<p class="subtitle">Bootstrap your Mac in minutes. Homebrew, CLI tools, GUI apps, dotfiles, and Oh-My-Zsh with a single command.</p>

					<div class="features-grid">
						<div class="feature-item">Beautiful interactive TUI</div>
						<div class="feature-item">Apple Silicon & Intel</div>
						<div class="feature-item">3 curated presets</div>
						<div class="feature-item">Oh-My-Zsh + aliases</div>
						<div class="feature-item">Snapshot & share setup</div>
						<div class="feature-item">macOS prefs tuning</div>
						<div class="feature-item">Dry-run mode</div>
						<div class="feature-item">100% open source</div>
					</div>

					<div class="install-command" id="install">
						<div class="install-prompt">$</div>
						<code>curl -fsSL https://openboot.dev/install | bash</code>
						<button class="copy-btn" onclick={() => copyCommand('curl -fsSL https://openboot.dev/install | bash', 'main')}>
							{#if copied === 'main'}
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
								Copied!
							{:else}
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
								Copy
							{/if}
						</button>
					</div>

					<div class="cta-buttons">
						<a href="#install" class="btn-get-started" onclick={(e) => { e.preventDefault(); document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' }); }}>
							Get Started
						</a>
						<a href="https://github.com/openbootdotdev/openboot" class="btn-github" target="_blank" rel="noopener">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							View on GitHub
							{#if starCount > 0}
								<span class="star-badge">{starCount}</span>
							{/if}
						</a>
					</div>

					<p class="privacy-note">No analytics. No telemetry. Your data stays on your machine.</p>
				</div>

				<div class="hero-right">
					<div class="terminal-window">
						<div class="terminal-titlebar">
							<div class="terminal-dots">
								<span class="dot dot-red"></span>
								<span class="dot dot-yellow"></span>
								<span class="dot dot-green"></span>
							</div>
							<span class="terminal-title">openboot</span>
							<div class="terminal-dots-spacer"></div>
						</div>
						<div class="terminal-body"><pre class="terminal-content"><span class="t-accent">  ⚡ OpenBoot</span> <span class="t-muted">— Developer Environment Setup</span>

  <span class="t-border">┌─</span> <span class="t-label">Formulae</span> <span class="t-border">─────────────────────────────────┐</span>
  <span class="t-border">│</span>  <span class="t-check">✓</span> <span class="t-text">ripgrep</span>     <span class="t-check">✓</span> <span class="t-text">fd</span>          <span class="t-check">✓</span> <span class="t-text">bat</span>         <span class="t-border">│</span>
  <span class="t-border">│</span>  <span class="t-check">✓</span> <span class="t-text">fzf</span>         <span class="t-check">✓</span> <span class="t-text">lazygit</span>     <span class="t-check">✓</span> <span class="t-text">gh</span>          <span class="t-border">│</span>
  <span class="t-border">│</span>  <span class="t-check">✓</span> <span class="t-text">jq</span>          <span class="t-check">✓</span> <span class="t-text">htop</span>        <span class="t-check">✓</span> <span class="t-text">tmux</span>        <span class="t-border">│</span>
  <span class="t-border">└────────────────────────────────────────────┘</span>

  <span class="t-border">┌─</span> <span class="t-label">Casks</span> <span class="t-border">────────────────────────────────────┐</span>
  <span class="t-border">│</span>  <span class="t-unchecked">◻</span> <span class="t-text">VS Code</span>     <span class="t-check">✓</span> <span class="t-text">Chrome</span>      <span class="t-check">✓</span> <span class="t-text">OrbStack</span>   <span class="t-border">│</span>
  <span class="t-border">│</span>  <span class="t-check">✓</span> <span class="t-text">Warp</span>        <span class="t-check">✓</span> <span class="t-text">Raycast</span>     <span class="t-unchecked">◻</span> <span class="t-text">Figma</span>      <span class="t-border">│</span>
  <span class="t-border">└────────────────────────────────────────────┘</span>

  <span class="t-help">← → tab · space toggle · enter confirm</span></pre>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="presets-section">
			<div class="section-header">
				<h2 class="section-title">Choose Your Preset</h2>
				<p class="section-subtitle">Start with a preset, customize with the interactive selector</p>
			</div>
			<div class="presets-container">
				{#each presets as preset}
					<button
						class="preset-card"
						class:featured={preset.id === 'developer'}
						class:copied={copied === preset.id}
						onclick={() => copyCommand(`curl -fsSL openboot.dev/install | bash -s -- --preset ${preset.id}`, preset.id)}
					>
						<div class="preset-icon">{preset.icon}</div>
						<div class="preset-header">
							<h3>
								{preset.name}
								{#if preset.badge}
									<span class="badge">{preset.badge}</span>
								{/if}
							</h3>
						</div>
						<p>{preset.description}</p>
						<div class="preset-tools">
							{#each preset.tools as tool}
								<span>{tool}</span>
							{/each}
						</div>
						<div class="command-preview">
							<span class="cmd">curl ... | bash -s -- --preset {preset.id}</span>
							<span class="hint">{copied === preset.id ? 'Copied!' : 'Click to copy'}</span>
						</div>
					</button>
				{/each}
			</div>

			<div class="custom-config-cta">
				{#if $auth.user}
					<p>Manage your custom configurations</p>
					<Button href="/dashboard" variant="secondary">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
							<rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
						</svg>
						Go to Dashboard
					</Button>
				{:else}
					<p>Want a custom setup for your team?</p>
					<Button href="/api/auth/login" variant="secondary">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
						</svg>
						Create Custom Config
					</Button>
				{/if}
			</div>
		</section>

		<section class="snapshot-section">
			<div class="section-header">
				<h2 class="section-title">Already Have a Setup?</h2>
				<p class="section-subtitle">Capture your current Mac's installed state and share it as a config</p>
			</div>

			<div class="snapshot-card">
				<div class="snapshot-content">
					<div class="snapshot-info">
					<div class="snapshot-flow">
						<p class="snapshot-description">
							Scan your existing machine — Homebrew packages, macOS preferences, shell & git config, and dev tools — and upload it as a shareable configuration. No preset needed.
						</p>
						<p class="snapshot-usecase">Perfect for team leads who want to share their proven setup as a team baseline.</p>
					</div>
						<div class="snapshot-detects">
							<span class="detect-tag">Homebrew formulae & casks</span>
							<span class="detect-tag">macOS preferences</span>
							<span class="detect-tag">Shell config</span>
							<span class="detect-tag">Git config</span>
						<span class="detect-tag">Dev tools</span>
						</div>
					</div>
				<div class="snapshot-command-area">
					<div class="snapshot-command">
						<code>curl -fsSL openboot.dev/install | bash -s -- snapshot</code>
						<button class="copy-btn" onclick={() => copyCommand('curl -fsSL https://openboot.dev/install | bash -s -- snapshot', 'snapshot')}>
							{copied === 'snapshot' ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</div>
				</div>
			</div>
		</section>
	</div>
</main>

<footer>
	<div class="container">
		<div class="footer-links">
			<a href="https://github.com/openbootdotdev/openboot">
				<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
				GitHub
			</a>
			<a href="https://github.com/openbootdotdev/openboot/issues">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
				Issues
			</a>
		<a href="/docs">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
			Docs
		</a>
		</div>
		<p class="footer-tagline">Set up your Mac the way it should be.</p>
		<p class="footer-text">MIT License</p>
	</div>
</footer>

<style>
	/* ── Layout ─────────────────────────────────────────── */

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}

	/* ── Header ─────────────────────────────────────────── */

	.site-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: var(--header-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid var(--border);
		z-index: 100;
		transition: background 0.3s;
	}

	.header-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 12px 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-logo {
		font-family: 'JetBrains Mono', monospace;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--accent);
		letter-spacing: -0.02em;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.loading-text {
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	/* ── Main ──────────────────────────────────────────── */

	main {
		padding: 80px 0 60px;
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		min-height: 100vh;
	}

	/* ── Hero ──────────────────────────────────────────── */

	.hero {
		padding: 48px 0 72px;
	}

	.hero-split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 56px;
		align-items: center;
	}

	.hero-left {
		display: flex;
		flex-direction: column;
	}

	.hero h1 {
		font-size: 2.75rem;
		font-weight: 800;
		line-height: 1.1;
		margin-bottom: 20px;
		letter-spacing: -0.03em;
		color: var(--text-primary);
	}

	.subtitle {
		font-size: 1.05rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 28px;
		max-width: 480px;
	}

	/* ── Features Grid (compact in hero left) ─────────── */

	.features-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px 24px;
		margin-bottom: 32px;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		padding: 3px 0;
	}

	.feature-item::before {
		content: '✓';
		color: var(--accent);
		font-weight: 700;
		font-size: 0.8rem;
		flex-shrink: 0;
	}

	/* ── Install Command (primary CTA) ────────────────── */

	.install-command {
		background: var(--code-bg);
		border: 1px solid var(--accent);
		border-radius: 12px;
		padding: 18px 20px;
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		gap: 12px;
		position: relative;
		box-shadow: 0 0 24px rgba(34, 197, 94, 0.1), 0 0 0 1px rgba(34, 197, 94, 0.15);
		transition: box-shadow 0.3s, border-color 0.3s;
	}

	.install-command:hover {
		box-shadow: 0 0 32px rgba(34, 197, 94, 0.18), 0 0 0 1px rgba(34, 197, 94, 0.25);
	}

	.install-prompt {
		color: var(--accent);
		font-family: 'JetBrains Mono', monospace;
		font-weight: 700;
		font-size: 1rem;
		flex-shrink: 0;
		user-select: none;
	}

	.install-command code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		color: var(--text-primary);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.copy-btn {
		background: var(--accent);
		border: none;
		color: #000;
		padding: 7px 14px;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		flex-shrink: 0;
	}

	.copy-btn:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	/* ── CTA Buttons ──────────────────────────────────── */

	.cta-buttons {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}

	.btn-get-started {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 24px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s;
		background: var(--accent);
		color: #000;
		border: none;
	}

	.btn-get-started:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
	}

	.btn-github {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s;
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.btn-github:hover {
		color: var(--text-primary);
		border-color: var(--border-hover);
		background: var(--bg-tertiary);
	}

	.star-badge {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		font-family: 'JetBrains Mono', monospace;
	}

	.star-badge::before {
		content: '★';
		color: #f59e0b;
		font-size: 0.7rem;
	}

	.privacy-note {
		color: var(--text-muted);
		font-size: 0.75rem;
		opacity: 0.7;
	}

	/* ── Terminal Mockup ──────────────────────────────── */

	.hero-right {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.terminal-window {
		width: 100%;
		max-width: 520px;
		border-radius: 12px;
		overflow: hidden;
		background: #1a1b26;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.06),
			0 8px 40px rgba(0, 0, 0, 0.5),
			0 0 60px rgba(34, 197, 94, 0.06);
	}

	.terminal-titlebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: #16161e;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.terminal-dots {
		display: flex;
		gap: 8px;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.dot-red { background: #ff5f57; }
	.dot-yellow { background: #febc2e; }
	.dot-green { background: #28c840; }

	.terminal-title {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 500;
	}

	.terminal-dots-spacer {
		width: 52px;
	}

	.terminal-body {
		padding: 20px;
		overflow-x: auto;
	}

	.terminal-content {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		line-height: 1.65;
		margin: 0;
		white-space: pre;
		color: #c0caf5;
	}

	/* Terminal text colors — always dark theme */
	.t-accent { color: #22c55e; font-weight: 700; }
	.t-muted { color: #565f89; }
	.t-border { color: #3b3f52; }
	.t-label { color: #7aa2f7; font-weight: 600; }
	.t-check { color: #22c55e; }
	.t-unchecked { color: #565f89; }
	.t-text { color: #c0caf5; }
	.t-help { color: #565f89; font-size: 0.68rem; }

	/* ── Presets Section ──────────────────────────────── */

	.presets-section {
		margin-bottom: 80px;
	}

	.section-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.section-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 12px;
		letter-spacing: -0.02em;
	}

	.section-subtitle {
		color: var(--text-secondary);
		font-size: 1rem;
	}

	.presets-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.preset-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 28px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		cursor: pointer;
		text-align: left;
	}

	.preset-card:hover {
		border-color: var(--border-hover);
		transform: translateY(-4px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--border-hover);
	}

	.preset-card.featured {
		background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(34, 197, 94, 0.06) 100%);
		border-color: rgba(34, 197, 94, 0.3);
	}

	.preset-card.featured:hover {
		border-color: rgba(34, 197, 94, 0.5);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(34, 197, 94, 0.08);
	}

	.preset-card.copied {
		border-color: var(--accent);
		box-shadow: 0 0 16px rgba(34, 197, 94, 0.15);
	}

	.preset-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		margin-bottom: 16px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.preset-header h3 {
		font-size: 1.1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
	}

	.badge {
		font-size: 0.6rem;
		padding: 3px 8px;
		background: var(--accent);
		color: #000;
		border-radius: 20px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.preset-card p {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 16px;
		line-height: 1.5;
	}

	.preset-tools {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.preset-tools span {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		padding: 4px 10px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 20px;
		color: var(--text-secondary);
		transition: all 0.2s;
	}

	.preset-card:hover .preset-tools span {
		border-color: var(--border-hover);
	}

	.command-preview {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 12px 20px;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 100%);
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		color: var(--accent);
		opacity: 0;
		transform: translateY(100%);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 0 0 16px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.preset-card:hover .command-preview {
		opacity: 1;
		transform: translateY(0);
	}

	.command-preview .hint {
		color: var(--text-muted);
		font-size: 0.65rem;
	}

	.custom-config-cta {
		text-align: center;
		margin-top: 32px;
	}

	.custom-config-cta p {
		color: var(--text-secondary);
		margin-bottom: 16px;
	}

	/* ── Snapshot Section ─────────────────────────────── */

	.snapshot-section {
		margin-bottom: 80px;
	}

	.snapshot-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 40px 44px;
		position: relative;
		overflow: hidden;
	}

	.snapshot-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--accent), rgba(34, 197, 94, 0.3), var(--accent));
		background-size: 200% 100%;
		animation: gradient-shift 6s ease infinite;
	}

	@keyframes gradient-shift {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	.snapshot-content {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 40px;
		align-items: center;
	}

	.snapshot-info {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.snapshot-description {
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.6;
		margin: 0;
	}

	.snapshot-usecase {
		color: var(--text-muted);
		font-size: 0.85rem;
		font-style: italic;
		margin: 0;
	}

	.snapshot-detects {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.detect-tag {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		padding: 5px 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 20px;
		color: var(--text-secondary);
		transition: border-color 0.2s;
	}

	.snapshot-card:hover .detect-tag {
		border-color: var(--border-hover);
	}

	.snapshot-command-area {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
		flex-shrink: 0;
	}

	.snapshot-command {
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 16px 20px;
		display: flex;
		align-items: center;
		gap: 16px;
		white-space: nowrap;
	}

	.snapshot-command code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.95rem;
		color: var(--accent);
	}

	/* ── Footer ───────────────────────────────────────── */

	footer {
		border-top: 1px solid var(--border);
		padding: 48px 0;
		text-align: center;
		background: var(--bg-primary);
	}

	.footer-links {
		display: flex;
		justify-content: center;
		gap: 32px;
		margin-bottom: 24px;
		flex-wrap: wrap;
	}

	.footer-links a {
		color: var(--text-muted);
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: color 0.2s;
	}

	.footer-links a:hover {
		color: var(--accent);
	}

	.footer-links svg {
		width: 16px;
		height: 16px;
	}

	.footer-tagline {
		color: var(--text-secondary);
		font-size: 0.9rem;
		margin-bottom: 8px;
		font-weight: 500;
	}

	.footer-text {
		color: var(--text-muted);
		font-size: 0.78rem;
	}

	/* ── Responsive ───────────────────────────────────── */

	@media (max-width: 960px) {
		.hero-split {
			grid-template-columns: 1fr;
			gap: 40px;
		}

		.hero-right {
			order: -1;
		}

		.terminal-window {
			max-width: 480px;
		}

		.hero h1 {
			font-size: 2.2rem;
		}

		.hero-left {
			align-items: center;
			text-align: center;
		}

		.features-grid {
			max-width: 400px;
			text-align: left;
		}

		.install-command {
			max-width: 100%;
		}

		.cta-buttons {
			justify-content: center;
		}

		.privacy-note {
			text-align: center;
		}

		.subtitle {
			max-width: 100%;
		}
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 1.75rem;
		}

		.presets-container {
			grid-template-columns: 1fr;
		}

		.snapshot-card {
			padding: 28px 24px;
		}

		.snapshot-content {
			grid-template-columns: 1fr;
			gap: 24px;
		}

		.snapshot-command-area {
			align-items: stretch;
		}

		.terminal-window {
			max-width: 100%;
		}

		.terminal-content {
			font-size: 0.6rem;
		}

		.install-command code {
			font-size: 0.78rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
			gap: 4px;
		}
	}
</style>
