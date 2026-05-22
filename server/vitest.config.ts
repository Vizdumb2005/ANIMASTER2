import { defineConfig } from 'vitest/config';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    // Use Node.js environment for server tests
    environment: 'node',
    
    // Glob patterns to find test files
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Exclude node_modules and dist
    exclude: [...configDefaults.exclude, 'dist', '.idea', '.git', '.cache'],
    
    // Enable UI for better test visualization
    ui: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [...configDefaults.coverage.exclude || [], 'dist', '**/*.d.ts']
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
    },
    
    // Enable watching files
    watch: true,
    
    // Threads configuration
    threads: true,
    
    // Max threads
    maxThreads: 4,
    
    // Min threads  
    minThreads: 1,
    
    // Enable console output
    silent: false,
    
    // Show stack traces
    showStackTrace: true,
    
    // Enable colors in output
    colors: true
  }
});