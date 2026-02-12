/**
 * Test fixtures - mock data for testing
 */

export const mockUser = {
	id: 'user_test123',
	username: 'testuser',
	email: 'test@example.com',
	avatar_url: 'https://example.com/avatar.jpg',
	provider: 'github',
	provider_id: 'github123',
	created_at: '2026-01-01T00:00:00Z'
};

export const mockConfig = {
	id: 'cfg_test123',
	user_id: 'user_test123',
	slug: 'my-config',
	name: 'My Test Config',
	description: 'A test configuration',
	base_preset: 'developer',
	packages: JSON.stringify([
		{ name: 'git', type: 'formula', desc: 'Version control' },
		{ name: 'visual-studio-code', type: 'cask', desc: 'Code editor' }
	]),
	custom_script: 'echo "Hello from custom script"',
	dotfiles_repo: 'https://github.com/testuser/dotfiles',
	snapshot: null,
	alias: 'myconfig',
	visibility: 'unlisted' as const,
	install_count: 0,
	created_at: '2026-01-15T00:00:00Z',
	updated_at: '2026-01-15T00:00:00Z'
};

export const mockPublicConfig = {
	...mockConfig,
	id: 'cfg_public123',
	slug: 'public-config',
	name: 'Public Config',
	visibility: 'public' as const,
	alias: 'publiccfg'
};

export const mockPrivateConfig = {
	...mockConfig,
	id: 'cfg_private123',
	slug: 'private-config',
	name: 'Private Config',
	visibility: 'private' as const,
	alias: 'privatecfg'
};

export const mockApiToken = {
	id: 'tok_test123',
	user_id: 'user_test123',
	token: 'obt_1234567890abcdefghijklmnopqrstuvwxyz',
	name: 'Test Token',
	expires_at: '2027-01-01T00:00:00Z',
	created_at: '2026-01-01T00:00:00Z'
};

export const mockExpiredApiToken = {
	...mockApiToken,
	id: 'tok_expired',
	token: 'obt_expired1234567890abcdefghijklmnopqr',
	expires_at: '2025-01-01T00:00:00Z' // Expired
};

export const mockCliAuthCode = {
	code: 'ABCD1234',
	user_id: null,
	token: null,
	status: 'pending' as const,
	expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
	created_at: new Date().toISOString()
};

export const mockApprovedCliAuthCode = {
	...mockCliAuthCode,
	code: 'APPROVED1',
	user_id: 'user_test123',
	token: 'obt_cli_approved_token_123456789abcdefgh',
	status: 'approved' as const
};

export const mockExpiredCliAuthCode = {
	...mockCliAuthCode,
	code: 'EXPIRED1',
	status: 'expired' as const,
	expires_at: '2025-01-01T00:00:00Z'
};

/**
 * Helper to create a mock Cookies object
 */
export function createMockCookies(cookies: Record<string, string> = {}): any {
	return {
		get: (name: string) => cookies[name],
		set: (name: string, value: string) => {
			cookies[name] = value;
		},
		delete: (name: string) => {
			delete cookies[name];
		},
		getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value }))
	};
}

/**
 * Helper to create a mock Request object
 */
export function createMockRequest(options: {
	method?: string;
	url?: string;
	headers?: Record<string, string>;
	body?: any;
	cookies?: Record<string, string>;
	invalidJSON?: boolean;
	clientIp?: string;
}): Request {
	const {
		method = 'GET',
		url = 'http://localhost:5173',
		headers = {},
		body = null,
		cookies = {},
		invalidJSON = false,
		clientIp
	} = options;

	const headersInit = new Headers(headers);

	if (clientIp && !headersInit.has('cf-connecting-ip')) {
		headersInit.set('cf-connecting-ip', clientIp);
	}

	if (Object.keys(cookies).length > 0) {
		const cookieString = Object.entries(cookies)
			.map(([key, value]) => `${key}=${value}`)
			.join('; ');
		headersInit.set('cookie', cookieString);
	}

	const init: RequestInit = {
		method,
		headers: headersInit
	};

	if (body && method !== 'GET' && method !== 'HEAD') {
		if (invalidJSON) {
			init.body = body;
		} else {
			init.body = typeof body === 'string' ? body : JSON.stringify(body);
		}
		if (!headersInit.has('content-type')) {
			headersInit.set('content-type', 'application/json');
		}
	}

	return new Request(url, init);
}

/**
 * Helper to create mock platform env
 */
export function createMockPlatform(db?: any): App.Platform {
	return {
		env: {
			DB: db || null,
			JWT_SECRET: 'test-jwt-secret-key-32-chars-long',
			GITHUB_CLIENT_ID: 'test-github-client-id',
			GITHUB_CLIENT_SECRET: 'test-github-client-secret',
			GOOGLE_CLIENT_ID: 'test-google-client-id',
			GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
			APP_URL: 'http://localhost:5173'
		},
		context: {
			waitUntil: () => {},
			passThroughOnException: () => {}
		},
		caches: undefined as any,
		cf: undefined as any
	};
}
