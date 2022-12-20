# @supabase-cache-helpers/postgrest-mutate

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
