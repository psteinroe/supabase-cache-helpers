---
"@supabase-cache-helpers/postgrest-fetcher": patch
"@supabase-cache-helpers/postgrest-swr": patch
---

this is a breaking change for the `useCursorInfiniteScroll` hook, because i realised the API I released last week does have significant downsides, and often causes infinte loops. Now, you have put buth `.order()` and `.limit()` on the query yourself. The hook expects a `PostgrestTransformBuilder`, and you can apply the `.result()` transformer, too.
