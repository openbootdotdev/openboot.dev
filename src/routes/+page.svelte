<script lang="ts">
	import PackageFingerprint from '$lib/components/PackageFingerprint.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let copied = $state('');

	function copyCommand(command: string, id: string) {
		navigator.clipboard.writeText(command);
		copied = id;
		setTimeout(() => (copied = ''), 2000);
	}

	// Scroll-reveal: arm an element (hidden + offset) then reveal when it enters
	// the viewport. Skipped under reduced-motion so content stays visible.
	function reveal(node: HTMLElement, params: { index?: number } = {}) {
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (reduce) return;
		node.classList.add('ob-rv-armed');
		if (params.index) node.style.transitionDelay = `${params.index * 85}ms`;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						node.classList.add('ob-shown');
						io.disconnect();
					}
				}
			},
			{ rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
		);
		io.observe(node);
		return {
			destroy() {
				io.disconnect();
			}
		};
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

	const steps = [
		{ n: '01', t: 'Run one command', d: 'Paste the curl line. Homebrew gets set up if needed.' },
		{ n: '02', t: 'Pick your tools', d: 'A terminal menu opens — preset or package by package.' },
		{ n: '03', t: 'Everything installs', d: 'Packages, shell, dotfiles, macOS prefs. Unattended.' },
		{ n: '04', t: 'Open a new terminal', d: "You're set up. A full day of setup, already done." }
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
					<h1 class="hero-title enter" style="animation-delay:0.05s">
						Fresh Mac?<br />Set it up in<br /><span class="accent">one command.</span>
					</h1>
					<p class="hero-subtitle enter" style="animation-delay:0.1s">
						Pick your stack in a terminal menu, then walk away while it installs everything.
					</p>
					<div class="install-command enter" style="animation-delay:0.13s">
						<span class="install-prompt">$</span>
						<code>curl -fsSL openboot.dev/install.sh | bash</code>
						<button class="copy-btn" class:copied={copied === 'main'} aria-label="Copy install command" onclick={() => copyCommand('curl -fsSL openboot.dev/install.sh | bash', 'main')}>
							<span>{copied === 'main' ? '✓ copied' : '⧉ copy'}</span>
						</button>
					</div>
					<p class="install-alt enter" style="animation-delay:0.21s">
						Have Homebrew? <code>brew install openbootdotdev/tap/openboot</code>
					</p>
				</div>

				<div class="hero-visual">
					<div class="hero-glow"></div>
					<div class="terminal-window enter-r" style="animation-delay:0.28s">
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
								<div><span class="t-accent">$</span> curl -fsSL openboot.dev/install.sh | bash</div>
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
								<div class="t-muted t-pl16">– <span class="t-strong">29</span> CLI packages</div>
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

			<section class="how-it-works">
				<div class="section-header" use:reveal>
					<p class="section-prompt"><span class="accent">&gt;</span> how it works</p>
				</div>
				<div class="steps-grid">
					{#each steps as s, i (s.n)}
						<div class="step" use:reveal={{ index: i }}>
							<div class="step-head">
								<span class="step-number">{s.n}</span>
								<span class="step-line"></span>
							</div>
							<div class="step-dot"></div>
							<h3>{s.t}</h3>
							<p>{s.d}</p>
						</div>
					{/each}
				</div>
			</section>

			{#if data.communityConfigs.length > 0}
				<section class="community">
					<div class="community-head" use:reveal>
						<p class="section-prompt"><span class="accent">&gt;</span> community configs</p>
						<a href="/explore" class="browse-btn">Browse all configs <span>→</span></a>
					</div>
					<div class="community-grid" use:reveal>
						{#each data.communityConfigs as c (c.slug)}
							<a class="cc-card" href="/{c.username}/{c.slug}">
								<div class="cc-head">
									<h3 class="cc-name">{c.name}</h3>
									<span class="cc-meta">{c.counts.cli} cli · {c.counts.cask} apps</span>
								</div>
								<div class="cc-fingerprint" aria-hidden="true">
									<PackageFingerprint counts={c.counts} seed={c.slug} />
								</div>
								<code class="cc-cmd"><span class="accent">$</span> curl -fsSL openboot.dev/{c.username}/{c.slug} | bash</code>
							</a>
						{/each}
					</div>
				</section>
			{/if}
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
		padding: 72px 0 96px;
		display: grid;
		grid-template-columns: 1fr 1.05fr;
		gap: 56px;
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
		-webkit-mask-image: radial-gradient(ellipse 70% 60% at 28% 40%, #000 0%, transparent 70%);
		mask-image: radial-gradient(ellipse 70% 60% at 28% 40%, #000 0%, transparent 70%);
		opacity: 0.22;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
	}

	.hero-title {
		font-size: clamp(2.3rem, 5vw, 3.1rem);
		font-weight: 500;
		line-height: 1.04;
		letter-spacing: -0.045em;
		color: var(--text-primary);
		margin: 0 0 16px;
	}

	.hero-title .accent {
		color: var(--accent);
	}

	.hero-subtitle {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0 0 26px;
		max-width: 38ch;
	}

	.install-command {
		display: inline-flex;
		align-items: center;
		gap: 13px;
		max-width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-hover);
		border-radius: 10px;
		padding: 13px 16px;
	}

	.install-prompt {
		color: var(--accent);
		flex-shrink: 0;
		user-select: none;
	}

	.install-command code {
		font-family: var(--font-mono);
		font-size: 0.88rem;
		color: var(--text-primary);
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
		margin: 14px 0 0;
	}

	.install-alt code {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--text-secondary);
	}

	/* ---------- terminal ---------- */
	.hero-visual {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.hero-glow {
		position: absolute;
		width: 60%;
		height: 60%;
		top: 8%;
		right: 0;
		border-radius: 50%;
		background: var(--accent);
		opacity: 0.06;
		filter: blur(110px);
		pointer-events: none;
	}

	.terminal-window {
		position: relative;
		width: 100%;
		max-width: 580px;
		border-radius: 13px;
		overflow: hidden;
		background: var(--bg-secondary);
		border: 1px solid var(--border-hover);
		box-shadow: 0 30px 70px -34px var(--shadow);
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
		height: 398px;
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

	/* terminal demo screens overlap so it never blanks */
	@keyframes ob-scrA {
		0% { opacity: 1; }
		24% { opacity: 1; }
		30% { opacity: 0; }
		91% { opacity: 0; }
		98% { opacity: 1; }
		100% { opacity: 1; }
	}

	@keyframes ob-scrB {
		0%, 24% { opacity: 0; }
		30%, 57% { opacity: 1; }
		63%, 100% { opacity: 0; }
	}

	@keyframes ob-scrC {
		0%, 57% { opacity: 0; }
		63%, 90% { opacity: 1; }
		97%, 100% { opacity: 0; }
	}

	/* entrance + scroll reveal */
	@keyframes ob-enter {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes ob-enter-r {
		from {
			opacity: 0;
			transform: translateY(28px) scale(0.985);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.enter {
		animation: ob-enter 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	.enter-r {
		animation: ob-enter-r 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	:global(.ob-rv-armed) {
		opacity: 0;
		transform: translateY(28px);
		transition:
			opacity 0.7s cubic-bezier(0.2, 0.7, 0.2, 1),
			transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
	}

	:global(.ob-rv-armed.ob-shown) {
		opacity: 1;
		transform: none;
	}

	/* ---------- how it works ---------- */
	.how-it-works {
		padding: 0 0 96px;
	}

	.section-header {
		margin-bottom: 44px;
	}

	.section-prompt {
		color: var(--text-muted);
		font-size: 0.95rem;
		letter-spacing: 0.01em;
		margin: 0;
	}

	.section-prompt .accent {
		color: var(--accent);
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

	/* ---------- community configs ---------- */
	.community {
		padding: 0 0 104px;
	}

	.community-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 32px;
		flex-wrap: wrap;
	}

	.browse-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--border-hover);
		border-radius: 9px;
		padding: 11px 18px;
		font-size: 0.84rem;
		color: var(--text-primary);
		white-space: nowrap;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.browse-btn:hover {
		border-color: var(--accent);
		background: var(--bg-secondary);
	}

	.community-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.cc-card {
		display: flex;
		flex-direction: column;
		gap: 13px;
		min-width: 0;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		color: inherit;
		transition:
			transform 0.2s ease,
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.cc-card:hover {
		transform: translateY(-4px);
		border-color: var(--border-hover);
		box-shadow: 0 16px 34px -16px var(--shadow);
	}

	.cc-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.cc-name {
		font-size: 1rem;
		font-weight: 500;
		margin: 0;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cc-meta {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.cc-fingerprint {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		height: 30px;
	}

	.cc-cmd {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cc-cmd .accent {
		color: var(--accent);
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
			padding: 56px 0 72px;
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

		.community-grid {
			grid-template-columns: 1fr 1fr;
		}

		.how-it-works {
			padding: 64px 0 72px;
		}
	}

	@media (max-width: 560px) {
		.container {
			padding: 0 22px;
		}

		.steps-grid {
			grid-template-columns: 1fr;
		}

		.community-grid {
			grid-template-columns: 1fr;
		}

		.install-command code {
			font-size: 0.8rem;
		}
	}
</style>
