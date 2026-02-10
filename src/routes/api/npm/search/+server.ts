import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface NpmPackage {
	name: string;
	description: string;
	version: string;
}

interface NpmSearchResult {
	name: string;
	desc: string;
	type: 'npm';
}

interface NpmRegistryResponse {
	objects: Array<{
		package: {
			name: string;
			description: string;
			version: string;
		};
	}>;
}

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q')?.toLowerCase().trim();

	if (!query || query.length < 2) {
		return json({ results: [], error: 'Query must be at least 2 characters' });
	}

	try {
		const response = await fetch(
			`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=30`,
			{ cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit
		);

		if (!response.ok) {
			throw new Error('Failed to search npm registry');
		}

		const data = (await response.json()) as NpmRegistryResponse;

		const results: NpmSearchResult[] = data.objects.map((obj) => ({
			name: obj.package.name,
			desc: obj.package.description || '',
			type: 'npm' as const
		}));

		return json({ results });
	} catch (error) {
		console.error('npm search error:', error);
		return json({ results: [], error: 'Failed to search npm packages' }, { status: 500 });
	}
};
