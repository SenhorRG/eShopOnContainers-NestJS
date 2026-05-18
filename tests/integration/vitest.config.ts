import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['**/*.spec.ts'],
    testTimeout: 180_000,
    hookTimeout: 180_000,
    pool: 'forks',
    maxWorkers: 1,
  },
});
