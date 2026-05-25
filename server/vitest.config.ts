import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  },
});
