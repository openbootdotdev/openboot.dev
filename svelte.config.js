import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, escapeSvelte } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import { createHighlighter } from 'shiki';

const highlighter = await createHighlighter({
	themes: ['github-dark', 'github-light'],
	langs: ['javascript', 'typescript', 'bash', 'json', 'yaml', 'html', 'css', 'shell', 'text']
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md'],
			rehypePlugins: [rehypeSlug],
			highlight: {
				highlighter: async (code, lang = 'text') => {
					let html = '';
					try {
						html = highlighter.codeToHtml(code, {
							lang,
							themes: {
								dark: 'github-dark',
								light: 'github-light'
							}
						});
					} catch {
						html = highlighter.codeToHtml(code, {
							lang: 'text',
							themes: {
								dark: 'github-dark',
								light: 'github-light'
							}
						});
					}
					const escaped = escapeSvelte(html);
					return `{@html \`${escaped}\` }`;
				}
			}
		})
	],
	kit: {
		adapter: adapter()
	}
};

export default config;
