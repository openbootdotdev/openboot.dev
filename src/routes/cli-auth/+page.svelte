<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/auth';

	type PageState = 'loading' | 'no-code' | 'ready' | 'approving' | 'success' | 'error';

	let state = $state<PageState>('loading');
	let code = $state('');
	let errorMessage = $state('');

	onMount(async () => {
		const urlCode = $page.url.searchParams.get('code');

		if (!urlCode) {
			state = 'no-code';
			return;
		}

		code = urlCode;

		await auth.check();

		if (!$auth.user && !$auth.loading) {
			const returnTo = encodeURIComponent(`/cli-auth?code=${urlCode}`);
			window.location.href = `/api/auth/login?return_to=${returnTo}`;
			return;
		}

		state = 'ready';
	});

	async function handleApprove() {
		state = 'approving';

		try {
			const response = await fetch('/api/auth/cli/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ code })
			});

			if (response.ok) {
				state = 'success';
			} else {
				const data = await response.json().catch(() => ({ error: 'Unknown error' }));
				errorMessage = data.error || 'Code expired or invalid. Please try again from the CLI.';
				state = 'error';
			}
		} catch {
			errorMessage = 'Network error. Please check your connection and try again.';
			state = 'error';
		}
	}

	function handleCancel() {
		if (browser) {
			window.close();
		}
	}
</script>

<svelte:head>
	<title>Authorize CLI - OpenBoot</title>
</svelte:head>

<div class="page">
	<div class="card">
		<div class="wordmark">OpenBoot</div>

		{#if state === 'loading'}
			<div class="loading-state">
				<div class="spinner"></div>
				<p class="loading-text">Verifying session...</p>
			</div>

		{:else if state === 'no-code'}
			<div class="icon-block error-icon">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
					<line x1="15" y1="9" x2="9" y2="15" />
					<line x1="9" y1="9" x2="15" y2="15" />
				</svg>
			</div>
			<h1 class="heading">No Authorization Code</h1>
			<p class="subtext">No authorization code was provided. Please start the login flow from the CLI.</p>
			<div class="terminal-hint">
				<code>openboot login</code>
			</div>

		{:else if state === 'ready'}
			<div class="icon-block shield-icon">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				</svg>
			</div>
			<h1 class="heading">Authorize OpenBoot CLI</h1>
			<p class="subtext">The CLI is requesting access to your account</p>

			<div class="code-display">
				<span class="code-label">Authorization Code</span>
				<div class="code-value">{code}</div>
				<span class="code-hint">Verify this code matches what's shown in your terminal</span>
			</div>

			<button class="approve-btn" onclick={handleApprove}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12" />
				</svg>
				Approve
			</button>
			<button class="cancel-link" onclick={handleCancel}>Cancel</button>

		{:else if state === 'approving'}
			<div class="icon-block shield-icon">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				</svg>
			</div>
			<h1 class="heading">Authorizing...</h1>

			<div class="code-display">
				<span class="code-label">Authorization Code</span>
				<div class="code-value faded">{code}</div>
			</div>

			<button class="approve-btn" disabled>
				<div class="btn-spinner"></div>
				Approving...
			</button>

		{:else if state === 'success'}
			<div class="icon-block success-icon">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
			</div>
			<h1 class="heading">CLI Authorized!</h1>
			<p class="subtext success-text">You can close this tab and return to your terminal.</p>

		{:else if state === 'error'}
			<div class="icon-block error-icon">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			</div>
			<h1 class="heading">Authorization Failed</h1>
			<p class="subtext error-text">{errorMessage}</p>
			<div class="terminal-hint">
				<code>openboot login</code>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background:
			radial-gradient(ellipse at 50% 0%, var(--accent-glow) 0%, transparent 60%),
			var(--bg-primary);
	}

	.card {
		width: 100%;
		max-width: 420px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 40px 32px;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--accent), transparent);
		opacity: 0.6;
	}

	.wordmark {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--accent);
		margin-bottom: 32px;
		letter-spacing: -0.02em;
	}

	.icon-block {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 20px;
	}

	.shield-icon {
		background: var(--accent-glow);
		color: var(--accent);
	}

	.success-icon {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}

	.error-icon {
		background: rgba(239, 68, 68, 0.12);
		color: var(--danger);
	}

	.heading {
		font-size: 1.35rem;
		font-weight: 600;
		margin-bottom: 8px;
		color: var(--text-primary);
	}

	.subtext {
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 28px;
	}

	.success-text {
		color: var(--accent);
	}

	.error-text {
		color: var(--text-secondary);
		margin-bottom: 16px;
	}

	.code-display {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 28px;
	}

	.code-label {
		display: block;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 12px;
		font-weight: 500;
	}

	.code-value {
		font-family: 'JetBrains Mono', monospace;
		font-size: 2rem;
		font-weight: 600;
		color: var(--accent);
		letter-spacing: 0.15em;
		line-height: 1;
		margin-bottom: 12px;
		word-break: break-all;
	}

	.code-value.faded {
		opacity: 0.4;
	}

	.code-hint {
		display: block;
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	.approve-btn {
		width: 100%;
		padding: 14px 20px;
		background: var(--accent);
		color: #000;
		border: none;
		border-radius: 12px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-family: inherit;
	}

	.approve-btn:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	.approve-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.approve-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.cancel-link {
		display: inline-block;
		margin-top: 16px;
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.85rem;
		cursor: pointer;
		transition: color 0.2s;
		font-family: inherit;
	}

	.cancel-link:hover {
		color: var(--text-primary);
	}

	.terminal-hint {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px 16px;
		margin-top: 12px;
	}

	.terminal-hint code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		color: var(--accent);
	}

	/* Loading states */
	.loading-state {
		padding: 24px 0;
	}

	.loading-text {
		color: var(--text-muted);
		font-size: 0.9rem;
		margin-top: 16px;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		margin: 0 auto;
		animation: spin 0.8s linear infinite;
	}

	.btn-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: #000;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.card {
			padding: 32px 24px;
			border-radius: 16px;
		}

		.code-value {
			font-size: 1.5rem;
		}

		.heading {
			font-size: 1.2rem;
		}
	}
</style>
