<script lang="ts">
	interface MenuItem {
		label: string;
		action: string;
		danger?: boolean;
	}

	let { items, onselect, square = false }: {
		items: MenuItem[];
		onselect: (action: string) => void;
		square?: boolean;
	} = $props();

	let open = $state(false);
	let menuEl: HTMLDivElement | undefined = $state(undefined);

	function toggle(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		open = !open;
	}

	function select(action: string, e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		open = false;
		onselect(action);
	}

	function handleClickOutside(e: MouseEvent) {
		if (open && menuEl && !menuEl.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="ctx" bind:this={menuEl}>
	<button class="trigger" class:square onclick={toggle} aria-label="More actions">⋯</button>
	{#if open}
		<div class="dropdown">
			{#each items as item, i}
				{#if i > 0 && item.danger && !items[i - 1]?.danger}
					<div class="divider"></div>
				{/if}
				<button
					class="menu-item"
					class:danger={item.danger}
					onclick={(e) => select(item.action, e)}
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.ctx {
		position: relative;
	}

	.trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 7px;
		color: var(--text-muted);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.9rem;
		line-height: 1;
		transition:
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.trigger.square {
		width: 40px;
		height: 40px;
		padding: 0;
		border-radius: 9px;
		font-size: 1rem;
		color: var(--text-muted);
	}

	.trigger:hover {
		border-color: var(--border-hover);
		color: var(--accent);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		min-width: 170px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 4px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03);
		z-index: 100;
		animation: menuIn 0.15s ease-out;
	}

	@keyframes menuIn {
		from { opacity: 0; transform: translateY(-4px) scale(0.97); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	.divider {
		height: 1px;
		background: var(--border);
		margin: 4px 8px;
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: 10px 14px;
		background: none;
		border: none;
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.85rem;
		font-weight: 500;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: background 0.12s;
	}

	.menu-item:hover {
		background: var(--bg-tertiary);
	}

	.menu-item.danger {
		color: var(--danger);
	}

	.menu-item.danger:hover {
		background: rgba(239, 68, 68, 0.1);
	}
</style>
