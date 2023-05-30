# @supabase-cache-helpers/postgrest-mutate

## 1.0.10

### Patch Changes

- 4738b7f: fix: expose `mutate` option on upsert cache item

## 1.0.9

### Patch Changes

- 2df9bab: fix: parse date strings to time values

## 1.0.8

### Patch Changes

- f4144b2: Updated dependency `eslint` to `8.39.0`.
- Updated dependencies [a199ffb]
- Updated dependencies [f4144b2]
  - @supabase-cache-helpers/postgrest-filter@1.0.6
  - @supabase-cache-helpers/postgrest-shared@1.0.3

## 1.0.7

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

## 1.0.6

### Patch Changes

- Updated dependencies [cc4df33]
  - @supabase-cache-helpers/postgrest-filter@1.0.4

## 1.0.5

### Patch Changes

- 429a86d: - do not mutate if input has only paths of query
  - fix single upsert mutation to return old data instead of null if new data does not match filter

## 1.0.4

### Patch Changes

- 4d16f00: only mutate with pks only, if the key either does not fitler on pks, or the input matches all pk filters
- Updated dependencies [4d16f00]
  - @supabase-cache-helpers/postgrest-filter@1.0.3

## 1.0.3

### Patch Changes

- f4bc48c: allow cache updates also for inputs that contain values for all pkeys of the table
- Updated dependencies [0a199ba]
  - @supabase-cache-helpers/postgrest-shared@1.0.1

## 1.0.2

### Patch Changes

- Updated dependencies [ff81d5b]
  - @supabase-cache-helpers/postgrest-filter@1.0.2

## 1.0.1

### Patch Changes

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

## 0.3.6

### Patch Changes

- c264783: fixes a bug when mutating inifnite queries

## 0.3.5

### Patch Changes

- Updated dependencies [681b30a]
  - @supabase-cache-helpers/postgrest-shared@0.0.6

## 0.3.4

### Patch Changes

- Updated dependencies [e4cf514]
  - @supabase-cache-helpers/postgrest-filter@0.1.4

## 0.3.3

### Patch Changes

- c59819c: chore: fix eslint settings and run --fix
- 2d0bd75: fix: loosen mutation gating for upsert and delete
- Updated dependencies [c59819c]
  - @supabase-cache-helpers/postgrest-filter@0.1.3

## 0.3.2

### Patch Changes

- Updated dependencies [8050bc5]
  - @supabase-cache-helpers/postgrest-filter@0.1.2

## 0.3.1

### Patch Changes

- Updated dependencies [32539c4]
  - @supabase-cache-helpers/postgrest-filter@0.1.1

## 0.3.0

### Minor Changes

- 0584735: refactor: simplify types and use upsert for insert and update mutations

### Patch Changes

- Updated dependencies [0584735]
  - @supabase-cache-helpers/postgrest-filter@0.1.0

## 0.2.2

### Patch Changes

- da10f5e: upgrade postgrest-js to 1.1.0
- Updated dependencies [da10f5e]
  - @supabase-cache-helpers/postgrest-filter@0.0.4
  - @supabase-cache-helpers/postgrest-shared@0.0.5

## 0.2.1

### Patch Changes

- 43c9221: upgrade supabase client packages
- Updated dependencies [abfd80a]
- Updated dependencies [43c9221]
  - @supabase-cache-helpers/postgrest-filter@0.0.3
  - @supabase-cache-helpers/postgrest-shared@0.0.4

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
