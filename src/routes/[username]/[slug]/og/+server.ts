import type { RequestHandler } from './$types';
import { Resvg } from '@cf-wasm/resvg';

let fontCacheRegular: Uint8Array | null = null;
let fontCacheBold: Uint8Array | null = null;

async function loadFonts(): Promise<Uint8Array[]> {
	if (fontCacheRegular && fontCacheBold) return [fontCacheRegular, fontCacheBold];

	const css = await fetch(
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&subset=latin',
		{
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1'
			}
		}
	).then((r) => r.text());

	const fontUrls = [...css.matchAll(/src: url\((.+?)\) format\('truetype'\)/g)].map((m) => m[1]);
	if (fontUrls.length === 0) throw new Error('Could not find font URLs');

	const buffers = await Promise.all(
		fontUrls.map((url) => fetch(url).then((r) => r.arrayBuffer()).then((b) => new Uint8Array(b)))
	);

	fontCacheRegular = buffers[0];
	fontCacheBold = buffers[1] || buffers[0];
	return buffers;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSvg(
	name: string,
	description: string,
	username: string,
	preset: string,
	homebrew: { name: string }[],
	npm: { name: string }[],
	total: number,
	userInitial: string
): string {
	const W = 1200;
	const H = 630;
	const pad = 48;

	let tagsSvg = '';
	let curX = pad;
	let curY = 220;
	const tagH = 32;
	const tagGap = 10;
	const tagPadX = 16;
	const maxY = H - 70;
	const charW = 9;

	function addGroup(pkgs: { name: string }[], color: string, maxShow: number = 5) {
		if (curY > maxY || pkgs.length === 0) return;
		
		const displayPkgs = pkgs.slice(0, maxShow);
		
		for (let i = 0; i < displayPkgs.length; i++) {
			if (curY > maxY) return;

			const text = displayPkgs[i].name;
			const tw = text.length * charW + tagPadX * 2;

			if (curX + tw > W - pad && curX !== pad) {
				curX = pad;
				curY += tagH + tagGap;
				if (curY > maxY) return;
			}

			tagsSvg += `<rect x="${curX}" y="${curY}" width="${tw}" height="${tagH}" rx="8" fill="#1a1a1a" stroke="${color}" stroke-width="2"/>`;
			tagsSvg += `<text x="${curX + tagPadX}" y="${curY + 21}" fill="${color}" font-size="15" font-weight="600" font-family="Inter">${esc(text)}</text>`;
			curX += tw + tagGap;
		}
		
		if (pkgs.length > maxShow) {
			const remaining = pkgs.length - maxShow;
			const tw = 80;
			if (curX + tw > W - pad && curX !== pad) {
				curX = pad;
				curY += tagH + tagGap;
			}
			tagsSvg += `<rect x="${curX}" y="${curY}" width="${tw}" height="${tagH}" rx="8" fill="#1a1a1a" stroke="#333" stroke-width="1"/>`;
			tagsSvg += `<text x="${curX + tagPadX}" y="${curY + 21}" fill="#666" font-size="14" font-family="Inter">+${remaining} more</text>`;
		}
		
		curY += tagH + tagGap + 12;
		curX = pad;
	}

	if (homebrew.length > 0) addGroup(homebrew, '#22c55e', 5);
	if (npm.length > 0) addGroup(npm, '#3b82f6', 3);

	const descLine = description
		? `<text x="${pad + 80}" y="138" fill="#888" font-size="17" font-family="Inter">${esc(description.slice(0, 70))}</text>`
		: '';

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
		<defs>
			<radialGradient id="glow" cx="0.2" cy="0.15" r="0.55">
				<stop offset="0%" stop-color="#22c55e" stop-opacity="0.1"/>
				<stop offset="40%" stop-color="#22c55e" stop-opacity="0.04"/>
				<stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
			</radialGradient>
		</defs>
		<rect width="${W}" height="${H}" fill="#0a0a0a"/>
		<rect width="${W}" height="${H}" fill="url(#glow)"/>

		<text x="${pad}" y="64" fill="#22c55e" font-size="24" font-weight="bold" font-family="Inter">OpenBoot</text>

		<circle cx="${pad + 32}" cy="118" r="32" fill="#22c55e"/>
		<text x="${pad + 32}" y="128" fill="#000" font-size="28" font-weight="bold" font-family="Inter" text-anchor="middle">${userInitial}</text>

		<text x="${pad + 80}" y="110" fill="#ffffff" font-size="32" font-weight="bold" font-family="Inter">${esc(name)}</text>
		${descLine}

		<text x="${W - pad}" y="68" fill="#666" font-size="16" font-family="Inter" text-anchor="end">@${esc(username)}</text>
		<text x="${W - pad}" y="94" fill="#22c55e" font-size="16" font-family="Inter" text-anchor="end">${total} packages</text>
		<text x="${W - pad}" y="118" fill="#666" font-size="15" font-family="Inter" text-anchor="end">${esc(preset)} preset</text>

		<line x1="${pad}" y1="178" x2="${W - pad}" y2="178" stroke="#1a1a1a" stroke-width="2"/>

		${tagsSvg}

		<line x1="${pad}" y1="${H - 56}" x2="${W - pad}" y2="${H - 56}" stroke="#1a1a1a" stroke-width="2"/>
		<text x="${pad}" y="${H - 28}" fill="#444" font-size="15" font-family="Inter">openboot.dev</text>
	</svg>`;
}

export const GET: RequestHandler = async ({ params, platform }) => {
	const env = platform?.env;
	if (!env) return new Response('Platform env not available', { status: 500 });

	const { username, slug } = params;

	const targetUser = await env.DB.prepare('SELECT id, username, avatar_url FROM users WHERE username = ?')
		.bind(username)
		.first<{ id: string; username: string; avatar_url: string | null }>();

	if (!targetUser) return new Response('Not found', { status: 404 });

	const config = await env.DB.prepare(
		'SELECT name, description, packages, visibility, base_preset FROM configs WHERE user_id = ? AND slug = ?'
	)
		.bind(targetUser.id, slug)
		.first<{
			name: string;
			description: string;
			packages: string;
			visibility: string;
			base_preset: string;
		}>();

	if (!config || config.visibility === 'private') return new Response('Not found', { status: 404 });

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

	const fontBuffers = await loadFonts();
	const userInitial = targetUser.username.charAt(0).toUpperCase();

	const svg = buildSvg(
		config.name,
		config.description || '',
		targetUser.username,
		config.base_preset,
		homebrew,
		npm,
		total,
		userInitial
	);

	try {
		const resvg = await Resvg.async(svg, {
			fitTo: { mode: 'width' as const, value: 1200 },
			font: {
				fontBuffers,
				defaultFontFamily: 'Inter',
				sansSerifFamily: 'Inter',
				monospaceFamily: 'Inter',
				defaultFontSize: 16
			}
		});
		const pngData = resvg.render();
		const pngBuffer = pngData.asPng();

		return new Response(pngBuffer, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=3600, s-maxage=3600'
			}
		});
	} catch {
		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=3600, s-maxage=3600'
			}
		});
	}
};
