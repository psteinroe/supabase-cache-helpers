import base from './vitest.config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['tests/integration/**/*.spec.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
