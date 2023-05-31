# @supabase-cache-helpers/postgrest-mutate

## 1.0.3

### Patch Changes

- 5071a6f: fix: esm export

## 1.0.2

### Patch Changes

- f4144b2: Updated dependency `eslint` to `8.39.0`.

## 1.0.1

### Patch Changes

- bfc98c5: Updated dependency `tsup` to `6.7.0`.
- 8749572: Updated dependency `ts-jest` to `29.1.0`.
- e51b53e: Updated dependency `typescript` to `5.0.4`.

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

## 0.0.2

### Patch Changes

- 6e54b86: fix: correctly mutate storage cache

## 0.0.1

### Patch Changes

- d1f96f1: initial commit of storage

## 0.2.0

### Minor Changes

- 71da97b: refactor migrations by moving all possible logic into shared package
- f07f548: properly handle an invalid item after it was updated

### Patch Changes

- 6946b2d: upgrade supabase-js and postgrest-js
- Updated dependencies [e27cb35]
- Updated dependencies [71da97b]
- Updated dependencies [6946b2d]
  - @supabase-cache-helpers/postgrest-shared@0.0.3
  - @supabase-cache-helpers/postgrest-filter@0.0.2

## 0.1.0

### Minor Changes

- a2323de: - [BREAKING] Add support for insert many
  - Allow defining the select query on mutations
  - refactor internal swr mutation functions to prepare for subscriptions
  - move mutation fetchers into common postgrest-fetcher lib

### Patch Changes

- Updated dependencies [a2323de]
  - @supabase-cache-helpers/postgrest-shared@0.0.2

## 0.0.1

### Patch Changes

- a63f516: Initial Release
- Updated dependencies [a63f516]
  - @supabase-cache-helpers/postgrest-shared@0.0.1
