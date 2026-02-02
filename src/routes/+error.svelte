<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
</script>

<svelte:head>
	<title>{$page.status} - OpenBoot</title>
</svelte:head>

<div class="error-page">
	<div class="error-content">
		<div class="error-code">{$page.status}</div>
		<h1 class="error-title">
			{#if $page.status === 404}
				Page Not Found
			{:else if $page.status === 500}
				Server Error
			{:else}
				Something Went Wrong
			{/if}
		</h1>
		<p class="error-message">
			{#if $page.error?.message}
				{$page.error.message}
			{:else if $page.status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else}
				An unexpected error occurred. Please try again later.
			{/if}
		</p>
		<div class="error-actions">
			<Button href="/" variant="primary">Go Home</Button>
			<Button href="javascript:history.back()" variant="secondary">Go Back</Button>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: var(--bg-primary);
	}

	.error-content {
		text-align: center;
		max-width: 500px;
	}

	.error-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 8rem;
		font-weight: 700;
		line-height: 1;
		color: var(--accent);
		opacity: 0.3;
		margin-bottom: -20px;
	}

	.error-title {
		font-size: 2rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 16px;
	}

	.error-message {
		color: var(--text-secondary);
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 32px;
	}

	.error-actions {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}

	@media (max-width: 480px) {
		.error-code {
			font-size: 5rem;
		}

		.error-title {
			font-size: 1.5rem;
		}
	}
</style>
