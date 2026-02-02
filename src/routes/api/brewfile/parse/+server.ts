import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ParseResult {
	packages: string[];
	taps: string[];
	casks: string[];
	formulas: string[];
}

export const POST: RequestHandler = async ({ request }) => {
	const { content } = await request.json();

	if (!content || typeof content !== 'string') {
		return json({ error: 'Brewfile content required' }, { status: 400 });
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
