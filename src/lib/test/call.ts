import { env } from 'cloudflare:test';

type Handler = (event: any) => Response | Promise<Response>;

type CallOpts = {
	url: string;
	method?: string;
	token?: string;
	headers?: Record<string, string>;
	body?: unknown | string;
	cookies?: Record<string, string>;
	route?: { id: string };
	clientAddress?: string;
	params?: Record<string, string>;
};

/**
 * Minimal RequestEvent builder for invoking SvelteKit `+server.ts` handlers
 * directly inside the Workers runtime, with `env` from `cloudflare:test`.
 */
export function call(handler: Handler, opts: CallOpts): Promise<Response> {
	const headers: Record<string, string> = { ...(opts.headers ?? {}) };
	if (opts.token) headers['authorization'] = `Bearer ${opts.token}`;
	if (opts.body !== undefined && typeof opts.body !== 'string' && !headers['content-type']) {
		headers['content-type'] = 'application/json';
	}

	const body =
		opts.body === undefined ? undefined : typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);

	const request = new Request(opts.url, { method: opts.method ?? 'GET', headers, body });
	const cookieStore = { ...(opts.cookies ?? {}) };
	const cookies = {
		get: (n: string) => cookieStore[n],
		set: (n: string, v: string) => {
			cookieStore[n] = v;
		},
		delete: (n: string) => {
			delete cookieStore[n];
		},
		getAll: () => Object.entries(cookieStore).map(([name, value]) => ({ name, value })),
		serialize: () => ''
	};

	return Promise.resolve(
		handler({
			request,
			platform: { env },
			url: new URL(opts.url),
			route: opts.route ?? { id: '' },
			params: opts.params ?? {},
			locals: {},
			isDataRequest: false,
			isSubRequest: false,
			cookies,
			getClientAddress: () => opts.clientAddress ?? '127.0.0.1',
			fetch: globalThis.fetch
		})
	);
}
