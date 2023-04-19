---
"@supabase-cache-helpers/postgrest-mutate": patch
---

- do not mutate if input has only the paths
- fix single upsert mutation to return old data instead of null if new data does not match filter
