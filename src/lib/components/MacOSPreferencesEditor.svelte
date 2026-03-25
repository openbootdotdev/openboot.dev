<script lang="ts">
	import { CATALOG_CATEGORIES, getCatalogItem, type MacOSPrefCatalogItem } from '$lib/macos-prefs-catalog';

	interface MacOSPref {
		domain: string;
		key: string;
		type: string;
		value: string;
		desc: string;
	}

	let {
		macosPrefs = $bindable([]),
		expandedPrefCats = $bindable(new Set<string>()),
		catalogByCategory,
		addedCountByCategory,
		customPrefs,
	}: {
		macosPrefs: MacOSPref[];
		expandedPrefCats: Set<string>;
		catalogByCategory: Record<string, MacOSPrefCatalogItem[]>;
		addedCountByCategory: Record<string, number>;
		customPrefs: { pref: MacOSPref; index: number }[];
	} = $props();

	let showCustomPref = $state(false);
	let prefInput = $state('');
	let prefTypeInput = $state('');
	let prefInputError = $state('');

	function togglePrefCat(cat: string) {
		const next = new Set(expandedPrefCats);
		if (next.has(cat)) next.delete(cat);
		else next.add(cat);
		expandedPrefCats = next;
	}

	function getAddedPrefIndex(item: MacOSPrefCatalogItem): number {
		return macosPrefs.findIndex((p) => p.domain === item.domain && p.key === item.key);
	}

	function isPrefAdded(item: MacOSPrefCatalogItem): boolean {
		return macosPrefs.some((p) => p.domain === item.domain && p.key === item.key);
	}

	function addPrefFromCatalog(item: MacOSPrefCatalogItem) {
		if (isPrefAdded(item)) {
			macosPrefs = macosPrefs.filter(
				(p) => !(p.domain === item.domain && p.key === item.key)
			);
		} else {
			macosPrefs = [
				...macosPrefs,
				{
					domain: item.domain,
					key: item.key,
					type: item.type,
					value: item.defaultValue,
					desc: item.description,
				},
			];
		}
	}

	function updatePrefValue(index: number, newValue: string) {
		macosPrefs = macosPrefs.map((p, i) => (i === index ? { ...p, value: newValue } : p));
	}

	function removePref(index: number) {
		macosPrefs = macosPrefs.filter((_, i) => i !== index);
	}

	function addPref() {
		const raw = prefInput.trim();
		const eqIdx = raw.indexOf('=');
		if (eqIdx <= 0) {
			prefInputError = 'Format: domain.key=value';
			return;
		}
		const domainKey = raw.slice(0, eqIdx);
		const value = raw.slice(eqIdx + 1);
		if (!domainKey.includes('.') || !value) {
			prefInputError = 'Format: domain.key=value';
			return;
		}
		if (macosPrefs.some((p) => `${p.domain}.${p.key}` === domainKey)) {
			prefInputError = 'Already added';
			return;
		}
		const dotIdx = domainKey.lastIndexOf('.');
		macosPrefs = [
			...macosPrefs,
			{
				domain: domainKey.slice(0, dotIdx),
				key: domainKey.slice(dotIdx + 1),
				type: prefTypeInput,
				value,
				desc: '',
			},
		];
		prefInput = '';
		prefTypeInput = '';
		prefInputError = '';
	}
</script>

<div class="system-prefs">
		<div class="prefs-top">
			<span class="prefs-title">macOS Preferences</span>
			{#if macosPrefs.length > 0}
				<span class="prefs-count">{macosPrefs.length} configured</span>
			{/if}
		</div>

		<!-- Accordion groups by category -->
		<div class="pref-accordion">
			{#each CATALOG_CATEGORIES as cat}
				{@const items = catalogByCategory[cat]}
				{@const count = addedCountByCategory[cat] || 0}
				{@const total = items.length}
				{@const expanded = expandedPrefCats.has(cat)}
				<div class="pref-acc-group" class:pref-acc-has-items={count > 0}>
					<button class="pref-acc-header" onclick={() => togglePrefCat(cat)}>
						<svg class="pref-acc-chevron" class:pref-acc-chevron-open={expanded} width="12" height="12" viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						<span class="pref-acc-name">{cat}</span>
						{#if count > 0}
							<span class="pref-acc-badge">{count}/{total}</span>
						{:else}
							<span class="pref-acc-total">{total}</span>
						{/if}
					</button>
					{#if expanded}
						<div class="pref-acc-body">
							{#each items as item}
								{@const added = isPrefAdded(item)}
								{@const prefIdx = getAddedPrefIndex(item)}
								<div class="pref-row" class:pref-row-active={added}>
									<button
										class="pref-toggle-btn"
										onclick={() => addPrefFromCatalog(item)}
									>
										<span class="pref-check" class:pref-check-on={added}>{added ? '✓' : ''}</span>
									</button>
									<div class="pref-info">
										<span class="pref-label">{item.label}</span>
										<span class="pref-meta">{item.description}</span>
									</div>
									{#if added && prefIdx >= 0}
										<div class="pref-control">
											{#if item.options}
												<select
													class="pref-sel"
													value={macosPrefs[prefIdx].value}
													onchange={(e) => updatePrefValue(prefIdx, e.currentTarget.value)}
												>
													{#each item.options as opt}
														<option value={opt.value}>{opt.label}</option>
													{/each}
												</select>
											{:else if item.type === 'bool'}
												<button
													class="pref-bool"
													class:on={macosPrefs[prefIdx].value === 'true'}
													onclick={() => updatePrefValue(prefIdx, macosPrefs[prefIdx].value === 'true' ? 'false' : 'true')}
												>
													{macosPrefs[prefIdx].value === 'true' ? 'ON' : 'OFF'}
												</button>
											{:else}
												<input
													type={(item.type === 'int' || item.type === 'float') ? 'number' : 'text'}
													class="pref-val"
													value={macosPrefs[prefIdx].value}
													min={item.min}
													max={item.max}
													oninput={(e) => updatePrefValue(prefIdx, e.currentTarget.value)}
												/>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Custom prefs not in catalog -->
		{#if customPrefs.length > 0}
			<div class="pref-acc-group pref-acc-has-items">
				<div class="pref-acc-header pref-acc-header-static">
					<span class="pref-acc-name">Custom</span>
					<span class="pref-acc-badge">{customPrefs.length}</span>
				</div>
				<div class="pref-acc-body">
					{#each customPrefs as { pref, index }}
						<div class="pref-row pref-row-active">
							<button class="pref-toggle-btn" onclick={() => removePref(index)}>
								<span class="pref-check pref-check-on">✓</span>
							</button>
							<div class="pref-info">
								<span class="pref-label">{pref.domain}.{pref.key}</span>
								{#if pref.desc}
									<span class="pref-meta">{pref.desc}</span>
								{/if}
							</div>
							<div class="pref-control">
								<input
									type="text"
									class="pref-val"
									value={pref.value}
									oninput={(e) => updatePrefValue(index, e.currentTarget.value)}
								/>
							</div>
							<button class="pref-rm" onclick={() => removePref(index)}>&times;</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<button
			class="custom-pref-toggle"
			onclick={() => (showCustomPref = !showCustomPref)}
		>
			{showCustomPref ? '− Hide' : '+ Custom defaults key'}
		</button>
		{#if showCustomPref}
			<div class="custom-pref-row">
				<input
					type="text"
					class="custom-pref-input"
					bind:value={prefInput}
					placeholder="com.apple.dock.tilesize=48"
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addPref())}
				/>
				<select class="custom-pref-type" bind:value={prefTypeInput}>
					<option value="">auto</option>
					<option value="string">string</option>
					<option value="int">int</option>
					<option value="bool">bool</option>
					<option value="float">float</option>
				</select>
				<button class="custom-pref-add" onclick={addPref}>Add</button>
			</div>
			{#if prefInputError}
				<p class="pref-error">{prefInputError}</p>
			{:else}
				<p class="pref-hint">Format: domain.key=value</p>
			{/if}
		{/if}
	</div>

<style>
	.system-prefs {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.prefs-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.prefs-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.prefs-count {
		font-size: 0.78rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	/* Accordion */
	.pref-accordion {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.pref-acc-group {
		border-bottom: 1px solid var(--border);
	}

	.pref-acc-group:last-child {
		border-bottom: none;
	}

	.pref-acc-header {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px 14px;
		background: var(--bg-tertiary);
		border: none;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}

	.pref-acc-header:hover {
		background: var(--bg-secondary);
	}

	.pref-acc-header-static {
		cursor: default;
	}

	.pref-acc-header-static:hover {
		background: var(--bg-tertiary);
	}

	.pref-acc-chevron {
		color: var(--text-muted);
		transition: transform 0.15s;
		flex-shrink: 0;
	}

	.pref-acc-chevron-open {
		transform: rotate(90deg);
	}

	.pref-acc-name {
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
	}

	.pref-acc-badge {
		padding: 2px 7px;
		background: var(--accent);
		border-radius: 8px;
		font-size: 0.65rem;
		font-weight: 700;
		color: #000;
		line-height: 1.3;
	}

	.pref-acc-total {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.pref-acc-body {
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	/* Pref rows */
	.pref-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 14px;
		border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
		transition: background 0.1s;
	}

	.pref-row-active {
		background: color-mix(in srgb, var(--accent) 4%, transparent);
	}

	.pref-toggle-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		flex-shrink: 0;
	}

	.pref-check {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px solid var(--border);
		border-radius: 4px;
		font-size: 0.65rem;
		font-weight: 700;
		color: transparent;
		background: var(--bg-secondary);
		transition: all 0.15s;
	}

	.pref-check-on {
		background: var(--accent);
		border-color: var(--accent);
		color: #000;
	}

	.pref-info {
		flex: 1;
		min-width: 0;
	}

	.pref-label {
		font-size: 0.84rem;
		font-weight: 500;
		color: var(--text-primary);
		display: block;
	}

	.pref-meta {
		font-size: 0.7rem;
		color: var(--text-muted);
		display: block;
		line-height: 1.3;
	}

	.pref-control {
		flex-shrink: 0;
	}

	.pref-bool {
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 0.72rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		color: var(--text-muted);
		min-width: 44px;
	}

	.pref-bool.on {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		border-color: var(--accent);
		color: var(--accent);
	}

	.pref-sel {
		padding: 4px 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.78rem;
		font-family: inherit;
		cursor: pointer;
		outline: none;
	}

	.pref-sel:focus {
		border-color: var(--accent);
	}

	.pref-val {
		width: 72px;
		padding: 4px 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.78rem;
		font-family: 'JetBrains Mono', monospace;
		outline: none;
	}

	.pref-val:focus {
		border-color: var(--accent);
	}

	.pref-rm {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.1rem;
		padding: 2px 4px;
		border-radius: 4px;
		transition: color 0.15s;
		line-height: 1;
		flex-shrink: 0;
	}

	.pref-rm:hover {
		color: var(--danger);
	}

	.custom-pref-toggle {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.78rem;
		color: var(--text-muted);
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: color 0.15s;
	}

	.custom-pref-toggle:hover {
		color: var(--text-secondary);
	}

	.custom-pref-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.custom-pref-input {
		flex: 1;
		padding: 10px 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.82rem;
		font-family: 'JetBrains Mono', monospace;
		outline: none;
	}

	.custom-pref-input:focus {
		border-color: var(--accent);
	}

	.custom-pref-type {
		padding: 10px 8px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.78rem;
		font-family: inherit;
		cursor: pointer;
		outline: none;
	}

	.custom-pref-add {
		padding: 10px 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.82rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.custom-pref-add:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.pref-error {
		font-size: 0.78rem;
		color: var(--danger);
	}

	.pref-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
	}
</style>
