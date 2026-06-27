<script lang="ts">
	import { onMount } from 'svelte';

	let copied = $state('');
	// Default to the design's reference number; replaced by the live edge-cached count.
	let starCount = $state(108);

	onMount(() => {
		fetch('/api/github/stars')
			.then((r) => r.json())
			.then((data) => {
				if (data.stars) starCount = data.stars;
			})
			.catch(() => {});
	});

	function copyCommand(command: string, id: string) {
		navigator.clipboard.writeText(command);
		copied = id;
		setTimeout(() => (copied = ''), 2000);
	}

	// Packages shown in the animated terminal demo (package-picker screen)
	const demoPackages = [
		{ name: 'curl', desc: 'Transfer data with URLs' },
		{ name: 'wget', desc: 'Network downloader' },
		{ name: 'jq', desc: 'JSON processor' },
		{ name: 'yq', desc: 'YAML processor' },
		{ name: 'ripgrep', desc: 'Fast grep alternative' },
		{ name: 'fd', desc: 'Fast find alternative' },
		{ name: 'bat', desc: 'Cat with syntax highlighting' },
		{ name: 'eza', desc: 'Modern ls replacement' },
		{ name: 'fzf', desc: 'Fuzzy finder' },
		{ name: 'zoxide', desc: 'Smarter cd command' },
		{ name: 'htop', desc: 'Interactive process viewer' },
		{ name: 'btop', desc: 'Resource monitor' },
		{ name: 'tree', desc: 'Directory tree viewer' },
		{ name: 'tealdeer', desc: 'Simplified man pages (tldr)' }
	];
</script>

<svelte:head>
	<title>OpenBoot - Set up your Mac in one command</title>
	<meta name="description" content="One command installs Git, Node, Docker, VS Code, shell config, dotfiles—everything you'd spend hours installing manually. Snapshot your setup and share it with your team." />
	<meta property="og:title" content="OpenBoot - Set up your Mac in one command" />
	<meta property="og:description" content="One command installs Git, Node, Docker, VS Code, shell config, dotfiles—everything you'd spend hours installing manually. Snapshot your setup and share it with your team." />
	<meta property="og:image" content="https://openboot.dev/og-image.png" />
	<meta property="og:url" content="https://openboot.dev" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="OpenBoot - Automate macOS dev environment setup" />
	<meta name="twitter:description" content="CLI that installs Homebrew packages, apps, shell config, dotfiles, and macOS preferences in one run. Open source, zero telemetry." />
	<meta name="twitter:image" content="https://openboot.dev/og-image.png" />
	<script type="application/ld+json">{JSON.stringify({
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "OpenBoot",
		"url": "https://openboot.dev",
		"applicationCategory": "DeveloperApplication",
		"operatingSystem": "macOS",
		"description": "Set up your Mac dev environment in one command. Installs Homebrew packages, apps, shell config, dotfiles, and macOS preferences. Snapshot your setup and share it with your team.",
		"offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
		"license": "https://github.com/openbootdotdev/openboot/blob/main/LICENSE",
		"codeRepository": "https://github.com/openbootdotdev/openboot",
		"publisher": {
			"@type": "Organization",
			"name": "OpenBoot",
			"url": "https://openboot.dev"
		}
	})}</script>
</svelte:head>

<div class="page-wrapper">
	<main>
		<div class="container">
			<section class="hero">
				<div class="hero-grid"></div>
				<div class="hero-content">
					<div class="hero-badge">
						<span class="badge-dot"></span>
						<span class="badge-label">macOS bootstrap, automated</span>
						<span class="badge-version">v0.44</span>
					</div>
					<h1 class="hero-title">
						Fresh Mac?<br />Set it up in<br /><span class="accent">one command.</span>
					</h1>
					<p class="hero-subtitle">
						One command installs Git, Node, Docker, VS Code, shell config, dotfiles — everything you'd normally spend your first day installing. Then snapshot your setup and share it with your team.
					</p>

					<ul class="features-list">
						<li class="feature-item"><span class="check">✓</span> Installs Homebrew packages, apps, configures shell + macOS preferences</li>
						<li class="feature-item"><span class="check">✓</span> Snapshot your current Mac and recreate it on another machine</li>
						<li class="feature-item"><span class="check">✓</span> Share your exact setup via a one-line install URL</li>
					</ul>

					<div class="install-section">
						<div class="install-command">
							<span class="install-prompt">$</span>
							<code>curl -fsSL openboot.dev/install.sh | bash</code>
							<button class="copy-btn" class:copied={copied === 'main'} aria-label="Copy install command" onclick={() => copyCommand('curl -fsSL openboot.dev/install.sh | bash', 'main')}>
								<span>{copied === 'main' ? '✓ copied' : '⧉ copy'}</span>
							</button>
						</div>
						<p class="install-alt">
							Have Homebrew? <code>brew install openbootdotdev/tap/openboot</code>
						</p>
					</div>
				</div>

				<div class="hero-visual">
					<div class="terminal-window">
						<div class="terminal-header">
							<div class="terminal-dots">
								<span class="dot dot-red"></span>
								<span class="dot dot-yellow"></span>
								<span class="dot dot-green"></span>
							</div>
							<span class="terminal-title">openboot — install</span>
							<div class="terminal-spacer"></div>
						</div>
						<div class="terminal-body">
							<!-- SCREEN A: bootstrap log -->
							<div class="t-screen t-screen-a">
								<div><span class="t-accent">$</span> curl -fsSL openboot.dev/install | bash</div>
								<div class="t-head t-mt14">OpenBoot Installer</div>
								<div class="t-accent">==================</div>
								<div class="t-mt13"><span class="t-accent">✓</span> Xcode Command Line Tools ready</div>
								<div><span class="t-accent">✓</span> Homebrew ready</div>
								<div class="t-mt13 t-muted">Detected: darwin/arm64</div>
								<div class="t-strong">Downloading OpenBoot v0.44.0...</div>
								<div><span class="t-accent">✓</span> Downloaded to ~/.openboot/bin/openboot</div>
								<div><span class="t-accent">✓</span> Checksum verified</div>
								<div><span class="t-accent">✓</span> Added to PATH</div>
								<div class="t-mt10"><span class="t-caret"></span></div>
							</div>

							<!-- SCREEN B: package picker TUI -->
							<div class="t-screen t-screen-b">
								<div class="tui-tabs">
									<span class="tui-tab active">Formulae</span>
									<span class="tui-tab">Casks</span>
									<span class="tui-tab">NPM</span>
									<span class="tui-preset">developer preset</span>
								</div>
								<div class="tui-list">
									{#each demoPackages as pkg, i (pkg.name)}
										<div class="tui-row" class:selected={i === 0}>
											{#if i === 0}<span class="tui-arrow">›</span>{/if}
											<span class="t-accent tui-check">[✓]</span>
											<span class="t-accent tui-name">{pkg.name}</span>
											<span class="t-muted tui-desc">{pkg.desc}</span>
										</div>
									{/each}
								</div>
								<div class="tui-selected">Selected: <span class="t-strong">48</span> packages</div>
								<div class="tui-keys">
									Tab/←→ switch <span class="tui-sep">•</span> ↑↓ navigate
									<span class="tui-sep">•</span> Space toggle <span class="tui-sep">•</span> / search
									<span class="tui-sep">•</span> a all <span class="tui-sep">•</span> ⏎ Enter
								</div>
							</div>

							<!-- SCREEN C: installation complete -->
							<div class="t-screen t-screen-c">
								<div class="t-head">=== Installation Complete! ===</div>
								<div class="t-mt14"><span class="t-accent">✓</span> <span class="t-accent">OpenBoot has successfully configured your Mac.</span></div>
								<div class="t-mt15 t-strong">What was installed:</div>
								<div class="t-muted t-pl16">– Git configured with your identity</div>
								<div class="t-muted t-pl16">– <span class="t-strong">28</span> CLI packages</div>
								<div class="t-muted t-pl16">– <span class="t-strong">14</span> GUI applications</div>
								<div class="t-muted t-pl16">– <span class="t-strong">5</span> npm global packages</div>
								<div class="t-mt15 t-strong">Next steps:</div>
								<div class="t-muted t-pl16">– Restart your terminal to apply changes</div>
								<div class="t-muted t-pl16">– Run <span class="t-amber">'brew doctor'</span> to verify Homebrew health</div>
								<div class="t-mt14"><span class="t-accent">$</span> <span class="t-caret"></span></div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section class="stats">
					<div class="stats-card">
						<div class="stats-grid">
							<div class="stat">
								<div class="stat-num accent">{starCount}</div>
								<div class="stat-label">GitHub stars</div>
							</div>
							<div class="stat">
								<div class="stat-num">~4<span class="stat-unit">min</span></div>
								<div class="stat-label">average setup time</div>
							</div>
							<div class="stat">
								<div class="stat-num">48<span class="stat-unit">pkgs</span></div>
								<div class="stat-label">curated in the default preset</div>
							</div>
							<div class="stat">
								<div class="stat-num amber">0</div>
								<div class="stat-label">telemetry · MIT licensed</div>
							</div>
						</div>
					</div>
				</section>

				<section class="how-it-works">
				<div class="section-header">
					<p class="section-prompt"><span class="accent">&gt;</span> how it works</p>
					<h2 class="section-title">One command, a few picks, done in under 30 minutes.</h2>
				</div>

				<div class="steps-grid">
					<div class="step">
						<div class="step-head">
								<span class="step-number">01</span>
								<span class="step-line"></span>
							</div>
							<div class="step-dot"></div>
						<h3>Run one command</h3>
						<p>Paste the curl command into your terminal. If Homebrew isn't installed, it sets that up too.</p>
					</div>
					<div class="step">
						<div class="step-head">
								<span class="step-number">02</span>
								<span class="step-line"></span>
							</div>
							<div class="step-dot"></div>
						<h3>Pick your tools</h3>
						<p>A terminal menu opens. Start from a preset or go package by package — toggle what you want.</p>
					</div>
					<div class="step">
						<div class="step-head">
								<span class="step-number">03</span>
								<span class="step-line"></span>
							</div>
							<div class="step-dot"></div>
						<h3>Everything installs</h3>
						<p>Packages download, shell gets configured, dotfiles linked, macOS prefs applied. Unattended.</p>
					</div>
					<div class="step">
						<div class="step-head">
								<span class="step-number">04</span>
								<span class="step-line"></span>
							</div>
							<div class="step-dot"></div>
						<h3>Open a new terminal</h3>
						<p>Your tools are there, aliases work, shell config is live. A full day of setup, already done.</p>
					</div>
				</div>
			</section>
		</div>
	</main>

	<footer>
		<div class="container footer-inner">
			<p class="foot-tagline">
				<span class="accent">openboot</span> $ <span class="foot-tagline-text">set up your Mac the way it should be</span>
			</p>
			<p class="footer-legal">Open source, zero telemetry · MIT · © 2026</p>
		</div>
	</footer>
</div>

<style>
	.page-wrapper {
		position: relative;
		min-height: 100vh;
	}

	.container {
		max-width: 1160px;
		margin: 0 auto;
		padding: 0 36px;
		position: relative;
	}

	main {
		padding-top: 56px;
	}

	/* ---------- hero ---------- */
	.hero {
		position: relative;
		padding: 108px 0 110px;
		display: grid;
		grid-template-columns: 1.05fr 0.95fr;
		gap: 60px;
		align-items: center;
	}

	.hero-grid {
		position: absolute;
		inset: -40px 0 0;
		z-index: -1;
		pointer-events: none;
		background-image:
			linear-gradient(var(--border) 1px, transparent 1px),
			linear-gradient(90deg, var(--border) 1px, transparent 1px);
		background-size: 46px 46px;
		-webkit-mask-image: radial-gradient(ellipse 75% 55% at 22% 30%, #000 0%, transparent 68%);
		mask-image: radial-gradient(ellipse 75% 55% at 22% 30%, #000 0%, transparent 68%);
		opacity: 0.45;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		align-self: flex-start;
		border: 1px solid var(--border-hover);
		border-radius: 100px;
		padding: 6px 13px 6px 11px;
		margin: 0 0 28px;
	}

	.badge-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		animation: ob-pulse 1.8s ease infinite;
	}

	.badge-label {
		font-size: 0.76rem;
		color: var(--text-secondary);
		letter-spacing: 0.01em;
	}

	.badge-version {
		font-size: 0.7rem;
		color: var(--text-muted);
		border-left: 1px solid var(--border-hover);
		padding-left: 9px;
	}

	.hero-title {
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 500;
		line-height: 1.02;
		letter-spacing: -0.045em;
		color: var(--text-primary);
		margin: 0 0 24px;
	}

	.hero-title .accent {
		color: var(--accent);
	}

	.hero-subtitle {
		font-size: 0.94rem;
		color: var(--text-secondary);
		line-height: 1.75;
		margin: 0 0 32px;
		max-width: 52ch;
	}

	.features-list {
		list-style: none;
		display: grid;
		gap: 12px;
		margin: 0 0 36px;
		padding: 0;
	}

	.feature-item {
		display: flex;
		align-items: baseline;
		gap: 12px;
		color: var(--text-secondary);
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.feature-item .check {
		color: var(--accent);
		font-size: 0.8rem;
		flex-shrink: 0;
	}

	.install-section {
		display: flex;
		flex-direction: column;
		gap: 17px;
	}

	.install-command {
		background: var(--bg-secondary);
		border: 1px solid var(--border-hover);
		border-radius: 10px;
		padding: 15px 16px;
		display: flex;
		align-items: center;
		gap: 13px;
		max-width: 500px;
		font-size: 0.9rem;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease;
	}

	.install-command:hover {
		border-color: var(--accent-deep);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	.install-prompt {
		color: var(--accent);
		flex-shrink: 0;
		user-select: none;
	}

	.install-command code {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--text-primary);
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.copy-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		padding: 0;
		cursor: pointer;
		transition: color 0.15s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		font-family: inherit;
		font-size: 0.78rem;
	}

	.copy-btn:hover {
		color: var(--accent);
	}

	.copy-btn.copied {
		color: var(--accent);
	}

	.install-alt {
		color: var(--text-muted);
		font-size: 0.78rem;
		margin: 0;
	}

	.install-alt code {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--text-secondary);
	}

	/* ---------- terminal ---------- */
	.hero-visual {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.terminal-window {
		width: 100%;
		max-width: 560px;
		border-radius: 12px;
		overflow: hidden;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		box-shadow:
			0 1px 0 color-mix(in srgb, var(--text-primary) 6%, transparent) inset,
			0 30px 60px -20px var(--shadow);
	}

	.terminal-header {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 13px 15px;
		border-bottom: 1px solid var(--border);
	}

	.terminal-dots {
		display: flex;
		gap: 7px;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		opacity: 0.9;
	}

	.dot-red { background: #d4655c; }
	.dot-yellow { background: #c9a14e; }
	.dot-green { background: #4ec98a; }

	.terminal-title {
		margin: 0 auto;
		font-size: 0.72rem;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	.terminal-spacer {
		width: 44px;
	}

	.terminal-body {
		position: relative;
		height: 486px;
		overflow: hidden;
		background: var(--bg-secondary);
		font-size: 0.72rem;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	/* three demo screens cross-fade on a loop: bootstrap → picker → done */
	.t-screen {
		position: absolute;
		inset: 0;
		opacity: 0;
	}

	.t-screen-a {
		padding: 16px 18px;
		animation: ob-scrA 15s ease infinite;
	}

	.t-screen-b {
		display: flex;
		flex-direction: column;
		animation: ob-scrB 15s ease infinite;
	}

	.t-screen-c {
		padding: 16px 18px;
		animation: ob-scrC 15s ease infinite;
	}

	.t-accent { color: var(--accent); }
	.t-muted { color: var(--text-muted); }
	.t-strong { color: var(--text-primary); }
	.t-amber { color: var(--amber); }

	.t-head {
		color: var(--accent);
		font-weight: 600;
	}

	.t-mt10 { margin-top: 10px; }
	.t-mt13 { margin-top: 13px; }
	.t-mt14 { margin-top: 14px; }
	.t-mt15 { margin-top: 15px; }
	.t-pl16 { padding-left: 16px; }

	.t-caret {
		display: inline-block;
		width: 7px;
		height: 1em;
		background: var(--text-secondary);
		translate: 0 2px;
		animation: ob-blink 1s infinite;
	}

	/* ── package-picker TUI (screen B) ── */
	.tui-tabs {
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 14px 16px 9px;
		border-bottom: 1px solid var(--border);
		font-size: 0.71rem;
		white-space: nowrap;
	}

	.tui-tab { color: var(--text-muted); }

	.tui-tab.active {
		color: var(--accent);
		font-weight: 600;
		border-bottom: 2px solid var(--accent);
		padding-bottom: 9px;
		margin-bottom: -11px;
	}

	.tui-preset {
		margin-left: auto;
		color: var(--text-muted);
		font-size: 0.68rem;
	}

	.tui-list { padding: 9px 14px 4px; }

	.tui-row {
		position: relative;
		height: 20px;
		display: flex;
		align-items: center;
		gap: 7px;
		padding-left: 18px;
		white-space: nowrap;
		overflow: hidden;
	}

	.tui-row.selected {
		border-radius: 5px;
		background: var(--accent-glow);
		box-shadow: inset 2px 0 0 var(--accent);
	}

	.tui-arrow {
		position: absolute;
		left: 5px;
		color: var(--accent);
	}

	.tui-check { flex-shrink: 0; }

	.tui-name {
		width: 74px;
		flex-shrink: 0;
	}

	.tui-selected {
		padding: 6px 16px;
		color: var(--text-secondary);
	}

	.tui-keys {
		margin-top: auto;
		padding: 9px 16px;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.66rem;
	}

	.tui-sep { color: var(--border-hover); }

	@keyframes ob-blink {
		0%,
		49% { opacity: 1; }
		50%,
		100% { opacity: 0; }
	}

	@keyframes ob-scrA {
		0%, 1% { opacity: 0; }
		4%, 19% { opacity: 1; }
		23%, 100% { opacity: 0; }
	}

	@keyframes ob-scrB {
		0%, 25% { opacity: 0; }
		28%, 70% { opacity: 1; }
		73%, 100% { opacity: 0; }
	}

	@keyframes ob-scrC {
		0%, 75% { opacity: 0; }
		78%, 97% { opacity: 1; }
		99.5%, 100% { opacity: 0; }
	}

	@keyframes ob-pulse {
		0%,
		100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.45; transform: scale(1.5); }
	}

	/* ---------- stats band ---------- */
	.stats {
		padding: 60px 0;
		border-top: 1px solid var(--border);
	}

	.stats-card {
		position: relative;
		border: 1px solid var(--border-hover);
		border-radius: 16px;
		overflow: hidden;
		background: var(--bg-secondary);
	}

	.stats-card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(120deg, var(--accent-glow), transparent 55%);
		pointer-events: none;
	}

	.stats-grid {
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
	}

	.stat {
		padding: 34px 30px;
		border-right: 1px solid var(--border);
	}

	.stat:last-child {
		border-right: none;
	}

	.stat-num {
		font-size: 2.6rem;
		font-weight: 500;
		letter-spacing: -0.03em;
		line-height: 1;
		color: var(--text-primary);
	}

	.stat-num.accent {
		color: var(--accent);
	}

	.stat-num.amber {
		color: var(--amber);
	}

	.stat-unit {
		font-size: 1.1rem;
		color: var(--text-muted);
		margin-left: 4px;
	}

	.stat-label {
		font-size: 0.78rem;
		color: var(--text-secondary);
		margin-top: 12px;
	}

	/* ---------- how it works ---------- */
	.how-it-works {
		padding: 60px 0 104px;
	}

	.section-header {
		margin-bottom: 56px;
	}

	.section-prompt {
		color: var(--text-muted);
		font-size: 0.85rem;
		letter-spacing: 0.01em;
		margin: 0 0 16px;
	}

	.section-prompt .accent {
		color: var(--accent);
	}

	.section-title {
		font-size: 1.9rem;
		font-weight: 500;
		letter-spacing: -0.03em;
		color: var(--text-primary);
		margin: 0;
		max-width: 22ch;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0;
	}

	.step {
		position: relative;
		padding: 0 28px 0 0;
	}

	.step-head {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 24px;
	}

	.step-number {
		font-size: 3rem;
		font-weight: 600;
		letter-spacing: -0.04em;
		color: var(--border-hover);
		line-height: 1;
	}

	.step-line {
		flex: 1;
		height: 1px;
		background: var(--border);
	}

	.step-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		margin-bottom: 18px;
	}

	.step h3 {
		font-size: 1.02rem;
		font-weight: 500;
		margin: 0 0 12px;
		letter-spacing: -0.01em;
		color: var(--text-primary);
	}

	.step p {
		color: var(--text-secondary);
		font-size: 0.84rem;
		line-height: 1.72;
		margin: 0;
	}

	/* ---------- footer ---------- */
	footer {
		border-top: 1px solid var(--border);
		margin-top: 8px;
	}

	.footer-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
		padding-top: 26px;
		padding-bottom: 26px;
	}

	.foot-tagline {
		font-size: 0.82rem;
		color: var(--text-muted);
		margin: 0;
	}

	.foot-tagline .accent {
		color: var(--accent);
	}

	.foot-tagline-text {
		color: var(--text-secondary);
	}

	.footer-legal {
		color: var(--text-muted);
		font-size: 0.78rem;
		margin: 0;
	}

	@media (max-width: 880px) {
		.hero {
			grid-template-columns: 1fr;
			gap: 44px;
			padding: 72px 0;
		}

		.hero-visual {
			order: -1;
		}

		.hero-grid {
			display: none;
		}

		.steps-grid {
			grid-template-columns: 1fr 1fr;
			gap: 36px 0;
		}

		.stats-grid {
			grid-template-columns: 1fr 1fr;
		}

		.stat {
			border-bottom: 1px solid var(--border);
		}

		.stat:nth-child(2n) {
			border-right: none;
		}

		.stat:nth-last-child(-n + 2) {
			border-bottom: none;
		}

		.how-it-works {
			padding: 60px 0 80px;
		}
	}

	@media (max-width: 560px) {
		.container {
			padding: 0 22px;
		}

		.steps-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat {
			border-right: none;
			border-bottom: 1px solid var(--border);
		}

		.stat:nth-last-child(-n + 2) {
			border-bottom: 1px solid var(--border);
		}

		.stat:last-child {
			border-bottom: none;
		}

		.install-command code {
			font-size: 0.8rem;
		}
	}
</style>
