import { error } from '@sveltejs/kit';
import { modules } from '../docs-data';

export function load({ params }: { params: { slug: string } }) {
	const path = `/src/docs/${params.slug}.md`;
	const mod = modules[path];

	if (!mod) {
		error(404, `Doc not found: ${params.slug}`);
	}

	return {
		component: mod.default,
		meta: mod.metadata,
		slug: params.slug
	};
}
