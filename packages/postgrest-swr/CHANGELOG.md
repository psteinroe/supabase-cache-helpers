# @supabase-cache-helpers/postgrest-swr

## 0.4.4

### Patch Changes

- 07ae250: fix: expose isLoading and export types from postgrest-shared

## 0.4.3

### Patch Changes

- Updated dependencies [32539c4]
  - @supabase-cache-helpers/postgrest-filter@0.1.1
  - @supabase-cache-helpers/postgrest-mutate@0.3.1

## 0.4.2

### Patch Changes

- 1ee893e: feat: allow PostgresTransformBuilder
- Updated dependencies [1ee893e]
  - @supabase-cache-helpers/postgrest-fetcher@0.1.5

## 0.4.1

### Patch Changes

- 9a36fc4: docs: add primaryKeys to useInsertMutation

## 0.4.0

### Minor Changes

- 0584735: refactor: simplify types and use upsert for insert and update mutations

### Patch Changes

- 6330158: docs: add peer deps to installation instrutions
- Updated dependencies [0584735]
  - @supabase-cache-helpers/postgrest-filter@0.1.0
  - @supabase-cache-helpers/postgrest-mutate@0.3.0
  - @supabase-cache-helpers/postgrest-fetcher@0.1.4

## 0.3.1

### Patch Changes

- 4ad9ffe: add imports to doc snippets
- da10f5e: upgrade postgrest-js to 1.1.0
- Updated dependencies [da10f5e]
  - @supabase-cache-helpers/postgrest-fetcher@0.1.3
  - @supabase-cache-helpers/postgrest-filter@0.0.4
  - @supabase-cache-helpers/postgrest-mutate@0.2.2
  - @supabase-cache-helpers/postgrest-shared@0.0.5

## 0.3.0

### Minor Changes

- c94a35e: upgrade swr to v2

### Patch Changes

- abfd80a: improve test coverage
- 43c9221: upgrade supabase client packages
- Updated dependencies [abfd80a]
- Updated dependencies [43c9221]
  - @supabase-cache-helpers/postgrest-filter@0.0.3
  - @supabase-cache-helpers/postgrest-fetcher@0.1.2
  - @supabase-cache-helpers/postgrest-mutate@0.2.1
  - @supabase-cache-helpers/postgrest-shared@0.0.4

## 0.2.0

### Minor Changes

- e27cb35: add useSubscription and useSubscriptionQuery hooks
- 71da97b: refactor migrations by moving all possible logic into shared package
- f07f548: properly handle an invalid item after it was updated

### Patch Changes

- 6946b2d: upgrade supabase-js and postgrest-js
- 6e1b64b: do not apply filter when removing, since removal is done by primary keys anyways
- Updated dependencies [e27cb35]
- Updated dependencies [71da97b]
- Updated dependencies [6946b2d]
- Updated dependencies [f07f548]
  - @supabase-cache-helpers/postgrest-shared@0.0.3
  - @supabase-cache-helpers/postgrest-mutate@0.2.0
  - @supabase-cache-helpers/postgrest-filter@0.0.2
  - @supabase-cache-helpers/postgrest-fetcher@0.1.1

## 0.1.0

### Minor Changes

- a2323de: - [BREAKING] Add support for insert many
  - Allow defining the select query on mutations
  - refactor internal swr mutation functions to prepare for subscriptions
  - move mutation fetchers into common postgrest-fetcher lib

### Patch Changes

- Updated dependencies [a2323de]
  - @supabase-cache-helpers/postgrest-fetcher@0.1.0
  - @supabase-cache-helpers/postgrest-mutate@0.1.0
  - @supabase-cache-helpers/postgrest-shared@0.0.2

## 0.0.1

### Patch Changes

- a63f516: Initial Release
- Updated dependencies [a63f516]
  - @supabase-cache-helpers/postgrest-fetcher@0.0.1
  - @supabase-cache-helpers/postgrest-filter@0.0.1
  - @supabase-cache-helpers/postgrest-mutate@0.0.1
  - @supabase-cache-helpers/postgrest-shared@0.0.1
