import type { RequestHandler } from './$types';
import satori from 'satori';
import { Resvg } from '@cf-wasm/resvg';

async function loadFont(): Promise<ArrayBuffer> {
	const css = await fetch(
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&subset=latin',
		{
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1'
			}
		}
	).then((r) => r.text());

	const fontUrl = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
	if (!fontUrl) throw new Error('Could not find font URL');
	return fetch(fontUrl).then((r) => r.arrayBuffer());
}

function renderTags(
	pkgs: { name: string }[],
	color: string,
	max: number
): Record<string, unknown>[] {
	const visible = pkgs.slice(0, max);
	const overflow = pkgs.length - max;
	const tags: Record<string, unknown>[] = visible.map((p) => ({
		type: 'span',
		props: {
			style: {
				display: 'flex',
				background: '#141414',
				border: '1px solid #252525',
				color,
				padding: '6px 14px',
				borderRadius: 6,
				fontSize: 14,
				fontFamily: 'Inter',
				whiteSpace: 'nowrap'
			},
			children: p.name
		}
	}));
	if (overflow > 0) {
		tags.push({
			type: 'span',
			props: {
				style: { display: 'flex', color: '#444', fontSize: 13, padding: '6px 8px', alignItems: 'center' },
				children: `+${overflow} more`
			}
		});
	}
	return tags;
}

function buildSection(label: string, count: number, children: Record<string, unknown>[]) {
	return {
		type: 'div',
		props: {
			style: { display: 'flex', flexDirection: 'column', gap: 10 },
			children: [
				{
					type: 'span',
					props: {
						style: { display: 'flex', fontSize: 11, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' },
						children: `${label} · ${count}`
					}
				},
				{
					type: 'div',
					props: {
						style: { display: 'flex', flexWrap: 'wrap', gap: 8 },
						children
					}
				}
			]
		}
	};
}

export const GET: RequestHandler = async ({ params, platform }) => {
	const env = platform?.env;
	if (!env) return new Response('Platform env not available', { status: 500 });

	const { username, slug } = params;

	const targetUser = await env.DB.prepare('SELECT id, username FROM users WHERE username = ?')
		.bind(username)
		.first<{ id: string; username: string }>();

	if (!targetUser) return new Response('Not found', { status: 404 });

	const config = await env.DB.prepare(
		'SELECT name, description, packages, is_public, base_preset FROM configs WHERE user_id = ? AND slug = ?'
	)
		.bind(targetUser.id, slug)
		.first<{
			name: string;
			description: string;
			packages: string;
			is_public: number;
			base_preset: string;
		}>();

	if (!config || !config.is_public) return new Response('Not found', { status: 404 });

	const rawPkgs: { name: string; type: string }[] = (() => {
		try {
			const parsed = JSON.parse(config.packages || '[]');
			return parsed.map((p: any) => (typeof p === 'string' ? { name: p, type: 'formula' } : p));
		} catch {
			return [];
		}
	})();

	const homebrew = rawPkgs.filter((p) => p.type !== 'npm');
	const npm = rawPkgs.filter((p) => p.type === 'npm');
	const total = rawPkgs.length;

	const sections: Record<string, unknown>[] = [];
	if (homebrew.length > 0) sections.push(buildSection('HOMEBREW', homebrew.length, renderTags(homebrew, '#e0e0e0', 24)));
	if (npm.length > 0) sections.push(buildSection('NPM', npm.length, renderTags(npm, '#22c55e', 12)));

	const descChildren = config.description
		? [{ type: 'span', props: { style: { display: 'flex', color: '#888', fontSize: 16 }, children: config.description.slice(0, 80) } }]
		: [];

	const element = {
		type: 'div',
		props: {
			style: { display: 'flex', flexDirection: 'column', width: 1200, height: 630, background: '#0a0a0a', padding: 48, fontFamily: 'Inter' },
			children: [
				{
					type: 'div',
					props: {
						style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
						children: [
							{ type: 'span', props: { style: { display: 'flex', color: '#22c55e', fontSize: 28, fontWeight: 700 }, children: 'OpenBoot' } },
							{
								type: 'div',
								props: {
									style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
									children: [
										{ type: 'span', props: { style: { display: 'flex', color: '#666', fontSize: 15 }, children: `@${username}` } },
										{ type: 'span', props: { style: { display: 'flex', color: '#22c55e', fontSize: 15 }, children: `${total} packages` } }
									]
								}
							}
						]
					}
				},
				{
					type: 'div',
					props: {
						style: { display: 'flex', flexDirection: 'column', marginTop: 12, gap: 4 },
						children: [
							{ type: 'span', props: { style: { display: 'flex', color: '#fff', fontSize: 32, fontWeight: 700 }, children: config.name } },
							...descChildren
						]
					}
				},
				{ type: 'div', props: { style: { display: 'flex', width: '100%', height: 1, background: '#1a1a1a', margin: '20px 0' }, children: [] } },
				{ type: 'div', props: { style: { display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflow: 'hidden' }, children: sections } },
				{ type: 'div', props: { style: { display: 'flex', width: '100%', height: 1, background: '#1a1a1a', marginTop: 'auto' }, children: [] } },
				{
					type: 'div',
					props: {
						style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
						children: [
							{ type: 'span', props: { style: { display: 'flex', color: '#444', fontSize: 14 }, children: 'openboot.dev' } },
							{ type: 'span', props: { style: { display: 'flex', color: '#444', fontSize: 13 }, children: `${config.base_preset} preset` } }
						]
					}
				}
			]
		}
	};

	const fontData = await loadFont();

	const svg = await satori(element as any, {
		width: 1200,
		height: 630,
		fonts: [
			{ name: 'Inter', data: fontData, weight: 400, style: 'normal' as const },
			{ name: 'Inter', data: fontData, weight: 700, style: 'normal' as const }
		]
	});

	const resvg = new Resvg(svg, { fitTo: { mode: 'width' as const, value: 1200 } });
	const pngData = resvg.render();
	const pngBuffer = pngData.asPng();

	return new Response(pngBuffer, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=86400, s-maxage=86400'
		}
	});
};
