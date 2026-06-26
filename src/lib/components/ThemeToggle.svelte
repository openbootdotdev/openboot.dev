<script lang="ts">
	import { theme } from '$lib/stores/theme';
</script>

<button class="theme-toggle" onclick={() => theme.toggle()} title="Toggle theme">
	{#if $theme === 'dark'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="5" />
			<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		background: none;
		border: 1px solid var(--border);
		cursor: pointer;
		width: 30px;
		height: 30px;
		border-radius: 7px;
		color: var(--text-secondary);
		transition:
			color 0.2s,
			border-color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.theme-toggle:hover {
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.theme-toggle svg {
		width: 15px;
		height: 15px;
	}
</style>
