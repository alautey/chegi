import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@chegi/engine': path.resolve(__dirname, '../../packages/engine/src/index.ts'),
      '@chegi/ai': path.resolve(__dirname, '../../packages/ai/src/index.ts'),
      '@chegi/server/protocol': path.resolve(__dirname, '../../packages/server/src/protocol.ts'),
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
