import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '$lib/server/rate-limit';

interface ParseResult {
	packages: string[];
	taps: string[];
	casks: string[];
	formulas: string[];
}

const MAX_CONTENT_LENGTH = 50000;

export const POST: RequestHandler = async ({ request }) => {
	const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
	const rl = checkRateLimit(getRateLimitKey('brewfile-parse', clientIp), RATE_LIMITS.SEARCH);
	if (!rl.allowed) {
		return json({ error: 'Too many requests' }, { status: 429 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { content } = body as { content?: unknown };

	if (!content || typeof content !== 'string') {
		return json({ error: 'Brewfile content required' }, { status: 400 });
	}

	if (content.length > MAX_CONTENT_LENGTH) {
		return json({ error: `Brewfile too large (max ${MAX_CONTENT_LENGTH / 1000}KB)` }, { status: 400 });
	}

	const result = parseBrewfile(content);
	return json(result);
};

function parseBrewfile(content: string): ParseResult {
	const lines = content.split('\n');
	const taps: string[] = [];
	const formulas: string[] = [];
	const casks: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const tapMatch = trimmed.match(/^tap\s+["']([^"']+)["']/);
		if (tapMatch) {
			taps.push(tapMatch[1]);
			continue;
		}

		const brewMatch = trimmed.match(/^brew\s+["']([^"']+)["']/);
		if (brewMatch) {
			formulas.push(brewMatch[1]);
			continue;
		}

		const caskMatch = trimmed.match(/^cask\s+["']([^"']+)["']/);
		if (caskMatch) {
			casks.push(caskMatch[1]);
			continue;
		}
	}

	const packages = [...formulas, ...casks];

	return {
		packages,
		taps,
		formulas,
		casks
	};
}
