---
"@supabase-cache-helpers/postgrest-react-query": patch
"@supabase-cache-helpers/postgrest-fetcher": patch
"@supabase-cache-helpers/postgrest-shared": patch
"@supabase-cache-helpers/postgrest-swr": patch
---

improve query string type to throw error if there is any '_' within the string. before, it just checked for `query === '_'`
