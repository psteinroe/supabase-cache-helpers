# @supabase-cache-helpers/postgrest-swr

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
