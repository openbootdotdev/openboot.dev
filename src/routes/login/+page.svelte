<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	let error = $state<string | null>(null);
	let returnTo = $state('/dashboard');

	const errorMessages: Record<string, string> = {
		no_code: 'Authorization failed - no code received',
		token_failed: 'Failed to obtain access token',
		user_failed: 'Failed to retrieve user information',
		invalid_state: 'Invalid authentication state - please try again',
		unauthorized: 'You need to sign in to access this page'
	};

	$effect(() => {
		if (browser) {
			error = $page.url.searchParams.get('error');
			returnTo = $page.url.searchParams.get('return_to') || '/dashboard';
		}
	});

	function login(provider: 'github' | 'google') {
		if (!browser) return;
		const url = new URL('/api/auth/login', window.location.origin);
		url.searchParams.set('provider', provider);
		url.searchParams.set('return_to', returnTo);
		window.location.href = url.toString();
	}
</script>

<svelte:head>
	<title>Sign in - OpenBoot</title>
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<a href="/" class="logo">OpenBoot</a>
			<h1>Sign in to OpenBoot</h1>
			<p>Create and manage your dev environment configurations</p>
		</div>

		{#if error}
			<div class="error-banner">
				{errorMessages[error] || 'An error occurred during authentication'}
			</div>
		{/if}

		<div class="login-methods">
			<button class="login-btn github" onclick={() => login('github')}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
				</svg>
				Continue with GitHub
			</button>

			<button class="login-btn google" onclick={() => login('google')}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
				</svg>
				Continue with Google
			</button>
		</div>

		<p class="login-footer">
			By signing in, you agree to our <a href="/docs">terms of service</a>
		</p>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
	}

	.login-card {
		width: 100%;
		max-width: 420px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 40px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.login-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.logo {
		display: inline-block;
		font-family: 'JetBrains Mono', monospace;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--accent);
		margin-bottom: 24px;
		letter-spacing: -0.02em;
	}

	.login-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 8px;
		letter-spacing: -0.02em;
	}

	.login-header p {
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 24px;
		font-size: 0.875rem;
		text-align: center;
	}

	.login-methods {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.login-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 100%;
		padding: 14px 24px;
		border-radius: 10px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.login-btn:hover {
		border-color: var(--border-hover);
		background: var(--bg-tertiary);
		transform: translateY(-1px);
	}

	.login-btn:active {
		transform: translateY(0);
	}

	.login-btn svg {
		flex-shrink: 0;
	}

	.login-footer {
		text-align: center;
		margin-top: 24px;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.login-footer a {
		color: var(--accent);
		text-decoration: none;
	}

	.login-footer a:hover {
		text-decoration: underline;
	}
</style>
