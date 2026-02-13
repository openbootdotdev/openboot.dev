<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';

	let copied = $state('');
	let starCount = $state(0);

	onMount(() => {
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
</script>

<svelte:head>
	<title>OpenBoot - Set up your Mac or capture your setup in one command</title>
	<meta name="description" content="Stop wasting your first day setting up a new Mac. One command installs Git, Node, Docker, VS Code, and 80+ other dev tools in 15 minutes." />
	<meta property="og:title" content="OpenBoot - Set up your Mac or capture your setup in one command" />
	<meta property="og:description" content="Stop wasting your first day setting up a new Mac. One command installs Git, Node, Docker, VS Code, and 80+ other dev tools in 15 minutes." />
	<meta property="og:image" content="https://openboot.dev/og-image.png" />
	<meta property="og:url" content="https://openboot.dev" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="OpenBoot - Set up your Mac or capture your setup in one command" />
	<meta name="twitter:description" content="Stop wasting your first day setting up a new Mac. One command installs Git, Node, Docker, VS Code, and 80+ other dev tools in 15 minutes." />
	<meta name="twitter:image" content="https://openboot.dev/og-image.png" />
</svelte:head>

<div class="page-wrapper">
	<main>
		<div class="hero-background">
			<div class="hero-glow hero-glow-primary"></div>
			<div class="hero-glow hero-glow-secondary"></div>
			<div class="grid-overlay"></div>
		</div>

		<div class="container">
			<section class="hero">
				<div class="hero-content">
				<h1 class="hero-title">
					Stop wasting your first day<br />setting up a new Mac
				</h1>
				<p class="hero-subtitle">
					One command installs Git, Node, Docker, VS Code, and 80+ other tools. Fresh Mac to fully productive in 15 minutes. Then share your exact setup with your team so they can do the same.
				</p>

				<div class="features-list">
				<div class="feature-item">
					<svg class="feature-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					<span>No more Googling "Mac setup for developers" — it's all here</span>
				</div>
				<div class="feature-item">
					<svg class="feature-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					<span>Resume exactly where you left off after wiping your Mac</span>
				</div>
				<div class="feature-item">
					<svg class="feature-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					<span>New teammate onboards in 10 minutes, not 2 days</span>
				</div>
				</div>

					<div class="install-section">
						<div class="install-command-wrapper">
							<div class="install-command">
								<div class="install-prompt">$</div>
								<code>brew install openbootdotdev/tap/openboot</code>
								<button class="copy-btn" onclick={() => copyCommand('brew install openbootdotdev/tap/openboot', 'main')}>
									{#if copied === 'main'}
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
											<polyline points="20 6 9 17 4 12"/>
										</svg>
										Copied
									{:else}
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
										</svg>
										Copy
									{/if}
								</button>
							</div>
						</div>
						<p class="install-alt">
							Alternative: <code>curl -fsSL openboot.dev/install.sh | bash</code>
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
							<span class="terminal-title">openboot</span>
							<div class="terminal-spacer"></div>
						</div>
						<div class="terminal-body">
							<img src="/demo.gif" alt="OpenBoot demo — installing dev tools in one command" loading="eager" />
						</div>
					</div>
				</div>
			</section>

			<section class="how-it-works">
				<div class="section-header">
					<h2 class="section-title">How It Works</h2>
					<p class="section-subtitle">From zero to coding in 4 steps</p>
				</div>

				<div class="steps-container">
					<div class="steps-line"></div>
					<div class="steps-grid">
						<div class="step step-1">
							<div class="step-number">
								<span>1</span>
							</div>
							<h3>Run one command</h3>
							<p>Paste the curl command in Terminal. OpenBoot downloads and launches automatically.</p>
						</div>
						<div class="step step-2">
							<div class="step-number">
								<span>2</span>
							</div>
							<h3>Pick your tools</h3>
							<p>Use the interactive TUI to pick a preset or toggle exactly what you want.</p>
						</div>
						<div class="step step-3">
							<div class="step-number">
								<span>3</span>
							</div>
							<h3>Grab a coffee</h3>
							<p>OpenBoot installs Homebrew, CLI tools, apps, dotfiles, and configures macOS for you.</p>
						</div>
						<div class="step step-4">
							<div class="step-number">
								<span>4</span>
							</div>
							<h3>Start building</h3>
							<p>Your dev environment is ready. Share your config with teammates so they can do the same.</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	</main>

	<footer>
		<div class="container">
			<div class="footer-content">
				<div class="footer-links">
					{#if $auth.user}
						<a href="/dashboard">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="3" width="7" height="7" />
								<rect x="14" y="3" width="7" height="7" />
								<rect x="14" y="14" width="7" height="7" />
								<rect x="3" y="14" width="7" height="7" />
							</svg>
							Dashboard
						</a>
					{:else}
						<a href="/login">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 20h9"/>
								<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
							</svg>
							Custom Configs
						</a>
					{/if}
					<a href="/docs">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
							<polyline points="14 2 14 8 20 8"/>
						</svg>
						Docs
					</a>
					<a href="https://github.com/openbootdotdev/openboot" target="_blank" rel="noopener">
						<svg viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
						GitHub
					</a>
					<a href="https://github.com/openbootdotdev/openboot/issues" target="_blank" rel="noopener">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<path d="M12 16v-4M12 8h.01"/>
						</svg>
						Issues
					</a>
				</div>
				<p class="footer-tagline">Open source, zero telemetry. Set up your Mac the way it should be.</p>
				<p class="footer-text">MIT License</p>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}

	.page-wrapper {
		position: relative;
		min-height: 100vh;
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%);
	}

	.page-wrapper::after {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		opacity: 0.03;
		mix-blend-mode: multiply;
		pointer-events: none;
		z-index: 1;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
		position: relative;
		z-index: 2;
	}

	main {
		padding-top: 80px;
		position: relative;
		z-index: 2;
	}

	.hero-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 900px;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.hero-glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
		opacity: 0.4;
	}

	.hero-glow-primary {
		width: 1000px;
		height: 1000px;
		background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
		top: -300px;
		left: 50%;
		transform: translateX(-50%);
		opacity: 0.2;
	}

	.hero-glow-secondary {
		width: 700px;
		height: 700px;
		background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
		top: 50px;
		right: -150px;
		opacity: 0.1;
	}

	.grid-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 100%;
		background-image: 
			linear-gradient(to right, var(--border) 1px, transparent 1px),
			linear-gradient(to bottom, var(--border) 1px, transparent 1px);
		background-size: 60px 60px;
		opacity: 0.3;
		mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 80%);
		-webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 80%);
	}

	.hero {
		padding: 80px 0 60px;
		display: grid;
		grid-template-columns: 1fr 1.5fr;
		gap: 50px;
		align-items: center;
		position: relative;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.hero-title {
		font-size: 3.5rem;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.04em;
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0;
	}

	.hero-subtitle {
		font-size: 1.15rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
		max-width: 520px;
	}

	.features-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 12px;
		color: var(--text-secondary);
		font-size: 0.95rem;
	}

	.feature-check {
		width: 18px;
		height: 18px;
		color: var(--accent);
		flex-shrink: 0;
	}

	.install-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.install-command-wrapper {
		position: relative;
	}

	.install-command-wrapper::before {
		content: '';
		position: absolute;
		inset: -2px;
		background: linear-gradient(90deg, var(--accent), #3b82f6, var(--accent));
		background-size: 200% 100%;
		border-radius: 14px;
		opacity: 0;
		transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		animation: borderRotate 4s linear infinite paused;
	}

	.install-command-wrapper:hover::before {
		opacity: 1;
		animation-play-state: running;
	}

	@keyframes borderRotate {
		0% {
			background-position: 0% 50%;
		}
		100% {
			background-position: 200% 50%;
		}
	}

	.install-command {
		position: relative;
		background: var(--code-bg);
		border: 1px solid var(--accent);
		border-radius: 12px;
		padding: 20px 24px;
		display: flex;
		align-items: center;
		gap: 16px;
		box-shadow: 
			0 0 15px var(--accent-glow) inset,
			0 0 40px var(--accent-glow),
			0 8px 32px rgba(0, 0, 0, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.install-command:hover {
		border-color: var(--accent-hover);
		box-shadow: 
			0 0 20px var(--accent-glow) inset,
			0 0 60px var(--accent-glow),
			0 12px 48px rgba(0, 0, 0, 0.15);
	}

	.install-prompt {
		color: var(--accent);
		font-family: 'JetBrains Mono', monospace;
		font-weight: 700;
		font-size: 1.25rem;
		flex-shrink: 0;
		user-select: none;
	}

	.install-command code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.95rem;
		color: var(--text-primary);
		flex: 1;
		min-width: 0;
	}

	.copy-btn {
		background: var(--accent);
		border: none;
		color: #000;
		padding: 10px 18px;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		box-shadow: 0 0 20px var(--accent-glow);
	}

	.copy-btn:hover {
		background: var(--accent-hover);
		transform: translateY(-2px) scale(1.02);
		box-shadow: 0 0 30px var(--accent-glow);
	}

	.install-alt {
		color: var(--text-muted);
		font-size: 0.85rem;
		margin: 0;
	}

	.install-alt code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.cta-buttons {
		display: flex;
		gap: 12px;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 24px;
		border-radius: 10px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		background: var(--accent);
		color: #000;
		border: none;
		box-shadow: 0 0 30px var(--accent-glow);
	}

	.btn-primary:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 0 40px var(--accent-glow);
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 24px;
		border-radius: 10px;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.btn-secondary:hover {
		color: var(--text-primary);
		border-color: var(--accent);
		background: var(--accent-glow);
		transform: translateY(-2px);
	}

	.star-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 3px 8px;
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

	.hero-visual {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.terminal-window {
		width: 100%;
		max-width: 700px;
		border-radius: 16px;
		overflow: hidden;
		background: #1e1e2e;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.1),
			0 20px 40px -12px rgba(0, 0, 0, 0.8),
			0 0 80px -20px rgba(34, 197, 94, 0.25),
			0 40px 100px rgba(0, 0, 0, 0.5);
		transform: perspective(1200px) rotateY(-3deg) rotateX(1deg);
		transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.terminal-window:hover {
		transform: perspective(1200px) rotateY(0deg) rotateX(0deg) translateY(-12px);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.15),
			0 30px 60px -15px rgba(0, 0, 0, 0.9),
			0 0 120px -10px rgba(34, 197, 94, 0.35),
			0 60px 120px rgba(0, 0, 0, 0.6);
	}

	.terminal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		background: linear-gradient(180deg, #1e1e2e 0%, #1a1a28 100%);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.terminal-dots {
		display: flex;
		gap: 8px;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.terminal-window:hover .dot {
		transform: scale(1.1);
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

	.terminal-spacer {
		width: 52px;
	}

	.terminal-body {
		background: #1e1e2e;
	}

	.terminal-body img {
		width: 100%;
		display: block;
	}

	.how-it-works {
		padding: 60px 0 120px;
		position: relative;
	}

	.how-it-works::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 800px;
		height: 400px;
		background: radial-gradient(ellipse, var(--accent-glow) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%);
		pointer-events: none;
		z-index: -1;
	}

	.section-header {
		text-align: center;
		margin-bottom: 64px;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 600;
		letter-spacing: -0.03em;
		color: var(--text-primary);
		margin: 0 0 12px 0;
	}

	.section-subtitle {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.steps-container {
		position: relative;
	}

	.steps-line {
		position: absolute;
		top: 40px;
		left: 12.5%;
		right: 12.5%;
		height: 2px;
		background: linear-gradient(90deg, 
			var(--accent) 0%, 
			var(--accent) 25%, 
			#3b82f6 50%, 
			var(--accent) 75%, 
			var(--accent) 100%
		);
		opacity: 0.3;
		z-index: 0;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 32px;
		position: relative;
		z-index: 1;
	}

	.step {
		text-align: center;
		padding: 32px 24px;
		background: var(--bg-secondary);
		border-radius: 20px;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		border: 1px solid var(--border);
		opacity: 0;
		transform: translateY(20px);
		animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.step-1 { animation-delay: 0.1s; }
	.step-2 { animation-delay: 0.2s; }
	.step-3 { animation-delay: 0.3s; }
	.step-4 { animation-delay: 0.4s; }

	@keyframes fadeInUp {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.step:hover {
		transform: translateY(-8px);
		background: var(--bg-tertiary);
		border-color: var(--accent);
		box-shadow: 
			0 0 40px var(--accent-glow),
			0 20px 40px rgba(0, 0, 0, 0.1);
	}

	.step-number {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--accent);
		color: #000;
		font-family: 'JetBrains Mono', monospace;
		font-weight: 700;
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 20px;
		box-shadow: 0 0 30px var(--accent-glow);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.step:hover .step-number {
		transform: scale(1.1);
		box-shadow: 0 0 50px var(--accent-glow);
	}

	.step h3 {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 12px 0;
		letter-spacing: -0.02em;
		color: var(--text-primary);
	}

	.step p {
		color: var(--text-secondary);
		font-size: 0.9rem;
		line-height: 1.6;
		margin: 0;
	}

	footer {
		border-top: 1px solid transparent;
		background: linear-gradient(to right, transparent, var(--accent), transparent) top / 100% 1px no-repeat,
					var(--bg-primary);
		padding: 64px 0;
		text-align: center;
		position: relative;
		z-index: 2;
	}

	.footer-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
		align-items: center;
	}

	.footer-links {
		display: flex;
		justify-content: center;
		gap: 32px;
		flex-wrap: wrap;
	}

	.footer-links a {
		color: var(--text-muted);
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
		position: relative;
	}

	.footer-links a:hover {
		color: var(--accent);
	}

	.footer-links a::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--accent);
		transform: scaleX(0);
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.footer-links a:hover::after {
		transform: scaleX(1);
	}

	.footer-links svg {
		width: 16px;
		height: 16px;
	}

	.footer-tagline {
		color: var(--text-secondary);
		font-size: 0.95rem;
		margin: 0;
		font-weight: 500;
	}

	.footer-text {
		color: var(--text-muted);
		font-size: 0.8rem;
		margin: 0;
	}

	@media (max-width: 960px) {
		.grid-overlay {
			display: none;
		}

		.hero {
			grid-template-columns: 1fr;
			gap: 60px;
			padding: 60px 0 100px;
		}

		.hero-visual {
			order: -1;
		}

		.hero-content {
			align-items: center;
			text-align: center;
		}

		.hero-title {
			font-size: 2.5rem;
		}

		.hero-subtitle {
			max-width: 100%;
		}

		.features-list {
			align-items: flex-start;
			max-width: 400px;
		}

		.install-section {
			width: 100%;
			max-width: 500px;
		}

		.cta-buttons {
			justify-content: center;
		}

		.steps-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 24px;
		}

		.steps-line {
			display: none;
		}
	}

	@media (max-width: 900px) {
		.cta-buttons {
			flex-direction: column;
			align-items: stretch;
		}

		.btn-primary,
		.btn-secondary {
			justify-content: center;
		}
	}

	@media (max-width: 640px) {
		.hero-title {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}

		.install-command {
			padding: 16px 18px;
			gap: 12px;
		}

		.install-command code {
			font-size: 0.8rem;
		}

		.install-prompt {
			font-size: 1rem;
		}

		.copy-btn {
			padding: 8px 14px;
			font-size: 0.8rem;
		}

		.steps-grid {
			grid-template-columns: 1fr;
		}

		.features-list {
			width: 100%;
		}

		.feature-item {
			font-size: 0.9rem;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
</style>
