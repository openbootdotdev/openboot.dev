<script lang="ts">
	import Fuse from 'fuse.js';
	import { tick } from 'svelte';
	import type { SearchEntry } from '../../routes/docs/docs-data';

	interface Props {
		open: boolean;
		searchIndex: SearchEntry[];
		onclose: () => void;
		onnavigate: (slug: string) => void;
	}

	let { open, searchIndex, onclose, onnavigate }: Props = $props();

	let query = $state('');
	let selectedIndex = $state(-1);
	let inputRef = $state<HTMLInputElement | null>(null);
	let resultsRef = $state<HTMLUListElement | null>(null);

	interface SearchResult extends SearchEntry {
		snippet?: string;
		score?: number;
	}

	let fuse = $derived(
		new Fuse(searchIndex, {
			keys: [
				{ name: 'title', weight: 3 },
				{ name: 'headings', weight: 2 },
				{ name: 'content', weight: 1 }
			],
			threshold: 0.3,
			includeScore: true,
			includeMatches: true,
			minMatchCharLength: 2
		})
	);

	let results = $derived.by<SearchResult[]>(() => {
		if (query.trim().length === 0) return [];
		const fuseResults = fuse.search(query).slice(0, 8);
		return fuseResults.map((r) => {
			const snippet = r.matches?.[0]?.value
				? r.matches[0].value.substring(0, 100) + '...'
				: undefined;
			return {
				...r.item,
				snippet,
				score: r.score
			};
		});
	});

	$effect(() => {
		// Reset selectedIndex when results change
		if (query.trim().length > 0) {
			selectedIndex = results.length > 0 ? 0 : -1;
		} else {
			selectedIndex = -1;
		}
	});

	$effect(() => {
		if (open) {
			tick().then(() => {
				inputRef?.focus();
			});
		}
	});

	$effect(() => {
		if (!open) {
			query = '';
		}
	});

	$effect(() => {
		if (selectedIndex >= 0 && resultsRef) {
			const selectedElement = resultsRef.children[selectedIndex] as HTMLElement;
			selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		const itemCount = query.trim().length > 0 ? results.length : searchIndex.length;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = selectedIndex < itemCount - 1 ? selectedIndex + 1 : 0;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : itemCount - 1;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (selectedIndex >= 0) {
				const item = query.trim().length > 0 ? results[selectedIndex] : searchIndex[selectedIndex];
				if (item) select(item);
			}
		} else if (e.key === 'Escape') {
			e.preventDefault();
			onclose();
		}
	}

	function select(entry: SearchEntry) {
		onnavigate(entry.slug);
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}
</script>

{#if open}
	<div class="search-backdrop" role="presentation" onclick={handleBackdropClick}>
		<div class="search-modal" role="dialog" aria-modal="true" aria-label="Search documentation">
			<div class="search-input-wrapper">
				<svg
					class="search-icon"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
				</svg>
				<input
					type="text"
					placeholder="Search docs..."
					bind:value={query}
					bind:this={inputRef}
					onkeydown={handleKeydown}
				/>
				<kbd class="search-kbd">ESC</kbd>
			</div>
			{#if results.length > 0}
				<ul class="search-results" role="listbox" bind:this={resultsRef}>
					{#each results as result, i}
						<li role="option" aria-selected={i === selectedIndex} class:selected={i === selectedIndex}>
							<button onclick={() => select(result)}>
								<span class="result-group">{result.group}</span>
								<span class="result-title">{result.title}</span>
								{#if result.snippet}
									<span class="result-snippet">{result.snippet}</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{:else if query.length > 0}
				<div class="search-empty">No results for "{query}"</div>
			{:else}
				<ul class="search-results" role="listbox" bind:this={resultsRef}>
					{#each searchIndex as entry, i}
						<li role="option" aria-selected={i === selectedIndex} class:selected={i === selectedIndex}>
							<button onclick={() => select(entry)}>
								<span class="result-group">{entry.group}</span>
								<span class="result-title">{entry.title}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="search-footer">
				<span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
				<span><kbd>↵</kbd> open</span>
				<span><kbd>esc</kbd> close</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.search-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 200;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 15vh;
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.search-modal {
		width: 100%;
		max-width: 560px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.05);
		overflow: hidden;
		max-height: 70vh;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
		gap: 10px;
	}

	input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		font-size: 0.95rem;
		font-family: inherit;
		color: var(--text-primary);
	}

	input::placeholder {
		color: var(--text-muted);
	}

	.search-icon {
		color: var(--text-muted);
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.search-kbd {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		padding: 2px 6px;
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-muted);
		background: var(--bg-tertiary);
	}

	.search-results {
		overflow-y: auto;
		list-style: none;
		padding: 8px;
		margin: 0;
		flex: 1;
	}

	.search-results li button {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px 12px;
		border: none;
		background: none;
		cursor: pointer;
		border-radius: 8px;
		text-align: left;
		font-family: inherit;
		color: var(--text-secondary);
		transition: all 0.1s;
	}

	.search-results li.selected button,
	.search-results li button:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.result-group {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.result-title {
		font-size: 0.9rem;
		font-weight: 500;
		color: inherit;
	}

	.result-snippet {
		font-size: 0.78rem;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-empty {
		padding: 32px 16px;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.88rem;
	}

	.search-footer {
		display: flex;
		gap: 16px;
		padding: 10px 16px;
		border-top: 1px solid var(--border);
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.search-footer kbd {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		padding: 1px 5px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--bg-tertiary);
		margin-right: 2px;
	}

	@media (max-width: 600px) {
		.search-backdrop {
			padding-top: 10vh;
		}

		.search-modal {
			max-width: calc(100% - 24px);
			margin: 0 12px;
		}

		.search-footer {
			display: none;
		}
	}
</style>
