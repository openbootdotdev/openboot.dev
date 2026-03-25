<script lang="ts">
	import { getCatalogItem } from '$lib/macos-prefs-catalog';

	let {
		prefsByCategory,
		prefCategoryNames
	}: {
		prefsByCategory: Record<string, { pref: any; catalogItem: ReturnType<typeof getCatalogItem> }[]>;
		prefCategoryNames: string[];
	} = $props();
</script>

<div class="prefs-accordion">
	{#each prefCategoryNames as cat}
		{@const items = prefsByCategory[cat]}
		<div class="prefs-acc-group">
			<div class="prefs-acc-header">
				<span class="prefs-acc-name">{cat}</span>
				<span class="prefs-acc-count">{items.length}</span>
			</div>
			<div class="prefs-acc-body">
				{#each items as { pref, catalogItem }}
					<div class="prefs-kv-row">
						<span class="prefs-kv-label">{catalogItem?.label ?? pref.key}</span>
						<span class="prefs-kv-value">
							{#if catalogItem?.options}
								{@const opt = catalogItem.options.find((o: { value: string; label: string }) => o.value === pref.value)}
								<span class="pref-option-val">{opt?.label ?? pref.value}</span>
							{:else if (catalogItem?.type ?? pref.type) === 'bool'}
								{@const boolOn = pref.value === 'true' || pref.value === '1'}
								<span class="pref-bool {boolOn ? 'pref-bool-on' : 'pref-bool-off'}">
									{boolOn ? 'ON' : 'OFF'}
								</span>
							{:else}
								<span class="pref-raw-val">{pref.value}</span>
							{/if}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.prefs-accordion {
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.prefs-acc-group {
		border-bottom: 1px solid var(--border);
	}

	.prefs-acc-group:last-child {
		border-bottom: none;
	}

	.prefs-acc-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: var(--bg-tertiary);
	}

	.prefs-acc-name {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		flex: 1;
	}

	.prefs-acc-count {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.prefs-acc-body {
		display: grid;
		grid-template-columns: 1fr;
	}

	@media (min-width: 640px) {
		.prefs-acc-body {
			grid-template-columns: 1fr 1fr;
		}
	}

	.prefs-kv-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 16px;
		border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
	}

	.prefs-kv-label {
		font-size: 0.88rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.prefs-kv-value {
		flex-shrink: 0;
	}

	.pref-bool {
		display: inline-block;
		padding: 3px 8px;
		border-radius: 5px;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.pref-bool-on {
		background: rgba(34, 197, 94, 0.15);
		color: var(--accent);
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.pref-bool-off {
		background: var(--bg-secondary);
		color: var(--text-muted);
		border: 1px solid var(--border);
	}

	.pref-option-val,
	.pref-raw-val {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--accent);
		background: var(--bg-secondary);
		padding: 3px 8px;
		border-radius: 5px;
		border: 1px solid var(--border);
	}
</style>
