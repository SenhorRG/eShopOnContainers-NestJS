import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    testTimeout: 120000,
    hookTimeout: 120000,
    fileParallelism: false,
    include: ['test/**/*.integration.spec.ts', 'src/**/*.integration.spec.ts'],
  },
});
