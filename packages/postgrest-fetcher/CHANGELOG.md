# @supabase-cache-helpers/postgrest-fetcher

## 1.0.13

### Patch Changes

- ad7efb0: chore: upgrade supabase to latest
- Updated dependencies [ad7efb0]
  - @supabase-cache-helpers/postgrest-filter@1.0.10
  - @supabase-cache-helpers/postgrest-shared@1.0.6

## 1.0.12

### Patch Changes

- 5acf83a: Fix types for mjs when using "moduleResolution" other then "node" (node16, nodenext, bundler)
- Updated dependencies [5acf83a]
  - @supabase-cache-helpers/postgrest-filter@1.0.9
  - @supabase-cache-helpers/postgrest-shared@1.0.5

## 1.0.11

### Patch Changes

- abfd988: fix: expose mutation options from supabase sdk

## 1.0.10

### Patch Changes

- 13540fb: refactor: drop lodash to properly support esm
- Updated dependencies [13540fb]
  - @supabase-cache-helpers/postgrest-filter@1.0.8

## 1.0.9

### Patch Changes

- 30fc994: fix: pagination fetcher limit

## 1.0.8

### Patch Changes

- 5071a6f: fix: esm export
- Updated dependencies [5071a6f]
  - @supabase-cache-helpers/postgrest-filter@1.0.7
  - @supabase-cache-helpers/postgrest-shared@1.0.4

## 1.0.7

### Patch Changes

- a199ffb: fix: dedupe filterrs on aliased paths
- f4144b2: Updated dependency `eslint` to `8.39.0`.
- Updated dependencies [a199ffb]
- Updated dependencies [f4144b2]
  - @supabase-cache-helpers/postgrest-filter@1.0.6
  - @supabase-cache-helpers/postgrest-shared@1.0.3

## 1.0.6

### Patch Changes

- 8749572: Updated dependency `ts-jest` to `29.1.0`.
- 164dd15: Updated dependency `@supabase/supabase-js` to `2.21.0`.
  Updated dependency `@supabase/postgrest-js` to `1.6.0`.
  Updated dependency `@supabase/storage-js` to `2.5.1`.
- e51b53e: Updated dependency `typescript` to `5.0.4`.
- Updated dependencies [8749572]
- Updated dependencies [164dd15]
- Updated dependencies [e51b53e]
  - @supabase-cache-helpers/postgrest-filter@1.0.5
  - @supabase-cache-helpers/postgrest-shared@1.0.2

## 1.0.5

### Patch Changes

- cc4df33: remove unnecessary nested for loop
- Updated dependencies [cc4df33]
  - @supabase-cache-helpers/postgrest-filter@1.0.4

## 1.0.4

### Patch Changes

- Updated dependencies [4d16f00]
  - @supabase-cache-helpers/postgrest-filter@1.0.3

## 1.0.3

### Patch Changes

- 0a199ba: improve query string type to throw error if there is any '_' within the string. before, it just checked for `query === '_'`
- Updated dependencies [0a199ba]
  - @supabase-cache-helpers/postgrest-shared@1.0.1

## 1.0.2

### Patch Changes

- ff81d5b: - fix loadQuery and mutation response to properly work with nested relations and aliases
  - refactor similar logic to be able to share more
- Updated dependencies [ff81d5b]
  - @supabase-cache-helpers/postgrest-filter@1.0.2

## 1.0.1

### Patch Changes

- c7caff3: fix: properly handle nested paths and undefined values when transforming to target schema
- Updated dependencies [c7caff3]
  - @supabase-cache-helpers/postgrest-filter@1.0.1

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
  - @supabase-cache-helpers/postgrest-filter@1.0.0
  - @supabase-cache-helpers/postgrest-shared@1.0.0

## 0.1.5

### Patch Changes

- 1ee893e: feat: allow PostgresTransformBuilder

## 0.1.4

### Patch Changes

- 0584735: refactor: simplify types and use upsert for insert and update mutations

## 0.1.3

### Patch Changes

- da10f5e: upgrade postgrest-js to 1.1.0

## 0.1.2

### Patch Changes

- 43c9221: upgrade supabase client packages

## 0.1.1

### Patch Changes

- 6946b2d: upgrade supabase-js and postgrest-js

## 0.1.0

### Minor Changes

- a2323de: - [BREAKING] Add support for insert many
  - Allow defining the select query on mutations
  - refactor internal swr mutation functions to prepare for subscriptions
  - move mutation fetchers into common postgrest-fetcher lib

## 0.0.1

### Patch Changes

- a63f516: Initial Release
