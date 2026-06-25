<script lang="ts">
	import { auth } from '$lib/stores/auth';

	let copied = $state('');

	function copyCommand(command: string, id: string) {
		navigator.clipboard.writeText(command);
		copied = id;
		setTimeout(() => (copied = ''), 2000);
	}
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
					<p class="eyebrow"><span class="prompt">#</span> macOS bootstrap, automated</p>
					<h1 class="hero-title">
						Fresh Mac?<br />Set it up in<br /><span class="accent">one command.</span>
					</h1>
					<p class="hero-subtitle">
						One command installs Git, Node, Docker, VS Code, shell config, dotfiles—everything you'd normally spend your first day installing. Then snapshot your setup and share it with your team so they get the same thing.
					</p>

					<ul class="features-list">
						<li class="feature-item"><span class="check">✓</span> Installs Homebrew packages, apps, configures shell + macOS preferences</li>
						<li class="feature-item"><span class="check">✓</span> Snapshot your current Mac and recreate it on another machine</li>
						<li class="feature-item"><span class="check">✓</span> Share your exact setup with teammates via a one-line install URL</li>
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
							<div class="t-line"><span class="t-accent">✓</span> Checksum verified <span class="t-muted">·</span> Added to PATH</div>
							<div class="t-line t-head">=== OpenBoot Installer v0.20.0 ===</div>
							<div class="t-line t-note">[DRY-RUN MODE — no changes will be made]</div>
							<div class="t-line t-head">=== Step 1: Git configuration ===</div>
							<div class="t-line t-ok"><span class="t-accent">✓</span> Already configured: <span class="t-strong">jam &lt;jam@hey.com&gt;</span></div>
							<div class="t-line t-head">=== Step 2: Preset selection ===</div>
							<div class="t-line t-prompt-label">Choose your preset</div>
							<div class="t-line t-sel"><span class="t-accent">›</span> <span class="t-strong">developer</span> — Node, Go, Docker, VS Code</div>
							<div class="t-line t-opt">full — languages, DevOps, databases, AI</div>
							<div class="t-line t-opt">minimal — CLI essentials only</div>
							<div class="t-line t-keys">↑ up · ↓ down · / filter · ⏎ submit <span class="t-caret"></span></div>
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
						<div class="step-number">01</div>
						<h3>Run one command</h3>
						<p>Paste the curl command into your terminal. If Homebrew isn't installed, it sets that up too — Xcode tools and all. Then the package picker opens.</p>
					</div>
					<div class="step">
						<div class="step-number">02</div>
						<h3>Pick your tools</h3>
						<p>A terminal menu opens. Start from a preset or go package by package — toggle what you want, confirm, and you're done choosing.</p>
					</div>
					<div class="step">
						<div class="step-number">03</div>
						<h3>Everything installs itself</h3>
						<p>Packages download, shell gets configured, dotfiles get linked, macOS preferences get applied. It runs unattended — no babysitting needed.</p>
					</div>
					<div class="step">
						<div class="step-number">04</div>
						<h3>Open a new terminal</h3>
						<p>Your tools are there, aliases work, shell config is live. Everything that used to take a full day is already done.</p>
					</div>
				</div>
			</section>
		</div>
	</main>

	<footer>
		<div class="container">
			<p class="foot-prompt"><span class="accent">openboot</span> $ <span class="caret"></span></p>
			<div class="footer-cols">
				<div class="footer-col">
					<h4>Product</h4>
					<a href="/explore">Explore configs</a>
					{#if $auth.user}
						<a href="/dashboard">Dashboard</a>
					{:else}
						<a href="/login">Custom configs</a>
					{/if}
					<a href="/docs">Documentation</a>
				</div>
				<div class="footer-col">
					<h4>Open source</h4>
					<a href="https://github.com/openbootdotdev/openboot" target="_blank" rel="noopener">GitHub</a>
					<a href="https://github.com/openbootdotdev/openboot/issues" target="_blank" rel="noopener">Issues</a>
				</div>
			</div>
			<p class="footer-legal">Open source, zero telemetry · MIT License · © 2026 OpenBoot</p>
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

	.eyebrow {
		color: var(--text-muted);
		font-size: 0.8rem;
		letter-spacing: 0.02em;
		margin: 0 0 26px;
	}

	.eyebrow .prompt {
		color: var(--accent);
	}

	.hero-title {
		font-size: clamp(2.3rem, 4.6vw, 3.4rem);
		font-weight: 500;
		line-height: 1.05;
		letter-spacing: -0.04em;
		color: var(--text-primary);
		margin: 0 0 26px;
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
		background: var(--bg-secondary);
		padding: 18px 18px 20px;
		font-size: 0.76rem;
		line-height: 1.85;
		color: var(--text-secondary);
	}

	.t-line {
		white-space: nowrap;
	}

	.t-accent {
		color: var(--accent);
	}

	.t-muted {
		color: var(--text-muted);
	}

	.t-strong {
		color: var(--text-primary);
	}

	.t-head {
		color: var(--accent);
		margin-top: 10px;
	}

	.t-note {
		color: var(--text-muted);
		margin-top: 8px;
	}

	.t-ok {
		margin-top: 4px;
	}

	.t-prompt-label {
		color: var(--amber);
		margin-top: 6px;
	}

	.t-sel {
		margin-top: 2px;
	}

	.t-opt {
		color: var(--text-muted);
		padding-left: 14px;
	}

	.t-keys {
		color: var(--text-muted);
		margin-top: 10px;
	}

	.t-caret {
		display: inline-block;
		width: 7px;
		height: 1em;
		background: var(--accent);
		translate: 0 2px;
		animation: ob-blink 1s infinite;
	}

	@keyframes ob-blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}

	/* ---------- how it works ---------- */
	.how-it-works {
		padding: 104px 0;
		border-top: 1px solid var(--border);
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
		font-size: 1.7rem;
		font-weight: 500;
		letter-spacing: -0.025em;
		color: var(--text-primary);
		margin: 0;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1px;
		background: var(--border);
		border: 1px solid var(--border);
		border-radius: 13px;
		overflow: hidden;
	}

	.step {
		background: var(--bg-primary);
		padding: 28px 24px 32px;
		transition: background 0.2s ease;
	}

	.step:hover {
		background: var(--bg-secondary);
	}

	.step-number {
		color: var(--accent);
		font-size: 0.85rem;
		letter-spacing: 0.04em;
	}

	.step h3 {
		font-size: 0.98rem;
		font-weight: 500;
		margin: 22px 0 12px;
		letter-spacing: -0.01em;
		color: var(--text-primary);
	}

	.step p {
		color: var(--text-secondary);
		font-size: 0.82rem;
		line-height: 1.7;
		margin: 0;
	}

	/* ---------- footer ---------- */
	footer {
		border-top: 1px solid var(--border);
		padding: 66px 0 76px;
	}

	.foot-prompt {
		color: var(--text-muted);
		font-size: 0.88rem;
		margin: 0 0 46px;
	}

	.foot-prompt .accent {
		color: var(--accent);
	}

	.caret {
		display: inline-block;
		width: 7px;
		height: 1.02em;
		background: var(--accent);
		translate: 0 2px;
	}

	.footer-cols {
		display: flex;
		gap: 90px;
		flex-wrap: wrap;
		margin-bottom: 50px;
	}

	.footer-col h4 {
		font-size: 0.72rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin: 0 0 18px;
		font-weight: 500;
	}

	.footer-col a {
		display: block;
		color: var(--text-secondary);
		font-size: 0.85rem;
		margin-bottom: 12px;
		transition: color 0.15s ease;
	}

	.footer-col a:hover {
		color: var(--accent);
	}

	.footer-legal {
		color: var(--text-muted);
		font-size: 0.78rem;
		border-top: 1px solid var(--border);
		padding-top: 28px;
		letter-spacing: 0.01em;
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
		}

		.how-it-works {
			padding: 80px 0;
		}
	}

	@media (max-width: 560px) {
		.container {
			padding: 0 22px;
		}

		.steps-grid {
			grid-template-columns: 1fr;
		}

		.install-command code {
			font-size: 0.8rem;
		}

		.footer-cols {
			gap: 48px;
		}
	}
</style>
