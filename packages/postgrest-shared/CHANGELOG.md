# @supabase-cache-helpers/postgrest-shared

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

## 0.0.6

### Patch Changes

- 681b30a: fix: type guard and export types

## 0.0.5

### Patch Changes

- da10f5e: upgrade postgrest-js to 1.1.0

## 0.0.4

### Patch Changes

- 43c9221: upgrade supabase client packages

## 0.0.3

### Patch Changes

- e27cb35: change default schema name to public
- 71da97b: refactor migrations by moving all possible logic into shared package
- 6946b2d: upgrade supabase-js and postgrest-js

## 0.0.2

### Patch Changes

- a2323de: - [BREAKING] Add support for insert many
  - Allow defining the select query on mutations
  - refactor internal swr mutation functions to prepare for subscriptions
  - move mutation fetchers into common postgrest-fetcher lib

## 0.0.1

### Patch Changes

- a63f516: Initial Release
