import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	throw new Error('Sentry test error — safe to ignore');
};
