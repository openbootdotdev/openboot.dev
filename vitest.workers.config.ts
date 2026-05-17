import { defineConfig } from 'vitest/config';
import { cloudflarePool, cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import path from 'node:path';

// Apply schema migrations only — data migrations (seed/transfer/enrich) reference
// production-specific identities (e.g. real user IDs) and can't run on a clean
// test DB. Tests should seed their own data fixtures.
const allMigrations = await readD1Migrations('./migrations');
const isDml = (q: string) => /^\s*(INSERT|UPDATE|DELETE)\b/i.test(q);
const isDataOnlyMigration = (m: { queries: string[] }) => m.queries.length > 0 && m.queries.every(isDml);
const schemaMigrations = allMigrations.filter((m) => !isDataOnlyMigration(m));

const workersOptions = {
	singleWorker: true,
	miniflare: {
		compatibilityDate: '2025-01-01',
		compatibilityFlags: ['nodejs_compat'],
		d1Databases: ['DB'],
		bindings: {
			TEST_MIGRATIONS: schemaMigrations,
			JWT_SECRET: 'test-jwt-secret-key-32-chars-long',
			APP_URL: 'http://localhost:5173'
		}
	}
};

export default defineConfig({
	plugins: [cloudflareTest(workersOptions)],
	test: {
		include: [
			'src/routes/api/health/**/*.test.ts',
			'src/lib/server/db/configs.test.ts',
			'src/routes/api/configs/server.test.ts',
			'src/routes/api/auth/cli/poll/server.test.ts'
		],
		setupFiles: ['./src/lib/test/apply-migrations.ts'],
		pool: cloudflarePool(workersOptions)
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	}
});
