import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [
			'src/routes/api/health/**/*.test.ts',
			'src/lib/server/db/configs.test.ts',
			'src/routes/api/configs/server.test.ts',
			'src/routes/api/auth/cli/poll/server.test.ts',
			'node_modules/**'
		],
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./src/lib/test/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'src/lib/test/', '**/*.d.ts', '**/*.config.*', '**/mockData', 'build/']
		}
	}
});
