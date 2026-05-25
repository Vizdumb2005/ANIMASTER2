import { defineConfig, configDefaults } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [...configDefaults.exclude, 'dist', '.idea', '.git', '.cache'],
    ui: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [...(configDefaults.coverage.exclude ?? []), 'dist', '**/*.d.ts']
    },
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ['src/setupTests.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true
    },
    watch: true,
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    silent: false,
    showStackTrace: true,
    colors: true
  },
  resolve: {
    alias: {
      '@animaster/shared': path.resolve(__dirname, '../shared/src'),
      '@animaster/server': path.resolve(__dirname, './src')
    }
  }
});
