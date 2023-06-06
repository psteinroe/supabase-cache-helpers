---
"@supabase-cache-helpers/storage-fetcher": patch
---

fix: add current timestamp to url if ensureExistence is not true. this will make sure the url is different with every fetch, and the browser will not use the cache
