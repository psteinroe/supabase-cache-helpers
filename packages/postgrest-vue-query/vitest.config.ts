import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/*.spec.ts'],
    typecheck: { enabled: true },
    environment: 'happy-dom',
    coverage: {
      provider: 'istanbul',
    },
  },
});
