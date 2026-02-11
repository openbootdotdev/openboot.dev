import type { Component } from 'svelte';

export interface DocMeta {
	title: string;
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
	metadata: { title: string; group: string; order: number };
}>('/src/docs/*.md', { eager: true });

function buildDocStructure(): DocGroup[] {
	const docs: DocMeta[] = Object.entries(modules).map(([path, mod]) => {
		const slug = path.replace('/src/docs/', '').replace('.md', '');
		return {
			title: mod.metadata.title,
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
