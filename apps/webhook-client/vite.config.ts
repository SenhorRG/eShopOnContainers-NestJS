import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(dir, '../..'),
  server: { port: 5174 },
  resolve: {
    alias: {
      '@eshop/ui': path.resolve(dir, '../../packages/infrastructure/ui/src/index.ts'),
    },
  },
});
