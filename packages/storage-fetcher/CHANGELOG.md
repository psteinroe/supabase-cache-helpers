# @supabase-cache-helpers/storage-fetcher

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

## 0.1.2

### Patch Changes

- 6e54b86: fix: correctly mutate storage cache

## 0.1.1

### Patch Changes

- c59819c: chore: fix eslint settings and run --fix

## 0.1.0

### Minor Changes

- ec5289c: refactor(storage): build upload path using an overwriteable fn

  BREAKING: the second arg of useUpload, path, has been removed in favor of config.buildFileName

## 0.0.2

### Patch Changes

- da10f5e: upgrade postgrest-js to 1.1.0

## 0.0.1

### Patch Changes

- d1f96f1: initial commit of storage
