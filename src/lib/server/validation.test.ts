import { describe, it, expect } from 'vitest';
import { validateCustomScript, validateDotfilesRepo, validateReturnTo } from './validation';

describe('validateCustomScript', () => {
	it('should accept null or undefined', () => {
		expect(validateCustomScript(null).valid).toBe(true);
		expect(validateCustomScript(undefined).valid).toBe(true);
	});

	it('should accept empty string', () => {
		expect(validateCustomScript('').valid).toBe(true);
	});

	it('should accept valid short script', () => {
		const script = 'echo "Hello"\nmkdir -p ~/projects';
		const result = validateCustomScript(script);

		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should accept script up to 10000 characters', () => {
		const script = 'a'.repeat(10000);
		const result = validateCustomScript(script);

		expect(result.valid).toBe(true);
	});

	it('should reject script over 10000 characters', () => {
		const script = 'a'.repeat(10001);
		const result = validateCustomScript(script);

		expect(result.valid).toBe(false);
		expect(result.error).toContain('less than 10,000 characters');
	});

	it('should reject non-string input', () => {
		const result = validateCustomScript(123 as any);

		expect(result.valid).toBe(false);
		expect(result.error).toContain('must be a string');
	});

	it('should reject script with null bytes', () => {
		const script = 'echo "test"\x00rm -rf /';
		const result = validateCustomScript(script);

		expect(result.valid).toBe(false);
		expect(result.error).toContain('invalid characters');
	});

	it('should accept script with newlines and special shell characters', () => {
		const script = 'echo "Hello $USER"\n[ -d ~/.config ] && echo "exists"';
		const result = validateCustomScript(script);

		expect(result.valid).toBe(true);
	});
});

describe('validateDotfilesRepo', () => {
	it('should accept null, undefined, or empty string', () => {
		expect(validateDotfilesRepo(null).valid).toBe(true);
		expect(validateDotfilesRepo(undefined).valid).toBe(true);
		expect(validateDotfilesRepo('').valid).toBe(true);
	});

	it('should accept valid GitHub HTTPS URL', () => {
		const result = validateDotfilesRepo('https://github.com/user/dotfiles.git');

		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('should accept valid GitHub URL without .git extension', () => {
		const result = validateDotfilesRepo('https://github.com/user/dotfiles');

		expect(result.valid).toBe(true);
	});

	it('should accept valid GitLab URL', () => {
		const result = validateDotfilesRepo('https://gitlab.com/user/dotfiles.git');

		expect(result.valid).toBe(true);
	});

	it('should accept valid Bitbucket URL', () => {
		const result = validateDotfilesRepo('https://bitbucket.org/user/dotfiles.git');

		expect(result.valid).toBe(true);
	});

	it('should accept valid Codeberg URL', () => {
		const result = validateDotfilesRepo('https://codeberg.org/user/dotfiles.git');

		expect(result.valid).toBe(true);
	});

	it('should accept URLs with hyphens and underscores', () => {
		const result = validateDotfilesRepo('https://github.com/my-user/my_dotfiles-repo.git');

		expect(result.valid).toBe(true);
	});

	it('should accept URLs with org paths', () => {
		const result = validateDotfilesRepo('https://github.com/organization/team/dotfiles.git');

		expect(result.valid).toBe(true);
	});

	it('should reject non-HTTPS URLs', () => {
		const result = validateDotfilesRepo('http://github.com/user/dotfiles.git');

		expect(result.valid).toBe(false);
		expect(result.error).toContain('must use HTTPS');
	});

	it('should reject SSH URLs', () => {
		const result = validateDotfilesRepo('git@github.com:user/dotfiles.git');

		expect(result.valid).toBe(false);
		expect(result.error).toContain('must use HTTPS');
	});

	it('should reject non-string input', () => {
		const result = validateDotfilesRepo(123 as any);

		expect(result.valid).toBe(false);
		expect(result.error).toContain('must be a string');
	});

	it('should reject URL over 500 characters', () => {
		const url = 'https://github.com/' + 'a'.repeat(500);
		const result = validateDotfilesRepo(url);

		expect(result.valid).toBe(false);
		expect(result.error).toContain('too long');
	});

	it('should reject disallowed hosts', () => {
		const result = validateDotfilesRepo('https://example.com/user/dotfiles.git');

		expect(result.valid).toBe(false);
		expect(result.error).toContain('GitHub, GitLab, Bitbucket, or Codeberg');
	});



	it('should reject URLs with double slashes in path', () => {
		const result = validateDotfilesRepo('https://github.com/user//dotfiles.git');

		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it('should reject URLs with special characters in path', () => {
		const result = validateDotfilesRepo('https://github.com/user/dotfiles<script>.git');

		expect(result.valid).toBe(false);
		expect(result.error).toContain('Invalid dotfiles repo URL format');
	});

	it('should reject malformed URLs', () => {
		const result = validateDotfilesRepo('not-a-url');

		expect(result.valid).toBe(false);
		expect(result.error).toContain('must use HTTPS');
	});

	it('should be case-insensitive for hostnames', () => {
		const result = validateDotfilesRepo('https://GitHub.com/user/dotfiles.git');

		expect(result.valid).toBe(true);
	});
});

describe('validateReturnTo', () => {
	it('should reject null or undefined', () => {
		expect(validateReturnTo(null)).toBe(false);
		expect(validateReturnTo(undefined)).toBe(false);
	});

	it('should reject non-string input', () => {
		expect(validateReturnTo(123 as any)).toBe(false);
	});

	it('should accept valid root path', () => {
		expect(validateReturnTo('/')).toBe(true);
	});

	it('should accept valid paths', () => {
		expect(validateReturnTo('/dashboard')).toBe(true);
		expect(validateReturnTo('/docs/quick-start')).toBe(true);
		expect(validateReturnTo('/user/config')).toBe(true);
	});

	it('should accept paths with hyphens and underscores', () => {
		expect(validateReturnTo('/my-page')).toBe(true);
		expect(validateReturnTo('/my_page')).toBe(true);
		expect(validateReturnTo('/my-page/sub_page')).toBe(true);
	});

	it('should accept paths with query strings', () => {
		expect(validateReturnTo('/cli-auth?code=ABC123')).toBe(true);
		expect(validateReturnTo('/page?foo=bar&baz=qux')).toBe(true);
	});

	it('should accept paths with URL-encoded query params', () => {
		expect(validateReturnTo('/page?param=%20space')).toBe(true);
	});

	it('should reject paths not starting with /', () => {
		expect(validateReturnTo('dashboard')).toBe(false);
		expect(validateReturnTo('relative/path')).toBe(false);
	});

	it('should reject protocol-relative URLs', () => {
		expect(validateReturnTo('//evil.com/steal')).toBe(false);
		expect(validateReturnTo('///path')).toBe(false);
	});

	it('should reject paths with absolute URLs', () => {
		expect(validateReturnTo('http://evil.com')).toBe(false);
		expect(validateReturnTo('https://evil.com')).toBe(false);
	});

	it('should reject paths with special characters', () => {
		expect(validateReturnTo('/page<script>')).toBe(false);
		expect(validateReturnTo('/page;alert(1)')).toBe(false);
		expect(validateReturnTo('/page#fragment')).toBe(false);
	});

	it('should reject empty string', () => {
		expect(validateReturnTo('')).toBe(false);
	});

	it('should accept common use cases', () => {
		expect(validateReturnTo('/cli-auth?code=ABCD1234')).toBe(true);
		expect(validateReturnTo('/dashboard')).toBe(true);
		expect(validateReturnTo('/docs/config-options')).toBe(true);
		expect(validateReturnTo('/user/my-config')).toBe(true);
	});
});
