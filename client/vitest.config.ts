import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
      ui: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules', 'dist', '**/*.d.ts']
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
      }
    }
  })
);
