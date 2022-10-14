# @supabase-cache-helpers/postgrest-mutate

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
