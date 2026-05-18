import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  resolve: {
    alias: {
      '@eshop/ui': path.resolve(dir, '../../packages/infrastructure/ui/src/index.ts'),
    },
  },
});
