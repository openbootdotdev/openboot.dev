import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [
			'src/routes/api/health/**/*.test.ts',
			'src/lib/server/auth.test.ts',
			'src/lib/server/db/configs.test.ts',
			'src/routes/api/configs/server.test.ts',
			'src/routes/api/configs/[slug]/server.test.ts',
			'src/routes/api/configs/[slug]/revisions/server.test.ts',
			'src/routes/api/auth/cli/poll/server.test.ts',
			'src/routes/api/auth/cli/start/server.test.ts',
			'src/routes/api/auth/cli/approve/server.test.ts',
			'src/routes/[username]/[slug]/install/server.test.ts',
			'src/routes/[username]/[slug]/config/server.test.ts',
			'src/smoke-tests/**/*.test.ts',
			'node_modules/**'
		],
		globals: true,
		environment: 'happy-dom',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'src/lib/test/', '**/*.d.ts', '**/*.config.*', '**/mockData', 'build/']
		}
	}
});
