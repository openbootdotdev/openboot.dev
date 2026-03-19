<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Section {
		id: string;
		label: string;
	}

	let { sections }: { sections: Section[] } = $props();

	let activeId = $state(sections[0]?.id ?? '');
	let observer: IntersectionObserver | null = null;

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
					}
				}
			},
			{ rootMargin: '-20% 0px -60% 0px', threshold: 0 }
		);

		for (const s of sections) {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		}
	});

	onDestroy(() => observer?.disconnect());

	function scrollTo(id: string) {
		const el = document.getElementById(id);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<nav class="snav" aria-label="Page sections">
	{#each sections as section}
		<button
			class="snav-item"
			class:active={activeId === section.id}
			onclick={() => scrollTo(section.id)}
			title={section.label}
		>
			<span class="dot"></span>
			<span class="lbl">{section.label}</span>
		</button>
	{/each}
</nav>

<style>
	.snav {
		position: fixed;
		right: 28px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		gap: 16px;
		z-index: 50;
	}

	.snav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-direction: row-reverse;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--border);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
	}

	.snav-item.active .dot {
		background: var(--accent);
		box-shadow: 0 0 10px var(--accent-glow);
		transform: scale(1.4);
	}

	.lbl {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--text-muted);
		opacity: 0;
		transform: translateX(6px);
		transition: all 0.2s;
		white-space: nowrap;
		pointer-events: none;
	}

	.snav-item:hover .lbl {
		opacity: 1;
		transform: translateX(0);
	}

	.snav-item.active .lbl {
		color: var(--accent);
	}

	@media (max-width: 1200px) {
		.snav {
			display: none;
		}
	}
</style>
