---
'@supabase-cache-helpers/postgrest-vue-query': minor
---

Add an initial Vue 3 / TanStack Vue Query 5 PostgREST adapter with reactive queries,
typed CRUD mutations and shared-core cache updates. Revalidate bounded, counted
and single-row responses rather than guessing their contents after a mutation.
Isolate mutable builders between requests, reconcile emptied counted pages,
and revalidate both previous and new relation memberships after foreign-key changes.
Add real local Supabase RLS, relationship and pagination integration tests.
Add real Chrome desktop/mobile browser checks and an account-scoped QueryClient
reference page that retires old caches and guards superseded auth transitions.
Reuse the browser suite in Firefox and WebKit as well as Chrome, with engine-aware
version reporting and local browser installation instructions.
Keep native cross-tab Auth locking without Firefox's caught-callback page errors;
check lock contention, timeouts, queued work and operation-error propagation.
