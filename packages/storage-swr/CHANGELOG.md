# @supabase-cache-helpers/storage-swr

## 1.0.13

### Patch Changes

- 6b1f00c: fix: type configuration parameter and add tests for fallbackData
- 2f1d3cb: refactor: merge internal packages into one core package per product
- Updated dependencies [2f1d3cb]
  - @supabase-cache-helpers/storage-core@0.0.1

## 1.0.12

### Patch Changes

- db307d6: fix: swr types

## 1.0.11

### Patch Changes

- ad7efb0: chore: upgrade supabase to latest
- Updated dependencies [ad7efb0]
  - @supabase-cache-helpers/storage-fetcher@1.0.9

## 1.0.10

### Patch Changes

- 5acf83a: Fix types for mjs when using "moduleResolution" other then "node" (node16, nodenext, bundler)
- Updated dependencies [5acf83a]
  - @supabase-cache-helpers/storage-fetcher@1.0.8
  - @supabase-cache-helpers/storage-mutate@1.0.4

## 1.0.9

### Patch Changes

- Updated dependencies [9fd9f7e]
  - @supabase-cache-helpers/storage-fetcher@1.0.7

## 1.0.8

### Patch Changes

- f83106b: refactor: minor internal refactorings and increase test cov

## 1.0.7

### Patch Changes

- 13540fb: refactor: drop lodash to properly support esm
- Updated dependencies [13540fb]
  - @supabase-cache-helpers/storage-fetcher@1.0.6

## 1.0.6

### Patch Changes

- 5071a6f: fix: esm export
- Updated dependencies [5071a6f]
  - @supabase-cache-helpers/storage-fetcher@1.0.5
  - @supabase-cache-helpers/storage-mutate@1.0.3

## 1.0.5

### Patch Changes

- f4144b2: Updated dependency `eslint` to `8.39.0`.
- 6371dac: Updated dependency `@types/react` to `18.2.0`.
- Updated dependencies [f4144b2]
  - @supabase-cache-helpers/storage-fetcher@1.0.4
  - @supabase-cache-helpers/storage-mutate@1.0.2

## 1.0.4

### Patch Changes

- 85a949c: fix: allow all possible data types for upload
- 8749572: Updated dependency `ts-jest` to `29.1.0`.
- 164dd15: Updated dependency `@supabase/supabase-js` to `2.21.0`.
  Updated dependency `@supabase/postgrest-js` to `1.6.0`.
  Updated dependency `@supabase/storage-js` to `2.5.1`.
- e51b53e: Updated dependency `typescript` to `5.0.4`.
- df1b4f4: Updated dependency `@testing-library/react` to `14.0.0`.
- Updated dependencies [85a949c]
- Updated dependencies [bfc98c5]
- Updated dependencies [8749572]
- Updated dependencies [164dd15]
- Updated dependencies [e51b53e]
  - @supabase-cache-helpers/storage-fetcher@1.0.3
  - @supabase-cache-helpers/storage-mutate@1.0.1

## 1.0.3

### Patch Changes

- 1ffb152: fix upload file input type to be either filelist or array of file and array buffer
- Updated dependencies [1ffb152]
  - @supabase-cache-helpers/storage-fetcher@1.0.2

## 1.0.2

### Patch Changes

- Updated dependencies [893145e]
  - @supabase-cache-helpers/storage-fetcher@1.0.1

## 1.0.1

### Patch Changes

- f0276c8: fix: readme formatting and add metadata

## 1.0.0

### Major Changes

- f73321d: The first major release of Supabase Cache Helpers is the result of months of testing in a production environment followed by a rewrite of large parts of the codebase. While the API stayed mostly the same, internals are more stable and powerful now.

  - Removed "mode" from insert and upsert mutations and only allow upsert([myItem]).
  - The query string is now dereived from the current cache keys before executing a mutation to fix issues with automatic cache updates.
  - Respect orderBy and pageSize in mutations to ensure proper sorting and pagination.
  - Added ordering to query key and exported explicit return types for hooks.
  - Use `PostgrestBuilder` or `PostgrestTransformBuilder` as parameter throughout and improve type inferrence.
  - Transform input into the format expected by cache key before mutation to update cache with mapped paths.
  - Allowed custom merge function for upsert mutation
  - throw type error if user tries to `select('*')`.
  - Introduced Tanstack query v1 (without infinite query support).
  - Improved support for storage in React Native.
  - Replaced use-mutation with useSWRMutation
  - Added demo and standalone docs.

  Checkout the new docs and get started!

### Patch Changes

- Updated dependencies [f73321d]
  - @supabase-cache-helpers/storage-fetcher@1.0.0
  - @supabase-cache-helpers/storage-mutate@1.0.0

## 0.1.4

### Patch Changes

- Updated dependencies [6e54b86]
  - @supabase-cache-helpers/storage-fetcher@0.1.2
  - @supabase-cache-helpers/storage-mutate@0.0.2

## 0.1.3

### Patch Changes

- 397e8cf: fix: export types

## 0.1.2

### Patch Changes

- c59819c: chore: fix eslint settings and run --fix
- Updated dependencies [c59819c]
  - @supabase-cache-helpers/storage-fetcher@0.1.1

## 0.1.1

### Patch Changes

- 2a414d1: refactor: return undefined instead of null for empty results

## 0.1.0

### Minor Changes

- ec5289c: refactor(storage): build upload path using an overwriteable fn

  BREAKING: the second arg of useUpload, path, has been removed in favor of config.buildFileName

### Patch Changes

- Updated dependencies [ec5289c]
  - @supabase-cache-helpers/storage-fetcher@0.1.0

## 0.0.3

### Patch Changes

- 6330158: docs: add peer deps to installation instrutions

## 0.0.2

### Patch Changes

- 4ad9ffe: add imports to doc snippets
- da10f5e: upgrade postgrest-js to 1.1.0
- Updated dependencies [da10f5e]
  - @supabase-cache-helpers/storage-fetcher@0.0.2

## 0.0.1

### Patch Changes

- d1f96f1: initial commit of storage
- Updated dependencies [d1f96f1]
  - @supabase-cache-helpers/storage-fetcher@0.0.1
  - @supabase-cache-helpers/storage-mutate@0.0.1
