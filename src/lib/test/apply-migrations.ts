import { applyD1Migrations, env } from 'cloudflare:test';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		DB: D1Database;
		TEST_MIGRATIONS: D1Migration[];
		JWT_SECRET: string;
		APP_URL: string;
	}
}

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
