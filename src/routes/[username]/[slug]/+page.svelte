<script lang="ts">
	import type { PageData } from './$types';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let activeTab = $state('overview');
	let copied = $state(false);
	let showShareModal = $state(false);
	let shareCopied = $state(false);
	let forking = $state(false);
	let forkError = $state('');

	function getInstallCommand() {
		return `curl -fsSL https://openboot.dev/${data.configUser.username}/${data.config.slug} | bash`;
	}

	function copyCommand() {
		navigator.clipboard.writeText(getInstallCommand());
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function getShareUrl() {
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

	function generateQrMatrix(input: string): boolean[][] {
		const EC_CODEWORDS: Record<number, number> = { 1: 7, 2: 10, 3: 15, 4: 20, 5: 26, 6: 36, 7: 40, 8: 48, 9: 60, 10: 72 };
		const TOTAL_CODEWORDS: Record<number, number> = { 1: 26, 2: 44, 3: 70, 4: 100, 5: 134, 6: 172, 7: 196, 8: 242, 9: 292, 10: 346 };
		const DATA_CAPACITY: Record<number, number> = {};
		for (let v = 1; v <= 10; v++) DATA_CAPACITY[v] = TOTAL_CODEWORDS[v] - EC_CODEWORDS[v];

		const bytes: number[] = [];
		for (let i = 0; i < input.length; i++) {
			const c = input.charCodeAt(i);
			if (c < 128) bytes.push(c);
			else if (c < 2048) { bytes.push(192 | (c >> 6)); bytes.push(128 | (c & 63)); }
			else { bytes.push(224 | (c >> 12)); bytes.push(128 | ((c >> 6) & 63)); bytes.push(128 | (c & 63)); }
		}

		let version = 1;
		for (let v = 1; v <= 10; v++) {
			const dataCap = DATA_CAPACITY[v];
			const bitCap = dataCap * 8;
			const needed = 4 + 8 + bytes.length * 8;
			if (needed <= bitCap) { version = v; break; }
			if (v === 10) version = 10;
		}

		const size = 17 + version * 4;
		const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
		const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

		function setModule(r: number, c: number, val: boolean, reserve = true) {
			if (r >= 0 && r < size && c >= 0 && c < size) {
				modules[r][c] = val;
				if (reserve) reserved[r][c] = true;
			}
		}

		function addFinderPattern(row: number, col: number) {
			for (let r = -1; r <= 7; r++) {
				for (let c = -1; c <= 7; c++) {
					const rr = row + r, cc = col + c;
					if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
					const inOuter = r === 0 || r === 6 || c === 0 || c === 6;
					const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
					const inSep = r === -1 || r === 7 || c === -1 || c === 7;
					setModule(rr, cc, (inOuter || inInner) && !inSep);
				}
			}
		}

		addFinderPattern(0, 0);
		addFinderPattern(0, size - 7);
		addFinderPattern(size - 7, 0);

		for (let i = 8; i < size - 8; i++) {
			setModule(6, i, i % 2 === 0);
			setModule(i, 6, i % 2 === 0);
		}

		setModule(size - 8, 8, true);

		if (version >= 2) {
			const alignPos = [6, size - 7];
			for (const ar of alignPos) {
				for (const ac of alignPos) {
					if (reserved[ar][ac]) continue;
					for (let r = -2; r <= 2; r++) {
						for (let c = -2; c <= 2; c++) {
							const val = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
							setModule(ar + r, ac + c, val);
						}
					}
				}
			}
		}

		for (let i = 0; i < 15; i++) {
			const r1 = i < 6 ? i : i < 8 ? i + 1 : size - 15 + i;
			const c1 = 8;
			reserved[r1][c1] = true;
			const r2 = 8;
			const c2 = i < 8 ? size - 1 - i : i < 9 ? 15 - i : 14 - i;
			reserved[r2][c2] = true;
		}

		const dataCap = DATA_CAPACITY[version];
		const bits: number[] = [];
		function pushBits(val: number, len: number) {
			for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
		}

		pushBits(0b0100, 4);
		pushBits(bytes.length, 8);
		for (const b of bytes) pushBits(b, 8);
		pushBits(0, Math.min(4, dataCap * 8 - bits.length));
		while (bits.length % 8 !== 0) bits.push(0);
		const pads = [0xEC, 0x11];
		let padIdx = 0;
		while (bits.length < dataCap * 8) {
			pushBits(pads[padIdx % 2], 8);
			padIdx++;
		}

		const dataCodewords: number[] = [];
		for (let i = 0; i < bits.length; i += 8) {
			let val = 0;
			for (let j = 0; j < 8; j++) val = (val << 1) | (bits[i + j] || 0);
			dataCodewords.push(val);
		}

		const numEc = EC_CODEWORDS[version];
		const gfExp: number[] = new Array(256);
		const gfLog: number[] = new Array(256);
		let x = 1;
		for (let i = 0; i < 255; i++) {
			gfExp[i] = x;
			gfLog[x] = i;
			x <<= 1;
			if (x >= 256) x ^= 0x11D;
		}
		gfExp[255] = gfExp[0];

		function gfMul(a: number, b: number): number {
			if (a === 0 || b === 0) return 0;
			return gfExp[(gfLog[a] + gfLog[b]) % 255];
		}

		const gen: number[] = [1];
		for (let i = 0; i < numEc; i++) {
			const newGen = new Array(gen.length + 1).fill(0);
			for (let j = 0; j < gen.length; j++) {
				newGen[j] ^= gfMul(gen[j], gfExp[i]);
				newGen[j + 1] ^= gen[j];
			}
			gen.length = 0;
			gen.push(...newGen);
		}

		const msgPoly = new Array(dataCodewords.length + numEc).fill(0);
		for (let i = 0; i < dataCodewords.length; i++) msgPoly[i] = dataCodewords[i];
		for (let i = 0; i < dataCodewords.length; i++) {
			const coef = msgPoly[i];
			if (coef !== 0) {
				for (let j = 0; j < gen.length; j++) {
					msgPoly[i + j] ^= gfMul(gen[j], coef);
				}
			}
		}
		const ecCodewords = msgPoly.slice(dataCodewords.length);

		const allCodewords = [...dataCodewords, ...ecCodewords];
		const allBits: number[] = [];
		for (const cw of allCodewords) {
			for (let i = 7; i >= 0; i--) allBits.push((cw >> i) & 1);
		}

		let bitIndex = 0;
		let upward = true;
		for (let col = size - 1; col >= 0; col -= 2) {
			if (col === 6) col = 5;
			const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
			for (const row of rows) {
				for (const dc of [0, -1]) {
					const cc = col + dc;
					if (cc < 0 || cc >= size) continue;
					if (reserved[row][cc]) continue;
					modules[row][cc] = bitIndex < allBits.length ? allBits[bitIndex] === 1 : false;
					bitIndex++;
				}
			}
			upward = !upward;
		}

		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (reserved[r][c]) continue;
				if ((r + c) % 2 === 0) modules[r][c] = !modules[r][c];
			}
		}

		const formatBits = (1 << 10) | (0 << 3);
		let rem = formatBits;
		for (let i = 0; i < 5; i++) {
			if (rem & (1 << (14 - i))) rem ^= 0x537 << (4 - i);
		}
		let formatInfo = (formatBits | rem) ^ 0x5412;

		for (let i = 0; i < 15; i++) {
			const bit = ((formatInfo >> (14 - i)) & 1) === 1;
			const r1 = i < 6 ? i : i < 8 ? i + 1 : size - 15 + i;
			modules[r1][8] = bit;
			const c2 = i < 8 ? size - 1 - i : i < 9 ? 15 - i : 14 - i;
			modules[8][c2] = bit;
		}

		return modules;
	}

	function qrToSvg(url: string, cellSize = 8, margin = 16): string {
		const matrix = generateQrMatrix(url);
		const qrSize = matrix.length;
		const svgSize = qrSize * cellSize + margin * 2;

		let rects = '';
		for (let r = 0; r < qrSize; r++) {
			for (let c = 0; c < qrSize; c++) {
				if (matrix[r][c]) {
					rects += `<rect x="${margin + c * cellSize}" y="${margin + r * cellSize}" width="${cellSize}" height="${cellSize}" rx="1.5"/>`;
				}
			}
		}

		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
<rect width="${svgSize}" height="${svgSize}" fill="#ffffff" rx="12"/>
${rects}
</svg>`;
	}

	function downloadQrPng() {
		const svg = qrToSvg(getShareUrl(), 10, 20);
		const blob = new Blob([svg], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width * 2;
			canvas.height = img.height * 2;
			const ctx = canvas.getContext('2d')!;
			ctx.scale(2, 2);
			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(url);
			canvas.toBlob((pngBlob) => {
				if (!pngBlob) return;
				const a = document.createElement('a');
				a.href = URL.createObjectURL(pngBlob);
				a.download = `${data.config.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
				a.click();
				URL.revokeObjectURL(a.href);
			}, 'image/png');
		};
		img.src = url;
	}

	async function forkConfig() {
		forking = true;
		forkError = '';

		try {
			const authCheck = await fetch('/api/user');
			if (!authCheck.ok) {
				window.location.href = '/api/auth/login';
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
					is_public: true,
					custom_script: data.config.custom_script || '',
					dotfiles_repo: data.config.dotfiles_repo || ''
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

	const snapshot = data.config.snapshot || {};
	const snapshotPkgs = snapshot.packages || {};
	const macosPrefs = snapshot.macos_prefs || [];
	const shell = snapshot.shell || {};
	const git = snapshot.git || {};
	const devTools = snapshot.dev_tools || [];

	const configPkgs: { name: string; type: string }[] = Array.isArray(data.config.packages)
		? data.config.packages.map((p: any) => (typeof p === 'string' ? { name: p, type: 'formula' } : p))
		: [];

	const configCli = configPkgs.filter((p: any) => p.type !== 'cask' && p.type !== 'npm');
	const configApps = configPkgs.filter((p: any) => p.type === 'cask');
	const configNpm = configPkgs.filter((p: any) => p.type === 'npm');

	const formulae = snapshotPkgs.formulae?.length ? snapshotPkgs.formulae : configCli.map((p: any) => p.name);
	const casks = snapshotPkgs.casks?.length ? snapshotPkgs.casks : configApps.map((p: any) => p.name);
	const taps = snapshotPkgs.taps || [];
	const hasSnapshot = !!(snapshotPkgs.formulae?.length || snapshotPkgs.casks?.length);

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'formulae', label: 'CLI' },
		{ id: 'casks', label: 'Apps' },
		...(configNpm.length > 0 ? [{ id: 'npm', label: 'NPM' }] : []),
		...(macosPrefs.length > 0 ? [{ id: 'macos', label: 'macOS' }] : []),
		...(shell.default || shell.oh_my_zsh ? [{ id: 'shell', label: 'Shell' }] : [])
	];
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

<header class="header">
	<a href="/" class="logo">OpenBoot</a>
	<div class="header-right">
		<button class="share-btn" onclick={openShareModal}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
			Share
		</button>
		<ThemeToggle />
	</div>
</header>

<main class="container">
	<section class="hero">
		<div class="config-meta">
			<span class="author">@{data.configUser.username}</span>
			<span class="separator">/</span>
			<span class="config-slug">{data.config.slug}</span>
		</div>
		<h1 class="config-name">{data.config.name}</h1>
		{#if data.config.description}
			<p class="config-description">{data.config.description}</p>
		{/if}

		<div class="install-box">
			<div class="install-label">Install with one command</div>
			<div class="install-command">
				<code>{getInstallCommand()}</code>
				<button class="copy-btn" onclick={copyCommand}>
					{copied ? 'Copied!' : 'Copy'}
				</button>
			</div>
			<button class="fork-btn" onclick={forkConfig} disabled={forking}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>
				{forking ? 'Forking...' : 'Fork Config'}
			</button>
			{#if forkError}
				<div class="fork-error">{forkError}</div>
			{/if}
		</div>

		<div class="stats">
			<div class="stat">
				<span class="stat-value">{formulae.length}</span>
				<span class="stat-label">CLI</span>
			</div>
			<div class="stat">
				<span class="stat-value">{casks.length}</span>
				<span class="stat-label">Apps</span>
			</div>
			{#if configNpm.length > 0}
				<div class="stat">
					<span class="stat-value">{configNpm.length}</span>
					<span class="stat-label">NPM</span>
				</div>
			{/if}
			{#if devTools.length > 0}
				<div class="stat">
					<span class="stat-value">{devTools.length}</span>
					<span class="stat-label">Dev Tools</span>
				</div>
			{/if}
			{#if macosPrefs.length > 0}
				<div class="stat">
					<span class="stat-value">{macosPrefs.length}</span>
					<span class="stat-label">Preferences</span>
				</div>
			{/if}
			<div class="stat">
				<span class="stat-value">{data.config.install_count || 0}</span>
				<span class="stat-label">Installs</span>
			</div>
		</div>
	</section>

	<nav class="tabs">
		{#each tabs as tab}
			<button
				class="tab"
				class:active={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
				{#if tab.id === 'formulae' && formulae.length > 0}
					<span class="tab-count">{formulae.length}</span>
				{:else if tab.id === 'casks' && casks.length > 0}
					<span class="tab-count">{casks.length}</span>
				{:else if tab.id === 'npm' && configNpm.length > 0}
					<span class="tab-count">{configNpm.length}</span>
				{:else if tab.id === 'macos' && macosPrefs.length > 0}
					<span class="tab-count">{macosPrefs.length}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<section class="tab-content">
		{#if activeTab === 'overview'}
			<div class="overview">
				<div class="overview-categories">
					{#if formulae.length > 0}
						<div class="category-card">
							<div class="category-header">
								<span class="category-icon">⌘</span>
								<div>
									<h3 class="category-title">CLI Tools</h3>
									<span class="category-count">{formulae.length} packages</span>
								</div>
							</div>
							<div class="category-items">
								{#each formulae.slice(0, 6) as pkg}
									<a href={getPackageUrl(pkg, 'formula')} target="_blank" rel="noopener noreferrer" class="category-item">
										<span class="item-name">{pkg}</span>
										{#if data.packageDescriptions[pkg]}
											<span class="item-desc">{data.packageDescriptions[pkg]}</span>
										{/if}
									</a>
								{/each}
							</div>
							{#if formulae.length > 6}
								<button class="see-all" onclick={() => activeTab = 'formulae'}>See all {formulae.length} →</button>
							{/if}
						</div>
					{/if}

					{#if casks.length > 0}
						<div class="category-card">
							<div class="category-header">
								<span class="category-icon">🖥</span>
								<div>
									<h3 class="category-title">Applications</h3>
									<span class="category-count">{casks.length} apps</span>
								</div>
							</div>
							<div class="category-items">
								{#each casks.slice(0, 6) as pkg}
									<a href={getPackageUrl(pkg, 'cask')} target="_blank" rel="noopener noreferrer" class="category-item">
										<span class="item-name">{pkg}</span>
										{#if data.packageDescriptions[pkg]}
											<span class="item-desc">{data.packageDescriptions[pkg]}</span>
										{/if}
									</a>
								{/each}
							</div>
							{#if casks.length > 6}
								<button class="see-all" onclick={() => activeTab = 'casks'}>See all {casks.length} →</button>
							{/if}
						</div>
					{/if}

					{#if configNpm.length > 0}
						<div class="category-card">
							<div class="category-header">
								<span class="category-icon">📦</span>
								<div>
									<h3 class="category-title">NPM Global</h3>
									<span class="category-count">{configNpm.length} packages</span>
								</div>
							</div>
							<div class="category-items">
								{#each configNpm.slice(0, 6) as pkg}
									<a href={getPackageUrl(pkg.name, 'npm')} target="_blank" rel="noopener noreferrer" class="category-item">
										<span class="item-name">{pkg.name}</span>
										{#if data.packageDescriptions[pkg.name]}
											<span class="item-desc">{data.packageDescriptions[pkg.name]}</span>
										{/if}
									</a>
								{/each}
							</div>
							{#if configNpm.length > 6}
								<button class="see-all" onclick={() => activeTab = 'npm'}>See all {configNpm.length} →</button>
							{/if}
						</div>
					{/if}
				</div>

				<div class="overview-info">
					<div class="info-card">
						<h4 class="info-card-title">Preset</h4>
						<span class="info-card-value">{data.config.base_preset}</span>
						<p class="info-card-desc">Base configuration template</p>
					</div>

					{#if data.config.dotfiles_repo}
						<div class="info-card">
							<h4 class="info-card-title">Dotfiles</h4>
							<a href={data.config.dotfiles_repo} target="_blank" rel="noopener noreferrer" class="info-card-link">{data.config.dotfiles_repo.replace('https://github.com/', '')}</a>
							<p class="info-card-desc">Deployed via GNU Stow</p>
						</div>
					{/if}

					{#if shell.default || shell.oh_my_zsh}
						<div class="info-card">
							<h4 class="info-card-title">Shell</h4>
							<span class="info-card-value">{shell.default || 'zsh'}{shell.oh_my_zsh ? ' + Oh My Zsh' : ''}</span>
							{#if shell.theme}
								<p class="info-card-desc">Theme: {shell.theme}</p>
							{/if}
							{#if shell.plugins && shell.plugins.length > 0}
								<div class="info-card-tags">
									{#each shell.plugins.slice(0, 5) as plugin}
										<span class="mini-tag">{plugin}</span>
									{/each}
									{#if shell.plugins.length > 5}
										<span class="mini-tag muted">+{shell.plugins.length - 5}</span>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

		{:else if activeTab === 'formulae'}
			{#if formulae.length === 0}
				<div class="empty-state">No CLI packages configured.</div>
			{:else}
				<div class="package-grid">
					{#each formulae as pkg}
						<a href={getPackageUrl(pkg, 'formula')} target="_blank" rel="noopener noreferrer" class="package-item" data-tooltip={data.packageDescriptions[pkg] || ''}>{pkg}</a>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'casks'}
			{#if casks.length === 0}
				<div class="empty-state">No apps configured.</div>
			{:else}
				<div class="package-grid">
					{#each casks as pkg}
						<a href={getPackageUrl(pkg, 'cask')} target="_blank" rel="noopener noreferrer" class="package-item" data-tooltip={data.packageDescriptions[pkg] || ''}>{pkg}</a>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'npm'}
			{#if configNpm.length === 0}
				<div class="empty-state">No npm packages configured.</div>
			{:else}
				<div class="package-grid">
					{#each configNpm as pkg}
						<a href={getPackageUrl(pkg.name, 'npm')} target="_blank" rel="noopener noreferrer" class="package-item" data-tooltip={data.packageDescriptions[pkg.name] || ''}>{pkg.name}</a>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'macos'}
			{#if macosPrefs.length === 0}
				<div class="empty-state">No macOS preferences in this snapshot.</div>
			{:else}
				<div class="prefs-list">
					{#each macosPrefs as pref}
						<div class="pref-item">
							<div class="pref-header">
								<span class="pref-key">{pref.key}</span>
								<span class="pref-domain">{pref.domain}</span>
							</div>
							{#if pref.desc}
								<p class="pref-desc">{pref.desc}</p>
							{/if}
							<code class="pref-value">{pref.value}</code>
						</div>
					{/each}
				</div>
			{/if}

		{:else if activeTab === 'shell'}
			<div class="shell-detail">
				{#if !shell.default && !shell.oh_my_zsh}
					<div class="empty-state">No shell configuration in this snapshot.</div>
				{:else}
					<div class="overview-card wide">
						<h3 class="card-title">Shell Configuration</h3>
						<div class="shell-info">
							{#if shell.default}
								<div class="info-row">
									<span class="info-label">Default Shell</span>
									<span class="info-value mono">{shell.default}</span>
								</div>
							{/if}
							{#if shell.oh_my_zsh}
								<div class="info-row">
									<span class="info-label">Oh My Zsh</span>
									<span class="info-value badge">Installed</span>
								</div>
							{/if}
							{#if shell.theme}
								<div class="info-row">
									<span class="info-label">Theme</span>
									<span class="info-value mono">{shell.theme}</span>
								</div>
							{/if}
						</div>
						{#if shell.plugins && shell.plugins.length > 0}
							<h4 class="sub-title">Plugins ({shell.plugins.length})</h4>
							<div class="plugin-grid">
								{#each shell.plugins as plugin}
									<span class="plugin-tag">{plugin}</span>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</section>
</main>

{#if showShareModal}
	<div class="share-overlay" onclick={closeShareModal} role="dialog" tabindex="-1">
		<div class="share-modal" onclick={(e) => e.stopPropagation()}>
			<div class="share-modal-header">
				<h3 class="share-modal-title">Share Configuration</h3>
				<button class="share-close-btn" onclick={closeShareModal}>&times;</button>
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

					<div class="share-qr-section">
						<div class="share-qr-header">
							<span class="share-option-icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="17"/><line x1="14" y1="21" x2="17" y2="21"/></svg>
							</span>
							<span class="share-qr-title">QR Code</span>
						</div>
						<div class="share-qr-code">
							{@html qrToSvg(getShareUrl())}
						</div>
						<button class="share-qr-download" onclick={downloadQrPng}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
							Download PNG
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && showShareModal) closeShareModal(); }} />

<style>
	.header {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		padding: 16px 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--accent);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 40px 24px;
	}

	.hero {
		text-align: center;
		margin-bottom: 40px;
	}

	.config-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		font-size: 0.9rem;
		color: var(--text-muted);
		margin-bottom: 8px;
	}

	.author {
		color: var(--accent);
	}

	.separator {
		color: var(--text-muted);
	}

	.config-slug {
		font-family: 'JetBrains Mono', monospace;
	}

	.config-name {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 8px;
	}

	.config-description {
		color: var(--text-secondary);
		font-size: 1.1rem;
		margin-bottom: 24px;
	}

	.install-box {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 24px;
	}

	.install-label {
		font-size: 0.8rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 12px;
	}

	.install-command {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px 16px;
	}

	.install-command code {
		flex: 1;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--accent);
		word-break: break-all;
	}

	.copy-btn {
		background: var(--accent);
		color: #000;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.copy-btn:hover {
		background: var(--accent-hover);
	}

	.fork-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		margin-top: 12px;
		padding: 10px 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.fork-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--bg-secondary);
	}

	.fork-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.fork-error {
		margin-top: 8px;
		padding: 8px 12px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 6px;
		color: #ef4444;
		font-size: 0.85rem;
		text-align: center;
	}

	.stats {
		display: flex;
		justify-content: center;
		gap: 32px;
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent);
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.tabs {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 24px;
		overflow-x: auto;
	}

	.tab {
		background: none;
		border: none;
		padding: 12px 16px;
		font-size: 0.9rem;
		color: var(--text-secondary);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text-primary);
	}

	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	.tab-count {
		background: var(--bg-tertiary);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.tab.active .tab-count {
		background: var(--accent);
		color: #000;
	}

	.tab-content {
		min-height: 300px;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
	}

	.overview-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
	}

	.overview-card.wide {
		grid-column: 1 / -1;
	}

	.card-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 16px;
		color: var(--text-primary);
	}

	.sub-title {
		font-size: 0.9rem;
		font-weight: 500;
		margin-top: 20px;
		margin-bottom: 12px;
		color: var(--text-secondary);
	}

	.tool-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tool-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: var(--bg-tertiary);
		border-radius: 6px;
	}

	.tool-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
	}

	.tool-version {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.shell-info {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.info-row.plugins {
		flex-direction: column;
		gap: 8px;
	}

	.info-label {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.info-value {
		font-size: 0.85rem;
		color: var(--text-primary);
	}

	.info-value.mono {
		font-family: 'JetBrains Mono', monospace;
	}

	.info-value.badge {
		background: var(--accent);
		color: #000;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.plugin-tags, .plugin-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.plugin-tag {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 4px 10px;
		border-radius: 4px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
	}

	.tap-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.tap-item {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.package-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 8px;
	}

	.package-item {
		display: block;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 10px 14px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-primary);
		text-decoration: none;
		transition: border-color 0.2s, background 0.2s;
	}

	.package-item:hover {
		border-color: var(--accent);
		background: var(--bg-tertiary);
	}

	.package-item {
		position: relative;
	}

	.package-item[data-tooltip]:not([data-tooltip=""])::after {
		content: attr(data-tooltip);
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 6px 10px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-family: 'Outfit', sans-serif;
		white-space: nowrap;
		max-width: 280px;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s;
		z-index: 10;
	}

	.package-item[data-tooltip]:not([data-tooltip=""]):hover::after {
		opacity: 1;
	}

	.overview {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.overview-categories {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
	}

	.category-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.category-icon {
		font-size: 1.5rem;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border-radius: 10px;
	}

	.category-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.category-count {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.category-items {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.category-item {
		display: flex;
		flex-direction: column;
		padding: 8px 10px;
		border-radius: 6px;
		transition: background 0.15s;
		text-decoration: none;
		color: inherit;
	}

	.category-item:hover {
		background: var(--bg-tertiary);
	}

	.item-name {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--text-primary);
	}

	.item-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.see-all {
		display: block;
		width: 100%;
		background: none;
		border: none;
		padding: 10px;
		margin-top: 8px;
		color: var(--accent);
		font-size: 0.8rem;
		cursor: pointer;
		text-align: center;
		border-radius: 6px;
		transition: background 0.15s;
	}

	.see-all:hover {
		background: var(--bg-tertiary);
	}

	.overview-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	.info-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 16px;
	}

	.info-card-title {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 6px;
	}

	.info-card-value {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		display: block;
	}

	.info-card-link {
		font-size: 0.85rem;
		color: var(--accent);
		text-decoration: none;
		word-break: break-all;
	}

	.info-card-link:hover {
		text-decoration: underline;
	}

	.info-card-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.info-card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 8px;
	}

	.mini-tag {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		padding: 2px 8px;
		border-radius: 4px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
	}

	.mini-tag.muted {
		color: var(--text-muted);
	}

	.prefs-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.pref-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 16px;
	}

	.pref-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.pref-key {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.pref-domain {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.pref-desc {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.pref-value {
		display: block;
		background: var(--bg-tertiary);
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 0.8rem;
		color: var(--accent);
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: var(--text-muted);
	}

	.shell-detail {
		max-width: 600px;
	}

	.share-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-family: inherit;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.share-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.share-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 20px;
	}

	.share-modal {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		width: 100%;
		max-width: 420px;
		overflow-y: auto;
	}

	.share-modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.share-modal-title {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.share-close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px 8px;
	}

	.share-close-btn:hover {
		color: var(--text-primary);
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
		border-radius: 8px;
		padding: 12px 16px;
	}

	.share-url-display code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--accent);
		word-break: break-all;
	}

	.share-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.share-option {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.share-option:hover {
		border-color: var(--accent);
		background: var(--bg-secondary);
	}

	.share-option-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--bg-secondary);
		border-radius: 8px;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.share-option:hover .share-option-icon {
		color: var(--accent);
	}

	.share-option-label {
		font-weight: 500;
	}

	.share-qr-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 10px;
	}

	.share-qr-header {
		display: flex;
		align-items: center;
		gap: 12px;
		align-self: flex-start;
	}

	.share-qr-title {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.share-qr-code {
		background: #ffffff;
		border-radius: 12px;
		padding: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.share-qr-code :global(svg) {
		width: 180px;
		height: 180px;
	}

	.share-qr-download {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}

	.share-qr-download:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	@media (max-width: 600px) {
		.config-name {
			font-size: 1.5rem;
		}

		.stats {
			gap: 20px;
		}

		.install-command {
			flex-direction: column;
			align-items: stretch;
		}

		.install-command code {
			text-align: center;
			margin-bottom: 8px;
		}

		.package-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
