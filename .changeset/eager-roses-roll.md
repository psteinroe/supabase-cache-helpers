---
"@supabase-cache-helpers/postgrest-core": minor
"@supabase-cache-helpers/postgrest-swr": major
---

feat: add support for pagination via rpc

**Breaking Changes**
All infinite queries now require the first argument to be a factory function:

Before:
```ts
useOffsetInfiniteQuery(query, ...);
```

Now:
```ts
useOffsetInfiniteQuery(() => query, ...);
```

The reason is that we cannot re-use the same query instance anymore with RPCs.

Also removed some of the long-deprecated aliases.
