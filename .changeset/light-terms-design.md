---
"@supabase-cache-helpers/postgrest-mutate": patch
---

- do not mutate if input has only paths of query
- fix single upsert mutation to return old data instead of null if new data does not match filter
