# @supabase-cache-helpers/postgrest-react-query

## 1.0.12

### Patch Changes

- Updated dependencies [30fc994]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.9

## 1.0.11

### Patch Changes

- 5071a6f: fix: esm export
- Updated dependencies [5071a6f]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.8
  - @supabase-cache-helpers/postgrest-filter@1.0.7
  - @supabase-cache-helpers/postgrest-mutate@1.0.11
  - @supabase-cache-helpers/postgrest-shared@1.0.4

## 1.0.10

### Patch Changes

- Updated dependencies [4738b7f]
  - @supabase-cache-helpers/postgrest-mutate@1.0.10

## 1.0.9

### Patch Changes

- Updated dependencies [2df9bab]
  - @supabase-cache-helpers/postgrest-mutate@1.0.9

## 1.0.8

### Patch Changes

- f4144b2: Updated dependency `eslint` to `8.39.0`.
- 6371dac: Updated dependency `@types/react` to `18.2.0`.
- Updated dependencies [a199ffb]
- Updated dependencies [f4144b2]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.7
  - @supabase-cache-helpers/postgrest-filter@1.0.6
  - @supabase-cache-helpers/postgrest-mutate@1.0.8
  - @supabase-cache-helpers/postgrest-shared@1.0.3

## 1.0.7

### Patch Changes

- bfc98c5: Updated dependency `tsup` to `6.7.0`.
- 8749572: Updated dependency `ts-jest` to `29.1.0`.
- 164dd15: Updated dependency `@supabase/supabase-js` to `2.21.0`.
  Updated dependency `@supabase/postgrest-js` to `1.6.0`.
  Updated dependency `@supabase/storage-js` to `2.5.1`.
- e51b53e: Updated dependency `typescript` to `5.0.4`.
- df1b4f4: Updated dependency `@testing-library/react` to `14.0.0`.
- Updated dependencies [8749572]
- Updated dependencies [164dd15]
- Updated dependencies [e51b53e]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.6
  - @supabase-cache-helpers/postgrest-filter@1.0.5
  - @supabase-cache-helpers/postgrest-mutate@1.0.7
  - @supabase-cache-helpers/postgrest-shared@1.0.2

## 1.0.6

### Patch Changes

- Updated dependencies [cc4df33]
- Updated dependencies [cc4df33]
  - @supabase-cache-helpers/postgrest-filter@1.0.4
  - @supabase-cache-helpers/postgrest-fetcher@1.0.5
  - @supabase-cache-helpers/postgrest-mutate@1.0.6

## 1.0.5

### Patch Changes

- Updated dependencies [429a86d]
  - @supabase-cache-helpers/postgrest-mutate@1.0.5

## 1.0.4

### Patch Changes

- Updated dependencies [4d16f00]
  - @supabase-cache-helpers/postgrest-filter@1.0.3
  - @supabase-cache-helpers/postgrest-mutate@1.0.4
  - @supabase-cache-helpers/postgrest-fetcher@1.0.4

## 1.0.3

### Patch Changes

- 0a199ba: improve query string type to throw error if there is any '_' within the string. before, it just checked for `query === '_'`
- Updated dependencies [f4bc48c]
- Updated dependencies [0a199ba]
  - @supabase-cache-helpers/postgrest-mutate@1.0.3
  - @supabase-cache-helpers/postgrest-fetcher@1.0.3
  - @supabase-cache-helpers/postgrest-shared@1.0.1

## 1.0.2

### Patch Changes

- f0276c8: fix: readme formatting and add metadata
- Updated dependencies [ff81d5b]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.2
  - @supabase-cache-helpers/postgrest-filter@1.0.2
  - @supabase-cache-helpers/postgrest-mutate@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [c7caff3]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.1
  - @supabase-cache-helpers/postgrest-filter@1.0.1
  - @supabase-cache-helpers/postgrest-mutate@1.0.1

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
  - @supabase-cache-helpers/postgrest-fetcher@1.0.0
  - @supabase-cache-helpers/postgrest-filter@1.0.0
  - @supabase-cache-helpers/postgrest-mutate@1.0.0
  - @supabase-cache-helpers/postgrest-shared@1.0.0
