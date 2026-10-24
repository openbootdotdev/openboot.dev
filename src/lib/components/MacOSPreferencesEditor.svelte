<script lang="ts">
	import {
		MACOS_PREF_CATALOG,
		CATALOG_CATEGORIES,
		getCatalogItem,
		type MacOSPrefCatalogItem
	} from '$lib/macos-prefs-catalog';

	interface MacOSPref {
		domain: string;
		key: string;
		type: string;
		value: string;
		desc: string;
		host?: string;
	}

	let { macosPrefs = $bindable() }: { macosPrefs: MacOSPref[] } = $props();

	function isOn(item: MacOSPrefCatalogItem): boolean {
		return macosPrefs.some((p) => p.domain === item.domain && p.key === item.key);
	}

	function toggle(item: MacOSPrefCatalogItem) {
		if (isOn(item)) {
			macosPrefs = macosPrefs.filter((p) => !(p.domain === item.domain && p.key === item.key));
		} else {
			macosPrefs = [
				...macosPrefs,
				{
					domain: item.domain,
					key: item.key,
					type: item.type,
					value: item.defaultValue,
					desc: item.label
				}
			];
		}
	}

	const byCategory = $derived(
		CATALOG_CATEGORIES.map((cat) => ({
			cat,
			items: MACOS_PREF_CATALOG.filter((i) => i.category === cat)
		}))
	);

	// Prefs present on the config that aren't in the catalog — show them so they can be removed.
	const customPrefs = $derived(macosPrefs.filter((p) => !getCatalogItem(p.domain, p.key)));

	function removeCustom(pref: MacOSPref) {
		macosPrefs = macosPrefs.filter((p) => !(p.domain === pref.domain && p.key === pref.key));
	}
</script>

<div class="prefs">
	<p class="prefs-hint">{macosPrefs.length} configured. Expand a category to manage settings.</p>
	{#each byCategory as group (group.cat)}
		<details class="group" name="macos-preference-category">
			<summary>
				<span class="group-label">{group.cat}</span>
				<span class="group-count">{group.items.filter(isOn).length} / {group.items.length} included</span>
				<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
			</summary>
			<div class="group-items">
				{#each group.items as item (item.id)}
					{@const on = isOn(item)}
					<div class="row">
						<div class="row-text">
							<div class="row-name">{item.label}</div>
							<div class="row-desc">{item.description}</div>
						</div>
						<button class="knob" class:on role="switch" aria-checked={on} aria-label={item.label} onclick={() => toggle(item)}>
							<span class="knob-dot"></span>
						</button>
					</div>
				{/each}
			</div>
		</details>
	{/each}

	{#if customPrefs.length > 0}
		<details class="group" name="macos-preference-category">
			<summary>
				<span class="group-label">Custom</span>
				<span class="group-count">{customPrefs.length} included</span>
				<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
			</summary>
			<div class="group-items">
				{#each customPrefs as pref (pref.domain + ':' + pref.key)}
					<div class="row">
						<div class="row-text">
							<div class="row-name">{pref.desc || pref.key}</div>
							<div class="row-desc">{pref.domain} {pref.key} = {pref.value}</div>
						</div>
						<button class="knob on" role="switch" aria-checked="true" aria-label="Remove {pref.key}" onclick={() => removeCustom(pref)}>
							<span class="knob-dot"></span>
						</button>
					</div>
				{/each}
			</div>
		</details>
	{/if}
</div>

<style>
	.prefs {
		display: flex;
		flex-direction: column;
	}

	.prefs-hint {
		font-size: 0.72rem;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0 0 10px;
	}

	.group {
		border-bottom: 1px solid var(--border);
	}

	summary {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 13px 4px;
		cursor: pointer;
		list-style: none;
		border-radius: 5px;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary:hover {
		background: var(--bg-tertiary);
	}

	summary:focus-visible,
	.knob:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.group-label {
		font-size: 0.8rem;
		color: var(--text-primary);
	}

	.group-count {
		margin-left: auto;
		font-size: 0.68rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.chevron {
		flex-shrink: 0;
		color: var(--text-muted);
	}

	.group[open] .chevron {
		transform: rotate(90deg);
	}

	.group-items {
		max-height: 340px;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-gutter: stable;
		padding: 0 4px 8px;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 4px;
		border-bottom: 1px solid var(--border);
	}

	.row-text {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.row-name {
		font-size: 0.86rem;
		color: var(--text-primary);
	}

	.row-desc {
		font-size: 0.72rem;
		color: var(--text-muted);
		margin-top: 2px;
		line-height: 1.4;
	}

	.knob {
		width: 34px;
		height: 20px;
		border-radius: 20px;
		position: relative;
		flex-shrink: 0;
		cursor: pointer;
		border: none;
		padding: 0;
		background: var(--border-hover);
		transition: background 0.18s ease;
	}

	.knob.on {
		background: var(--accent);
	}

	.knob-dot {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--bg-primary);
		transition: left 0.18s ease;
	}

	.knob.on .knob-dot {
		left: 16px;
	}
</style>
