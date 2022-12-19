# @supabase-cache-helpers/postgrest-swr

## 0.4.16

### Patch Changes

- 8848fa1: fix: upgrade swr to v2

## 0.4.15

### Patch Changes

- 4841493: fix: undo filter

## 0.4.14

### Patch Changes

- ec9baba: fix: mutate fn

## 0.4.13

### Patch Changes

- 681b30a: fix: type guard and export types
- Updated dependencies [681b30a]
  - @supabase-cache-helpers/postgrest-shared@0.0.6
  - @supabase-cache-helpers/postgrest-mutate@0.3.5

## 0.4.12

### Patch Changes

- 397e8cf: fix: export types

## 0.4.11

### Patch Changes

- c0fc2e5: fix: add missing export

## 0.4.10

### Patch Changes

- 53b0c0c: refactor and expose underlying cache operations

## 0.4.9

### Patch Changes

- 7d8ad05: fix: check for null before passing query to PostgrestParser

## 0.4.8

### Patch Changes

- 233483f: feat: return bound mutate for useInfiniteScrollQuery and usePaginationQuery

## 0.4.7

### Patch Changes

- Updated dependencies [e4cf514]
  - @supabase-cache-helpers/postgrest-filter@0.1.4
  - @supabase-cache-helpers/postgrest-mutate@0.3.4

## 0.4.6

### Patch Changes

- c59819c: chore: fix eslint settings and run --fix
- Updated dependencies [c59819c]
- Updated dependencies [2d0bd75]
  - @supabase-cache-helpers/postgrest-filter@0.1.3
  - @supabase-cache-helpers/postgrest-mutate@0.3.3

## 0.4.5

### Patch Changes

- Updated dependencies [8050bc5]
  - @supabase-cache-helpers/postgrest-filter@0.1.2
  - @supabase-cache-helpers/postgrest-mutate@0.3.2

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
