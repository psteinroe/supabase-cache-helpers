# PostgREST Vue Query

Vue 3.5 / TanStack Vue Query 5 bindings for Supabase Cache Helpers.
This initial adapter covers PostgREST database queries and mutations only.
It is not yet published; the first release is subject to maintainer review.
It uses the current `postgrest-core` fetchers, filters and cache updates.

## Usage

Install `VueQueryPlugin` from `@tanstack/vue-query` in the application first.
For authenticated applications, also follow the account boundary below; a single
application-wide cache is not safe to reuse across accounts.
Call the composables inside `setup()` or a Vue effect scope with injection context.

```ts
import { ref } from 'vue';
import { useQuery, useInsertMutation } from '@supabase-cache-helpers/postgrest-vue-query';

const active = ref(true);
const page = ref(0);
const { data, count, isPending, error } = useQuery(
  () => supabase.from('items')
    .select('id,name,active', { count: 'exact' })
    .eq('active', active.value)
    .order('id')
    .range(page.value * 20, page.value * 20 + 19),
);

const insert = useInsertMutation(supabase.from('items'), ['id'], 'id,name,active');
await insert.mutateAsync([{ id: 1, name: 'New item', active: true }]);
```

- `useQuery` accepts a builder, a ref/computed builder, or a getter. Use a getter
  or computed for reactive filters and pagination; it must create a fresh builder.
  Config accepts a plain object, ref/computed, or getter. Native reactive `enabled`
  is supported. The adapter owns `queryKey`, `queryFn` and response unwrapping;
  `select` is deliberately not exposed in this initial implementation.
- `data` and `count` are computed refs. The cache and `refetch()` retain the full
  PostgREST response. List, single and maybe-single responses have distinct keys.
  Vue Query owns subscriptions, cancellation and effect-scope disposal.
- `useInsertMutation`, `useUpsertMutation`, `useUpdateMutation`,
  `useDeleteMutation` and `useDeleteManyMutation` follow the React package's
  arguments. Table builder, primary keys, select string and mutation config are
  setup-time values; changing row values go through `mutate` / `mutateAsync`.
  Mutation results are refs and retain selected-column inference.
- Explicit-column, unbounded lists receive core's filter-aware local updates.
  Range/limit queries, counted responses and single-row caches are invalidated
  instead of guessing page boundaries, totals or membership. Active queries
  refetch; inactive/disabled queries remain stale until enabled or fetched.
  Wildcards, aggregates, HEAD and configured related-table revalidation follow
  core behavior. As in the other adapters, isolate clients across auth changes.
- Every mutation uses a fresh table builder, so repeated/concurrent calls cannot
  accumulate primary-key filters or share request headers. Configured
  `revalidateRelations` conservatively invalidates the related table's cached
  queries: the mutation result does not contain the previous foreign key, and
  both old and new parents must reconcile when a child moves.
- A counted list page beyond the last row can receive HTTP 416 / `PGRST103`
  after deletion. Only a valid positive offset/limit with a confirmed numeric
  `Content-Range: */total` is normalized to an empty successful page and that
  total. Missing totals, malformed ranges, single-row requests and other errors
  are not masked. The adapter's normalized response has status 200.

## Account Boundary

The query key describes a PostgREST request, not the current Supabase identity.
RLS protects server responses but cannot remove another user's cached response.
The browser regression reproduces account B seeing account A's fresh cached page
when both reuse one QueryClient, even when the private component is remounted.

- Hide/unmount the private subtree at the **start** of sign-in, sign-out or an
  account switch, not after the network request completes. Do not carry previous
  or placeholder data across this boundary.
- Give each new authenticated subtree a **new QueryClient**, keyed by identity.
  On unmount, unsubscribe, cancel outstanding queries and clear the retired cache.
  `enabled: false`, `invalidateQueries`, or `clear()` on a reused client alone
  is not an identity boundary: a pending mutation can still complete later.
- Keep the retiring composables bound to the retiring client. A mutation already
  accepted by the server is not undone by logout; its late response must never
  update the next account's cache or UI.
- Subscribe to Auth events for initial session restoration and external changes.
  During an explicit transition, guard results with a monotonically increasing
  revision so an older sign-in cannot reopen the page after a newer logout.
  Do not await Auth operations inside `onAuthStateChange` callbacks.
- See the tested `AccountScope`, auth handlers and keyed subtree in
  `tests/browser/page/main.ts`. They are application wiring, not an automatic
  Supabase-auth feature of this SDK-independent adapter. Failed sign-in is not
  equivalent to revoking a previously valid session; session UX remains an
  application responsibility.

## Local checks

From the repository root (Node >=22, pnpm 9):

```sh
pnpm install --frozen-lockfile --ignore-scripts --config.virtual-store-dir-max-length=40
pnpm --filter @supabase-cache-helpers/postgrest-core build
pnpm --filter @supabase-cache-helpers/postgrest-vue-query test
pnpm --filter @supabase-cache-helpers/postgrest-vue-query typecheck
pnpm --filter @supabase-cache-helpers/postgrest-vue-query build
```

The default tests use real PostgREST builders, Vue Query observers and the shared
core with an in-memory HTTP boundary; they do not require Supabase to be running.

### Real Local Supabase Integration

The dedicated fixtures are in `supabase/migrations/20261025000000_vue_query_tests.sql`.
The suite creates two temporary Auth users, exercises anonymous/authenticated
RLS, aliased embeds, foreign-key moves, and filtered pages/HEAD/exact totals after
CRUD. It checks observed data and raw caches against independent authenticated
server queries. User deletion cascades to fixture rows at teardown.

```sh
pnpm --config.virtual-store-dir-max-length=40 rebuild supabase
pnpm exec supabase start -x 'edge-runtime,logflare,vector,studio,imgproxy,postgres-meta,realtime,storage-api,mailpit,supavisor'
pnpm --filter @supabase-cache-helpers/postgrest-vue-query test:integration
pnpm --filter @supabase-cache-helpers/postgrest-core exec vitest run
pnpm exec supabase stop
```

If a local stack already exists without the fixture migration, first use
`pnpm exec supabase migration up --local`; do not reset an existing database.
The test setup reads keys from the local CLI, rejects non-loopback URLs, never
prints credentials, and uses service-role access only for fixture setup/cleanup.
It uses separate QueryClients per identity; auth switching still requires the
application to clear/isolate its cache. Embedded relations hidden by RLS may be
`null` despite non-null foreign keys in upstream PostgREST type inference, so
callers must guard these values. Logged 401/403/406 denials and a 416 boundary
response are intentional assertions, not failing tests.

### Real Browser End-to-End Checks

With the same local stack running and the shared core built:

```sh
pnpm --filter @supabase-cache-helpers/postgrest-vue-query exec playwright install firefox webkit
pnpm --filter @supabase-cache-helpers/postgrest-vue-query test:browser
```

This runs the same suite in four projects: installed **Google Chrome** desktop,
Chrome with Pixel 7 mobile emulation, Playwright **Firefox**, and Playwright
**WebKit** desktop. Mobile emulation is not a real Android device. WebKit on
Windows is an engine check, not validation of the Safari app or a real Apple device.
Chrome must already be installed. The install command downloads the Firefox and
WebKit builds matching the pinned Playwright version into its local browser cache;
`test:browser` does not download or silently skip unavailable browsers.
To run only the added engines, append `--project=firefox --project=webkit` to
`test:browser`; append `--repeat-each=2` for two independent rounds without retries.
The script builds this package first, and the page imports its public ESM export
rather than bypassing the distribution with a source import.
Playwright starts and stops a loopback-only Vite fixture page on port 4173 and
will fail rather than reuse an unknown existing server. No remote host is used.

The six scenarios run unchanged in every project: direct account switching/logout/reload;
a late query; a late committed mutation; pending/failed authentication; superseded
sign-in versus logout; and all five CRUD APIs with cached pagination, ordering,
filters, exact counts, HEAD counts and deletion to zero (including multi-row
delete and empty out-of-range pages). The tests click real controls and compare
rendered rows/counts with independent authenticated server queries. A DOM observer
also checks for brief rows from the wrong owner, not just the final page.

An additional cross-tab test checks exclusive Auth locking, immediate and bounded
acquisition timeouts, queued acquisition, operation-error identity and lock release.
The reference page supplies `auth.lock` using native Web Locks: Firefox 157 reports
rejected native lock callbacks as page errors even when Supabase Auth 2.90 catches
their timeout errors. The helper returns an outcome from the native callback and
throws outside it, preserving cross-tab exclusion and error propagation. It keeps
session persistence and automatic token refresh enabled; page-error assertions are
not filtered. This workaround is reference-page wiring, not adapter production code.

Race tests hold **actual local server responses** with `route.fetch()` rather
than synthesizing rows. Each test gets temporary users and its own browser context;
only the public local URL/anon key and fixture IDs enter the page. Service-role
credentials remain in the Node fixture. Success screenshots and failure artifacts
go under ignored `test-results/browser`; trace/HAR/video capture is disabled to
avoid recording auth credentials. Fixture users and rows are removed at teardown.
The offline, local HTTP and browser scripts remain separate. The repository CI
runs the offline tests as part of the workspace suite, then explicitly runs the
local integration tests and all four browser projects. It installs Chrome and the
Firefox/WebKit builds matching Playwright before running the browser tests.

Not included: Storage, realtime subscriptions, infinite-query APIs, SSR-specific
helpers, or the entire React adapter API. Range pagination uses `useQuery`.

## Prior work

The earlier Vue contribution by Christian Pannwitz remains at
[PR #452](https://github.com/psteinroe/supabase-cache-helpers/pull/452), associated
with [issue #429](https://github.com/psteinroe/supabase-cache-helpers/issues/429).
This implementation follows that adapter direction but ports the current React
package's mutation/cache bindings and replaces the old non-reactive query result mapping.
It does not copy the 2024 dependency or test setup. Repository MIT license applies.
