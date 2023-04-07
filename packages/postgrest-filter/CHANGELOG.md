# @supabase-cache-helpers/postgrest-filter

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

## 0.1.4

### Patch Changes

- e4cf514: fix: return true in hasPaths if root value is null

## 0.1.3

### Patch Changes

- c59819c: chore: fix eslint settings and run --fix

## 0.1.2

### Patch Changes

- 8050bc5: fix: recursively validate path and properly handle arrays in hasPath

## 0.1.1

### Patch Changes

- 32539c4: fix: bugs with alias resolution

## 0.1.0

### Minor Changes

- 0584735: refactor: simplify types and use upsert for insert and update mutations

## 0.0.4

### Patch Changes

- da10f5e: upgrade postgrest-js to 1.1.0

## 0.0.3

### Patch Changes

- abfd80a: improve test coverage
- 43c9221: upgrade supabase client packages

## 0.0.2

### Patch Changes

- 71da97b: refactor migrations by moving all possible logic into shared package
- 6946b2d: upgrade supabase-js and postgrest-js

## 0.0.1

### Patch Changes

- a63f516: Initial Release
