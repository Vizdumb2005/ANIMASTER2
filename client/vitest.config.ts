import { defineConfig } from 'vitest/config';
import { mergeConfig } from 'vite';
import viteConfig from './vite.config.js';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    // Use the same environment as Vite
    environment: 'jsdom',
    
    // Glob patterns to find test files
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Exclude node_modules and dist
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Enable UI for better test visualization
    ui: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '**/*.d.ts']
    },
    
    // Mock modules as needed
    mockReset: true,
    
    // Clear mocks between tests
    clearMocks: true,
    
    // Restore mocks between tests  
    restoreMocks: true,
    
    // Setup files
    setupFiles: ['src/setupTests.ts'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Enable type checking
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true
    }
  }
}));