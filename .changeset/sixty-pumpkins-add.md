---
"@supabase-cache-helpers/postgrest-fetcher": minor
"@supabase-cache-helpers/postgrest-mutate": minor
"@supabase-cache-helpers/postgrest-swr": minor
"@supabase-cache-helpers/postgrest-shared": patch
---

- [BREAKING] Add support for insert many
- Allow defining the select query on mutations
- refactor internal swr mutation functions to prepare for subscriptions
- move mutation fetchers into common postgrest-fetcher lib
