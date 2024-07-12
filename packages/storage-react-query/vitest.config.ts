import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    typecheck: { enabled: true },
    environment: 'happy-dom',
    coverage: {
      provider: 'istanbul',
    },
  },
});
