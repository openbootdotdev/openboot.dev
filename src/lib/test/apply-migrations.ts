import { applyD1Migrations, env, type D1Migration } from 'cloudflare:test';
import type { D1Database } from '@cloudflare/workers-types';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		DB: D1Database;
		TEST_MIGRATIONS: D1Migration[];
		JWT_SECRET: string;
		APP_URL: string;
	}
}

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
