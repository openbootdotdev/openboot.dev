import type { Component } from 'svelte';

export interface DocMeta {
	title: string;
	description: string;
	group: string;
	order: number;
	slug: string;
}

export interface DocGroup {
	label: string;
	items: DocMeta[];
}

// Controls the display order of sidebar groups.
const GROUP_ORDER = ['Overview', 'Features', 'Use Cases', 'Reference', ''];

export const modules = import.meta.glob<{
	default: Component;
	metadata: { title: string; description: string; group: string; order: number };
}>('/src/docs/*.md', { eager: true });

const rawModules = import.meta.glob<string>('/src/docs/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
});

function buildDocStructure(): DocGroup[] {
	const docs: DocMeta[] = Object.entries(modules).map(([path, mod]) => {
		const slug = path.replace('/src/docs/', '').replace('.md', '');
		return {
			title: mod.metadata.title,
			description: mod.metadata.description ?? '',
			group: mod.metadata.group ?? '',
			order: mod.metadata.order,
			slug
		};
	});

	docs.sort((a, b) => a.order - b.order);

	const groupMap = new Map<string, DocMeta[]>();
	for (const doc of docs) {
		const key = doc.group;
		if (!groupMap.has(key)) groupMap.set(key, []);
		groupMap.get(key)!.push(doc);
	}

	return GROUP_ORDER.filter((g) => groupMap.has(g)).map((label) => ({
		label,
		items: groupMap.get(label)!
	}));
}

export const DOC_STRUCTURE = buildDocStructure();
export const allDocs = DOC_STRUCTURE.flatMap((g) => g.items);

export interface SearchEntry {
	slug: string;
	title: string;
	group: string;
	headings: string[];
	content: string;
}

function buildSearchIndex(): SearchEntry[] {
	return Object.entries(modules).map(([path, mod]) => {
		const slug = path.replace('/src/docs/', '').replace('.md', '');
		const rawContent = rawModules[path] || '';

		// Extract headings (## or ###)
		const headingMatches = rawContent.match(/^#{2,3}\s+(.+)$/gm) || [];
		const headings = headingMatches.map((h) => h.replace(/^#{2,3}\s+/, '').trim());

		// Extract plain text content (strip markdown syntax)
		let content = rawContent
			// Remove frontmatter
			.replace(/^---[\s\S]*?---\n/, '')
			// Remove code blocks
			.replace(/```[\s\S]*?```/g, '')
			// Remove inline code
			.replace(/`[^`]+`/g, '')
			// Remove headings
			.replace(/^#{1,6}\s+.+$/gm, '')
			// Remove links but keep text
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
			// Remove bold/italic
			.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
			// Remove extra whitespace
			.replace(/\n{3,}/g, '\n\n')
			.trim();

		return {
			slug,
			title: mod.metadata.title,
			group: mod.metadata.group ?? '',
			headings,
			content
		};
	});
}

export const searchIndex: SearchEntry[] = buildSearchIndex();
