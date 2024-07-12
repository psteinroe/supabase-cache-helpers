import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    typecheck: { enabled: true },
    environment: 'vitest',
    coverage: {
      provider: 'istanbul',
    },
  },
});
