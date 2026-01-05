import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'transforms/migrate-query-hooks': 'src/transforms/migrate-query-hooks.ts',
    'transforms/migrate-mutation-hooks':
      'src/transforms/migrate-mutation-hooks.ts',
    'transforms/migrate-subscription-hooks':
      'src/transforms/migrate-subscription-hooks.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
