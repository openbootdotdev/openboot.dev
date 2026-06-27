import type { PageServerLoad } from './$types';
import { getPublicConfigs } from '$lib/server/db';
import { countPackageTypes } from '$lib/fingerprint';

// Top community configs shown on the landing page. Featured first; falls back to
// an empty list if the DB binding isn't available so the section just hides.
export const load: PageServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) return { communityConfigs: [] };

	try {
		const { results } = await getPublicConfigs(db, {
			sort: 'featured',
			visibility: 'public',
			limit: 3,
			offset: 0
		});
		const communityConfigs = results.map((c) => {
			let pkgs: unknown[] = [];
			try {
				const parsed = JSON.parse(c.packages);
				if (Array.isArray(parsed)) pkgs = parsed;
			} catch {
				pkgs = [];
			}
			return {
				name: c.name,
				slug: c.slug,
				username: c.username,
				counts: countPackageTypes(pkgs)
			};
		});
		return { communityConfigs };
	} catch {
		return { communityConfigs: [] };
	}
};
