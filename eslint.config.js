// Flat config — minimal rule set that mechanises the conventions
// already written in CLAUDE.md. See HARNESS.md for the steering loop
// (when a class of issue recurs, prefer encoding it here over re-stating
// it in docs).

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
	{
		ignores: ['.svelte-kit/**', 'build/**', 'coverage/**', 'node_modules/**', 'static/**', '.wrangler/**', 'dist/**']
	},

	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],

	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			ecmaVersion: 2024,
			sourceType: 'module',
			parserOptions: { extraFileExtensions: ['.svelte'] }
		},
		rules: {
			// CLAUDE.md: "No `as any` or `@ts-ignore` — type properly".
			// Warn for now — full cleanup is tracked separately; `validate`
			// fails only on errors so existing call sites don't block.
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/ban-ts-comment': 'error',

			// Stop merge of forgotten _-debugging without blocking intentional
			// throwaway names. Soft-landed (warn) so existing call sites
			// don't block; new code stays clean via the .claude post-tool-use
			// hook surfacing warnings during edit.
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],

			// Cloudflare Workers: secrets/config flow through platform.env,
			// not process.env. Test setup needs a process.env override
			// (configured in the test override below).
			'no-restricted-globals': [
				'error',
				{ name: 'process', message: 'Use platform.env (Cloudflare Workers). Tests may override.' }
			],

			// Catch the typical AI-leaning slop.
			'no-console': ['warn', { allow: ['warn', 'error'] }],

			// We do not use `eval` / `new Function`.
			'no-eval': 'error',
			'no-implied-eval': 'error',

			// Style/best-practice rules that flag real-but-stylistic issues
			// across the existing codebase. Soft-landed as warn so `validate`
			// stays green; HARNESS.md documents the path to promote them.
			'svelte/require-each-key': 'warn',
			'svelte/no-navigation-without-resolve': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn',
			'svelte/no-useless-mustaches': 'warn',
			'svelte/no-at-html-tags': 'warn',
			'no-useless-escape': 'warn',
			'no-useless-assignment': 'warn',
			'prefer-const': 'warn'
		}
	},

	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.svelte'] }
		}
	},

	// Test files and test infra freely use `any`, `process.env`, and
	// console.log. That's not a lapse — mocks and seed scripts need it.
	{
		files: ['**/*.{test,spec}.{ts,js}', 'src/lib/test/**', 'src/smoke-tests/**', 'scripts/**'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'no-restricted-globals': 'off',
			'no-console': 'off'
		}
	}
];
