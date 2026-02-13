import { allDocs } from '../docs/docs-data';
import type { RequestHandler } from './$types';

const SITE_URL = 'https://openboot.dev';

export const GET: RequestHandler = async ({ platform }) => {
	const staticPages = [
		{ path: '/', priority: '1.0', changefreq: 'weekly' },
		{ path: '/explore', priority: '0.9', changefreq: 'daily' },
		{ path: '/login', priority: '0.3', changefreq: 'monthly' },
		{ path: '/docs/what-is-openboot', priority: '0.9', changefreq: 'weekly' }
	];

	const docPages = allDocs
		.filter((doc) => doc.slug !== 'what-is-openboot')
		.map((doc) => ({
			path: `/docs/${doc.slug}`,
			priority: '0.8',
			changefreq: 'weekly' as const
		}));

	const dynamicPages: { path: string; priority: string; changefreq: string }[] = [];

	const env = platform?.env;
	if (env) {
		const { results: publicConfigs } = await env.DB.prepare(
			`SELECT c.slug, u.username FROM configs c JOIN users u ON c.user_id = u.id WHERE c.visibility = 'public' ORDER BY c.install_count DESC LIMIT 500`
		).all<{ slug: string; username: string }>();

		const seenUsers = new Set<string>();
		for (const config of publicConfigs) {
			if (!seenUsers.has(config.username)) {
				seenUsers.add(config.username);
				dynamicPages.push({ path: `/${config.username}`, priority: '0.7', changefreq: 'weekly' });
			}
			dynamicPages.push({ path: `/${config.username}/${config.slug}`, priority: '0.6', changefreq: 'weekly' });
		}
	}

	const allPages = [...staticPages, ...docPages, ...dynamicPages];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
	.map(
		(page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
