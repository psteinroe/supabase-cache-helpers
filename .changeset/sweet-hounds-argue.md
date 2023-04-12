---
"@supabase-cache-helpers/postgrest-react-query": major
"@supabase-cache-helpers/postgrest-fetcher": major
"@supabase-cache-helpers/postgrest-filter": major
"@supabase-cache-helpers/postgrest-mutate": major
"@supabase-cache-helpers/postgrest-shared": major
"@supabase-cache-helpers/storage-fetcher": major
"@supabase-cache-helpers/storage-mutate": major
"@supabase-cache-helpers/postgrest-swr": major
"@supabase-cache-helpers/storage-swr": major
---

The first major release of Supabase Cache Helpers is the result of months of testing in a production environment followed by a rewrite of large parts of the codebase. While the API stayed mostly the same, internals are more stable and powerful now.

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
