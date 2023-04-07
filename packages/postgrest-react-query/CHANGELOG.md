# @supabase-cache-helpers/postgrest-react-query

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

### Patch Changes

- Updated dependencies [ad228f0]
  - @supabase-cache-helpers/postgrest-fetcher@0.0.0-next-20230407062427
  - @supabase-cache-helpers/postgrest-filter@0.0.0-next-20230407062427
  - @supabase-cache-helpers/postgrest-mutate@0.0.0-next-20230407062427
  - @supabase-cache-helpers/postgrest-shared@0.0.0-next-20230407062427
