import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    poolOptions: { thread: { singleThread: true } },
    typecheck: { enabled: true },
    environment: 'happy-dom',
    coverage: {
      provider: 'istanbul',
    },
  },
});
