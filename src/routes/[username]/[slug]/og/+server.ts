import type { RequestHandler } from './$types';
import { Resvg } from '@cf-wasm/resvg';

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
	total: number
): string {
	const W = 1200;
	const H = 630;
	const pad = 48;

	let tagsSvg = '';
	let curX = pad;
	let curY = 180;
	const tagH = 28;
	const tagGap = 8;
	const tagPadX = 14;
	const maxY = H - 70;
	const charW = 8.4;

	function addGroup(label: string, count: number, pkgs: { name: string }[], color: string) {
		if (curY > maxY) return;
		tagsSvg += `<text x="${pad}" y="${curY}" fill="#555" font-size="11" font-family="monospace" letter-spacing="1.5">${label} · ${count}</text>`;
		curY += 20;
		curX = pad;

		for (let i = 0; i < pkgs.length; i++) {
			if (curY > maxY) {
				tagsSvg += `<text x="${curX}" y="${curY + 18}" fill="#555" font-size="13" font-family="sans-serif">+${pkgs.length - i} more</text>`;
				curY += tagH + tagGap;
				return;
			}

			const text = pkgs[i].name;
			const tw = text.length * charW + tagPadX * 2;

			if (curX + tw > W - pad && curX !== pad) {
				curX = pad;
				curY += tagH + tagGap;
				if (curY > maxY) {
					tagsSvg += `<text x="${curX}" y="${curY + 18}" fill="#555" font-size="13" font-family="sans-serif">+${pkgs.length - i} more</text>`;
					curY += tagH + tagGap;
					return;
				}
			}

			tagsSvg += `<rect x="${curX}" y="${curY}" width="${tw}" height="${tagH}" rx="6" fill="#141414" stroke="#252525" stroke-width="1"/>`;
			tagsSvg += `<text x="${curX + tagPadX}" y="${curY + 18}" fill="${color}" font-size="13" font-family="monospace">${esc(text)}</text>`;
			curX += tw + tagGap;
		}
		curY += tagH + tagGap + 8;
		curX = pad;
	}

	if (homebrew.length > 0) addGroup('HOMEBREW', homebrew.length, homebrew, '#e0e0e0');
	if (npm.length > 0) addGroup('NPM', npm.length, npm, '#22c55e');

	const descLine = description
		? `<text x="${pad}" y="138" fill="#888" font-size="16" font-family="sans-serif">${esc(description.slice(0, 80))}</text>`
		: '';

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
		<rect width="${W}" height="${H}" fill="#0a0a0a"/>
		<defs>
			<radialGradient id="glow" cx="0.2" cy="0.15" r="0.55">
				<stop offset="0%" stop-color="#22c55e" stop-opacity="0.07"/>
				<stop offset="40%" stop-color="#22c55e" stop-opacity="0.03"/>
				<stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
			</radialGradient>
		</defs>
		<rect width="${W}" height="${H}" fill="url(#glow)"/>

		<text x="${pad}" y="76" fill="#22c55e" font-size="28" font-weight="bold" font-family="sans-serif">OpenBoot</text>
		<text x="${pad}" y="112" fill="#ffffff" font-size="28" font-weight="bold" font-family="sans-serif">${esc(name)}</text>
		${descLine}

		<text x="${W - pad}" y="68" fill="#666" font-size="15" font-family="sans-serif" text-anchor="end">@${esc(username)}</text>
		<text x="${W - pad}" y="90" fill="#22c55e" font-size="15" font-family="sans-serif" text-anchor="end">${total} packages</text>

		<line x1="${pad}" y1="158" x2="${W - pad}" y2="158" stroke="#1a1a1a" stroke-width="1"/>

		${tagsSvg}

		<line x1="${pad}" y1="${H - 56}" x2="${W - pad}" y2="${H - 56}" stroke="#1a1a1a" stroke-width="1"/>
		<text x="${pad}" y="${H - 28}" fill="#444" font-size="14" font-family="sans-serif">openboot.dev</text>
		<text x="${W - pad}" y="${H - 28}" fill="#444" font-size="13" font-family="sans-serif" text-anchor="end">${esc(preset)} preset</text>
	</svg>`;
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

	const svg = buildSvg(
		config.name,
		config.description || '',
		targetUser.username,
		config.base_preset,
		homebrew,
		npm,
		total
	);

	try {
		const resvg = await Resvg.async(svg, { fitTo: { mode: 'width' as const, value: 1200 } });
		const pngData = resvg.render();
		const pngBuffer = pngData.asPng();

		return new Response(pngBuffer, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=86400, s-maxage=86400'
			}
		});
	} catch {
		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=86400, s-maxage=86400'
			}
		});
	}
};
