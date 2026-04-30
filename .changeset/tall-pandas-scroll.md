---
"@supabase-cache-helpers/postgrest-swr": patch
---

Expose `hasMore` from `useOffsetInfiniteScrollQuery` so consumers can rely on the hook's internal one-extra-row pagination state instead of count-based approximations.
