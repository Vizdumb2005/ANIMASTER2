import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@animaster/shared': path.resolve(__dirname, '../shared/src'),
      '@animaster/server': path.resolve(__dirname, './src'),
    },
  },
});
