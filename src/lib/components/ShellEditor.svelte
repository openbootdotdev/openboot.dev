<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import type { EditorView } from '@codemirror/view';

	let {
		value = $bindable(''),
		placeholder = '',
	}: {
		value: string;
		placeholder?: string;
	} = $props();

	let container: HTMLDivElement | undefined = $state();
	let view: EditorView | undefined = $state();
	let currentTheme: 'light' | 'dark' = $state('dark');

	// Track theme from store
	theme.subscribe((t) => {
		currentTheme = t;
	});

	onMount(() => {
		if (!browser || !container) return;

		let unsubscribe: (() => void) | undefined;

		async function init() {
			if (!container) return;

			const { EditorView: EV, keymap, placeholder: placeholderExt, lineNumbers } = await import('@codemirror/view');
			const { EditorState, Compartment } = await import('@codemirror/state');
			const { StreamLanguage } = await import('@codemirror/language');
			const { shell } = await import('@codemirror/legacy-modes/mode/shell');
			const { indentWithTab } = await import('@codemirror/commands');
			const { oneDark } = await import('@codemirror/theme-one-dark');

			const themeCompartment = new Compartment();

			const customTheme = EV.theme({
				'&': {
					height: '100%',
					fontSize: '0.82rem',
					fontFamily: "'JetBrains Mono', monospace",
				},
				'.cm-scroller': {
					overflow: 'auto',
					fontFamily: "'JetBrains Mono', monospace",
				},
				'.cm-content': {
					padding: '16px 0',
					caretColor: 'var(--text-primary)',
				},
				'.cm-line': {
					padding: '0 16px',
				},
				'.cm-gutters': {
					background: 'var(--bg-secondary)',
					color: 'var(--text-muted)',
					border: 'none',
					borderRight: '1px solid var(--border)',
				},
				'.cm-activeLineGutter': {
					background: 'var(--bg-hover)',
				},
				'.cm-activeLine': {
					background: 'var(--bg-hover)',
				},
				'.cm-cursor': {
					borderLeftColor: 'var(--text-primary)',
				},
				'.cm-selectionBackground': {
					background: 'var(--accent-glow) !important',
				},
				'&.cm-focused .cm-selectionBackground': {
					background: 'var(--accent-glow) !important',
				},
				'.cm-placeholder': {
					color: 'var(--text-muted)',
					opacity: '0.4',
					fontStyle: 'italic',
				},
			});

			const lightTheme = EV.theme({
				'&': {
					backgroundColor: 'var(--bg-primary)',
					color: 'var(--text-primary)',
				},
				'.cm-gutters': {
					background: 'var(--bg-secondary)',
					color: 'var(--text-muted)',
				},
			}, { dark: false });

			const darkTheme = EV.theme({
				'&': {
					backgroundColor: 'var(--bg-primary)',
					color: 'var(--text-primary)',
				},
				'.cm-gutters': {
					background: 'var(--bg-secondary)',
					color: 'var(--text-muted)',
				},
			}, { dark: true });

			function getThemeExtensions(isDark: boolean) {
				return isDark
					? [oneDark, darkTheme]
					: [lightTheme];
			}

			const updateListener = EV.updateListener.of((update) => {
				if (update.docChanged) {
					value = update.state.doc.toString();
				}
			});

			const state = EditorState.create({
				doc: value,
				extensions: [
					lineNumbers(),
					StreamLanguage.define(shell),
					keymap.of([indentWithTab]),
					customTheme,
					themeCompartment.of(getThemeExtensions(currentTheme === 'dark')),
					placeholderExt(placeholder),
					updateListener,
					EV.lineWrapping,
				],
			});

			view = new EV({ state, parent: container });

			unsubscribe = theme.subscribe((t) => {
				if (view) {
					view.dispatch({
						effects: themeCompartment.reconfigure(getThemeExtensions(t === 'dark')),
					});
				}
			});
		}

		init();

		return () => {
			unsubscribe?.();
			view?.destroy();
		};
	});

	// Sync external value changes into the editor
	$effect(() => {
		if (view && value !== view.state.doc.toString()) {
			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: value,
				},
			});
		}
	});
</script>

<div class="shell-editor" bind:this={container}></div>

<style>
	.shell-editor {
		height: 100%;
		width: 100%;
		overflow: hidden;
	}

	.shell-editor :global(.cm-editor) {
		height: 100%;
	}

	.shell-editor :global(.cm-focused) {
		outline: none;
	}
</style>
