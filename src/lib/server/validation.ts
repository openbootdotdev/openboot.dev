interface ValidationResult {
	valid: boolean;
	error?: string;
}

/** Reserved aliases that conflict with top-level routes. Used by both hooks.server.ts and config creation. */
export const RESERVED_ALIASES = ['api', 'install', 'dashboard', 'login', 'docs', 'cli-auth', 'explore'] as const;

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

		if (!/^\/[a-zA-Z0-9\-_\.\/]+(?:\.git)?$/.test(parsed.pathname)) {
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

	// Decode first to catch %2F%2F → // bypass attempts
	let decoded: string;
	try {
		decoded = decodeURIComponent(path);
	} catch {
		return false;
	}

	if (!decoded.startsWith('/')) {
		return false;
	}

	if (decoded.startsWith('//')) {
		return false;
	}

	// Allow path + optional query string with safe characters (no % to prevent double-encoding attacks)
	return /^\/[a-zA-Z0-9\-_/]*(\?[a-zA-Z0-9\-_=&]*)?$/.test(decoded);
}

interface Package {
	name: string;
	type: string;
	desc?: string;
}

/** Validates packages array: prevents shell injection in package names.
 *  Package names must match standard package manager formats (alphanumeric, hyphens, underscores, dots, slashes for scoped packages).
 *  Types must be: formula, cask, tap, mas, npm, pip, gem, cargo, go.
 *  Maximum 500 packages per config. */
export function validatePackages(packages: unknown): ValidationResult {
	if (!packages) {
		return { valid: true };
	}

	if (!Array.isArray(packages)) {
		return { valid: false, error: 'Packages must be an array' };
	}

	if (packages.length > 500) {
		return { valid: false, error: 'Maximum 500 packages allowed' };
	}

	const validTypes = ['formula', 'cask', 'tap', 'mas', 'npm', 'pip', 'gem', 'cargo', 'go'];

	for (let i = 0; i < packages.length; i++) {
		const pkg = packages[i];

		if (typeof pkg !== 'object' || pkg === null) {
			return { valid: false, error: `Package at index ${i} must be an object` };
		}

		const { name, type, desc } = pkg as Package;

		if (!name || typeof name !== 'string') {
			return { valid: false, error: `Package at index ${i} must have a string name` };
		}

		if (name.length > 200) {
			return { valid: false, error: `Package name too long at index ${i}` };
		}

		if (!/^[@a-zA-Z0-9._\/-]+$/.test(name)) {
			return {
				valid: false,
				error: `Invalid package name at index ${i}: "${name}". Only alphanumeric, hyphens, underscores, dots, @ and / allowed.`
			};
		}

		if (!type || typeof type !== 'string') {
			return { valid: false, error: `Package at index ${i} must have a string type` };
		}

		if (!validTypes.includes(type)) {
			return {
				valid: false,
				error: `Invalid package type at index ${i}: "${type}". Must be one of: ${validTypes.join(', ')}`
			};
		}

		if (desc !== undefined && (typeof desc !== 'string' || desc.length > 500)) {
			return {
				valid: false,
				error: `Package description at index ${i} must be a string (max 500 chars)`
			};
		}
	}

	return { valid: true };
}
