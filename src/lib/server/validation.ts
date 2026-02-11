interface ValidationResult {
	valid: boolean;
	error?: string;
}

/** Validates custom script: max 10k chars, no null bytes. Base64-encoded at generation time to prevent shell injection. */
export function validateCustomScript(script: string | null | undefined): ValidationResult {
	if (!script) {
		return { valid: true };
	}

	if (typeof script !== 'string') {
		return { valid: false, error: 'Custom script must be a string' };
	}

	if (script.length > 10000) {
		return { valid: false, error: 'Custom script must be less than 10,000 characters' };
	}

	if (script.includes('\x00')) {
		return { valid: false, error: 'Custom script contains invalid characters' };
	}

	return { valid: true };
}

/** Validates dotfiles repo URL: HTTPS only, allowed hosts (github/gitlab/bitbucket/codeberg), valid path, max 500 chars. */
export function validateDotfilesRepo(url: string | null | undefined): ValidationResult {
	if (!url || url === '') {
		return { valid: true };
	}

	if (typeof url !== 'string') {
		return { valid: false, error: 'Dotfiles repo must be a string' };
	}

	if (url.length > 500) {
		return { valid: false, error: 'Dotfiles repo URL is too long' };
	}

	if (!url.startsWith('https://')) {
		return { valid: false, error: 'Dotfiles repo must use HTTPS' };
	}

	try {
		const parsed = new URL(url);
		const hostname = parsed.hostname.toLowerCase();

		const allowedHosts = ['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org'];
		const isAllowed = allowedHosts.includes(hostname);

		if (!isAllowed) {
			return {
				valid: false,
				error: 'Dotfiles repo must be hosted on GitHub, GitLab, Bitbucket, or Codeberg'
			};
		}

		if (parsed.pathname.includes('..') || parsed.pathname.includes('//')) {
			return { valid: false, error: 'Invalid dotfiles repo URL path' };
		}

		if (!/^\/[\w\-\.\/]+(?:\.git)?$/.test(parsed.pathname)) {
			return { valid: false, error: 'Invalid dotfiles repo URL format' };
		}

		return { valid: true };
	} catch {
		return { valid: false, error: 'Invalid dotfiles repo URL' };
	}
}

/** Validates return_to path — prevents open redirect (relative paths only, safe chars).
 *  Allows query strings (needed for cli-auth?code=XXX flow). */
export function validateReturnTo(path: string | null | undefined): boolean {
	if (!path || typeof path !== 'string') {
		return false;
	}

	if (!path.startsWith('/')) {
		return false;
	}

	if (path.startsWith('//')) {
		return false;
	}

	// Allow path + optional query string with safe characters
	return /^\/[a-zA-Z0-9\-_/]*(\?[a-zA-Z0-9\-_=&%]*)?$/.test(path);
}
