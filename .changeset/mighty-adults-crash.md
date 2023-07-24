---
"@supabase-cache-helpers/postgrest-swr": patch
---

fix: set hasMore to false if isValidating or last page != pageSize to prevent infinite loop when rendering
