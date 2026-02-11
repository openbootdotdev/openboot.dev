import type { PageServerLoad } from './$types';

interface ConfigRow {
	id: string;
	name: string;
	slug: string;
	base_preset: string;
	packages: string;
	install_count: number;
	username: string;
	avatar_url: string | null;
}

interface Package {
	name: string;
	type: string;
}

export const load: PageServerLoad = async ({ platform }) => {
	const env = platform?.env;
	
	if (!env) {
		return { publicConfigs: [] };
	}

	try {
		const configs = await env.DB.prepare(`
			SELECT c.id, c.name, c.slug, c.base_preset, c.packages, c.install_count, u.username, u.avatar_url 
			FROM configs c 
			JOIN users u ON c.user_id = u.id 
			WHERE c.is_public = 1 
			ORDER BY c.install_count DESC, c.updated_at DESC 
			LIMIT 6
		`).all<ConfigRow>();

		const publicConfigs = configs.results.map((config) => {
			let packages: Package[] = [];
			try {
				const parsed = JSON.parse(config.packages || '[]');
				packages = Array.isArray(parsed)
					? parsed.map((p: unknown) => (typeof p === 'string' ? { name: p, type: 'formula' } : p as Package))
					: [];
			} catch (e) {
				console.error('Failed to parse packages', e);
			}

			const cliCount = packages.filter((p) => p.type !== 'cask' && p.type !== 'npm').length;
			const appsCount = packages.filter((p) => p.type === 'cask').length;
			const npmCount = packages.filter((p) => p.type === 'npm').length;

			return {
				id: config.id,
				name: config.name,
				slug: config.slug,
				base_preset: config.base_preset,
				username: config.username,
				avatar_url: config.avatar_url,
				install_count: config.install_count || 0,
				cliCount,
				appsCount,
				npmCount,
				totalCount: cliCount + appsCount + npmCount
			};
		});

		return { publicConfigs };
	} catch (error) {
		console.error('Failed to load public configs:', error);
		return { publicConfigs: [] };
	}
};
