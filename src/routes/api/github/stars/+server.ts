import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Server-side proxy for the repo star count. Browsers used to hit the GitHub
// API directly, which is rate-limited to 60 req/hour per visitor IP — heavy
// traffic from one IP made the count silently disappear. Fetching here and
// caching at the Cloudflare edge means GitHub is hit ~once per hour per colo,
// no matter how many visitors load the page.

const REPO = 'openbootdotdev/openboot';
const CACHE_SECONDS = 3600;
// Shown only if GitHub is unreachable, so the badge always renders something.
const FALLBACK_STARS = 260;

interface GitHubRepo {
	stargazers_count?: number;
}

export const GET: RequestHandler = async () => {
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}`, {
			headers: {
				// GitHub rejects API requests without a User-Agent.
				'User-Agent': 'openboot.dev',
				Accept: 'application/vnd.github+json'
			},
			cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
		} as RequestInit);

		if (res.ok) {
			const data = (await res.json()) as GitHubRepo;
			if (typeof data.stargazers_count === 'number') {
				return json(
					{ stars: data.stargazers_count },
					{ headers: { 'Cache-Control': `public, max-age=${CACHE_SECONDS}` } }
				);
			}
		}
	} catch {
		// fall through to the fallback below
	}

	// Upstream failed or returned an unexpected shape — serve a sane default and
	// retry sooner than the happy-path cache window.
	return json(
		{ stars: FALLBACK_STARS, stale: true },
		{ headers: { 'Cache-Control': 'public, max-age=300' } }
	);
};
