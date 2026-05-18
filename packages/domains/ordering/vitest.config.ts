import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 65,
        statements: 75,
      },
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/dist/**',
        '**/index.ts',
        '**/domain-event.ts',
      ],
    },
  },
});
