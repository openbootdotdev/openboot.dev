import { allDocs } from '../docs/docs-data';

const SITE_URL = 'https://openboot.dev';

export function GET() {
	const staticPages = [
		{ path: '/', priority: '1.0', changefreq: 'weekly' },
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

	const allPages = [...staticPages, ...docPages];

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
}
