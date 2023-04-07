# @supabase-cache-helpers/storage-swr

## 0.0.0-next-20230407062427

### Major Changes

- ad228f0: The first major release of Supabase Cache Helpers is the result of months of testing in a production environment followed by a rewrite of large parts of the codebase. While the API stayed mostly the same, internals are more stable and powerful now.

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

- Updated dependencies [ad228f0]
  - @supabase-cache-helpers/storage-fetcher@0.0.0-next-20230407062427
  - @supabase-cache-helpers/storage-mutate@0.0.0-next-20230407062427

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
