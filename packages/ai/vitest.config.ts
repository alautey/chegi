import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@chegi/engine': path.resolve(__dirname, '../engine/src/index.ts'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});
