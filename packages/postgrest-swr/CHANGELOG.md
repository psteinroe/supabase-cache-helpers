# @supabase-cache-helpers/postgrest-swr

## 1.6.5

### Patch Changes

- 406ea61: fix: refactor normalized query building and deduplication to improve maintainability and apply dedupe nested paths only
- Updated dependencies [406ea61]
  - @supabase-cache-helpers/postgrest-core@0.4.4

## 1.6.4

### Patch Changes

- 40a6327: fix: update typescript to 5.4.2
- Updated dependencies [819bfb5]
- Updated dependencies [40a6327]
  - @supabase-cache-helpers/postgrest-core@0.4.3

## 1.6.3

### Patch Changes

- Updated dependencies [68b0c1c]
  - @supabase-cache-helpers/postgrest-core@0.4.2

## 1.6.2

### Patch Changes

- cee8acb: fix: properly pass parameters to mutate for revalidation

## 1.6.1

### Patch Changes

- Updated dependencies [0c57875]
  - @supabase-cache-helpers/postgrest-core@0.4.1

## 1.6.0

### Minor Changes

- 7a892b7: feat: add delete many mutation

### Patch Changes

- a4d14bd: fix: pass key to mutate when revalidating in swr
- Updated dependencies [7a892b7]
- Updated dependencies [ecbcbd3]
  - @supabase-cache-helpers/postgrest-core@0.4.0

## 1.5.0

### Minor Changes

- f7f3d1f: add react-server export for react server component compatibility

## 1.4.0

### Minor Changes

- c1345c7: Export types, such as GetFetcherOptions, UseQuerySingleReturn, UseQueryMaybeSingleReturn and others

### Patch Changes

- d228ec1: fix: check data for array instead of truthiness to fix issue with incorrect fallbackData

## 1.3.0

### Minor Changes

- ae17e30: feat: add prefetch

### Patch Changes

- f2ca765: chore: upgrade supabase-js to 2.38.5
- f2ca765: chore: upgrade postgrest-js to 1.9.0
- Updated dependencies [ae17e30]
- Updated dependencies [f2ca765]
- Updated dependencies [f2ca765]
  - @supabase-cache-helpers/postgrest-core@0.3.0

## 1.2.6

### Patch Changes

- f7b44bc: fix: make revalidate a different function than mutate
- Updated dependencies [f7b44bc]
  - @supabase-cache-helpers/postgrest-core@0.2.6

## 1.2.5

### Patch Changes

- Updated dependencies [1946068]
  - @supabase-cache-helpers/postgrest-core@0.2.5

## 1.2.4

### Patch Changes

- Updated dependencies [e225881]
  - @supabase-cache-helpers/postgrest-core@0.2.4

## 1.2.3

### Patch Changes

- c87c5cd: fix: normalize response of useSubscriptionQuery
- Updated dependencies [c87c5cd]
  - @supabase-cache-helpers/postgrest-core@0.2.3

## 1.2.2

### Patch Changes

- Updated dependencies [cdfb8c3]
  - @supabase-cache-helpers/postgrest-core@0.2.2

## 1.2.1

### Patch Changes

- Updated dependencies [f79dd3f]
  - @supabase-cache-helpers/postgrest-core@0.2.1

## 1.2.0

### Minor Changes

- 8c333a4: feat: add useMutateItem hook for custom cache updates

### Patch Changes

- Updated dependencies [8c333a4]
- Updated dependencies [8c333a4]
  - @supabase-cache-helpers/postgrest-core@0.2.0

## 1.1.13

### Patch Changes

- e6cb820: fix: drop QueryWithoutWildcard type
- Updated dependencies [e6cb820]
  - @supabase-cache-helpers/postgrest-core@0.1.4

## 1.1.12

### Patch Changes

- Updated dependencies [f2ab921]
  - @supabase-cache-helpers/postgrest-core@0.1.3

## 1.1.11

### Patch Changes

- Updated dependencies [1668390]
  - @supabase-cache-helpers/postgrest-core@0.1.2

## 1.1.10

### Patch Changes

- Updated dependencies [c26d316]
  - @supabase-cache-helpers/postgrest-core@0.1.1

## 1.1.9

### Patch Changes

- Updated dependencies [41dcd7d]
- Updated dependencies [9107bd1]
  - @supabase-cache-helpers/postgrest-core@0.1.0

## 1.1.8

### Patch Changes

- d9bffb6: fix: re-export missing types

## 1.1.7

### Patch Changes

- 6b1f00c: fix: type configuration parameter and add tests for fallbackData
- 2f1d3cb: refactor: merge internal packages into one core package per product
- 1056db0: fix: use flattened object for normalized data to fix bugs with nested joins overlapping with the id
- 1634b87: fix: use useCallback wherever reasonable
- Updated dependencies [2f1d3cb]
- Updated dependencies [1056db0]
  - @supabase-cache-helpers/postgrest-core@0.0.1

## 1.1.6

### Patch Changes

- 531d153: fix: do not revalidate on mutate by default

## 1.1.5

### Patch Changes

- 92caf9e: fix: remove unnecessary useMemo calls

## 1.1.4

### Patch Changes

- 90da3cd: fix: cursor value parsing

## 1.1.3

### Patch Changes

- 7abe3e6: fix: ordering of cursor pagination
- Updated dependencies [7abe3e6]
  - @supabase-cache-helpers/postgrest-fetcher@1.1.2

## 1.1.2

### Patch Changes

- 8483d68: this is a breaking change for the `useCursorInfiniteScroll` hook, because i realised the API I released last week does have significant downsides, and often causes infinte loops. Now, you have put buth `.order()` and `.limit()` on the query yourself. The hook expects a `PostgrestTransformBuilder`, and you can apply the `.result()` transformer, too.
- Updated dependencies [8483d68]
  - @supabase-cache-helpers/postgrest-fetcher@1.1.1

## 1.1.1

### Patch Changes

- 5ed1401: fix: set hasMore to false if isValidating or last page != pageSize to prevent infinite loop when rendering

## 1.1.0

### Minor Changes

- 3b4b664: - feat: add cursor pagination
  - refactor: rename infinite queries to include the type (offset or cursor)

### Patch Changes

- Updated dependencies [3b4b664]
  - @supabase-cache-helpers/postgrest-fetcher@1.1.0
  - @supabase-cache-helpers/postgrest-filter@1.1.0
  - @supabase-cache-helpers/postgrest-mutate@1.0.18

## 1.0.23

### Patch Changes

- Updated dependencies [7b57743]
  - @supabase-cache-helpers/postgrest-mutate@1.0.17

## 1.0.22

### Patch Changes

- c24f410: Updated dependency `@supabase/postgrest-js` to `1.7.2`.
- Updated dependencies [c24f410]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.16
  - @supabase-cache-helpers/postgrest-filter@1.0.12
  - @supabase-cache-helpers/postgrest-mutate@1.0.16
  - @supabase-cache-helpers/postgrest-shared@1.0.7

## 1.0.21

### Patch Changes

- 07ecafd: fix: swr types

## 1.0.20

### Patch Changes

- 5e9b574: fix: relationship types
- Updated dependencies [5e9b574]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.15
  - @supabase-cache-helpers/postgrest-filter@1.0.11
  - @supabase-cache-helpers/postgrest-mutate@1.0.15

## 1.0.19

### Patch Changes

- Updated dependencies [be5c7e3]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.14

## 1.0.18

### Patch Changes

- ad7efb0: chore: upgrade supabase to latest
- Updated dependencies [ad7efb0]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.13
  - @supabase-cache-helpers/postgrest-filter@1.0.10
  - @supabase-cache-helpers/postgrest-mutate@1.0.14
  - @supabase-cache-helpers/postgrest-shared@1.0.6

## 1.0.17

### Patch Changes

- 5acf83a: Fix types for mjs when using "moduleResolution" other then "node" (node16, nodenext, bundler)
- Updated dependencies [5acf83a]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.12
  - @supabase-cache-helpers/postgrest-filter@1.0.9
  - @supabase-cache-helpers/postgrest-mutate@1.0.13
  - @supabase-cache-helpers/postgrest-shared@1.0.5

## 1.0.16

### Patch Changes

- abfd988: fix: expose mutation options from supabase sdk
- Updated dependencies [abfd988]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.11

## 1.0.15

### Patch Changes

- 44c137b: fix: refactor useSubscription to create the channel internally

  fixes #162

  this is a breaking change! however, since this was simply not working before, I am realising it as a patch change.

  to migrate, simply pass the `SupabaseClient` and the channel name, instead of the channel:

  ```tsx
  const { status } = useSubscription(
    client.channel(`public:contact:username=eq.${USERNAME_1}`),
    {
      event: "*",
      table: "contact",
      schema: "public",
      filter: `username=eq.${USERNAME_1}`,
    },
    ["id"],
    { callback: () => setCbCalled(true) },
  );
  ```

  becomes

  ```tsx
  const { status } = useSubscription(
    client,
    `public:contact:username=eq.${USERNAME_1}`,
    {
      event: "*",
      table: "contact",
      schema: "public",
      filter: `username=eq.${USERNAME_1}`,
    },
    ["id"],
    { callback: () => setCbCalled(true) },
  );
  ```

## 1.0.14

### Patch Changes

- 13540fb: refactor: drop lodash to properly support esm
- Updated dependencies [13540fb]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.10
  - @supabase-cache-helpers/postgrest-filter@1.0.8
  - @supabase-cache-helpers/postgrest-mutate@1.0.12

## 1.0.13

### Patch Changes

- 30fc994: fix: pagination fetcher limit
- Updated dependencies [30fc994]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.9

## 1.0.12

### Patch Changes

- 5071a6f: fix: esm export
- Updated dependencies [5071a6f]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.8
  - @supabase-cache-helpers/postgrest-filter@1.0.7
  - @supabase-cache-helpers/postgrest-mutate@1.0.11
  - @supabase-cache-helpers/postgrest-shared@1.0.4

## 1.0.11

### Patch Changes

- Updated dependencies [4738b7f]
  - @supabase-cache-helpers/postgrest-mutate@1.0.10

## 1.0.10

### Patch Changes

- Updated dependencies [2df9bab]
  - @supabase-cache-helpers/postgrest-mutate@1.0.9

## 1.0.9

### Patch Changes

- f4144b2: Updated dependency `eslint` to `8.39.0`.
- 6371dac: Updated dependency `@types/react` to `18.2.0`.
- Updated dependencies [a199ffb]
- Updated dependencies [f4144b2]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.7
  - @supabase-cache-helpers/postgrest-filter@1.0.6
  - @supabase-cache-helpers/postgrest-mutate@1.0.8
  - @supabase-cache-helpers/postgrest-shared@1.0.3

## 1.0.8

### Patch Changes

- e09674a: fix: setPage() when page is not loaded already

## 1.0.7

### Patch Changes

- 8749572: Updated dependency `ts-jest` to `29.1.0`.
- 164dd15: Updated dependency `@supabase/supabase-js` to `2.21.0`.
  Updated dependency `@supabase/postgrest-js` to `1.6.0`.
  Updated dependency `@supabase/storage-js` to `2.5.1`.
- e51b53e: Updated dependency `typescript` to `5.0.4`.
- df1b4f4: Updated dependency `@testing-library/react` to `14.0.0`.
- Updated dependencies [8749572]
- Updated dependencies [164dd15]
- Updated dependencies [e51b53e]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.6
  - @supabase-cache-helpers/postgrest-filter@1.0.5
  - @supabase-cache-helpers/postgrest-mutate@1.0.7
  - @supabase-cache-helpers/postgrest-shared@1.0.2

## 1.0.6

### Patch Changes

- Updated dependencies [cc4df33]
- Updated dependencies [cc4df33]
  - @supabase-cache-helpers/postgrest-filter@1.0.4
  - @supabase-cache-helpers/postgrest-fetcher@1.0.5
  - @supabase-cache-helpers/postgrest-mutate@1.0.6

## 1.0.5

### Patch Changes

- Updated dependencies [429a86d]
  - @supabase-cache-helpers/postgrest-mutate@1.0.5

## 1.0.4

### Patch Changes

- Updated dependencies [4d16f00]
  - @supabase-cache-helpers/postgrest-filter@1.0.3
  - @supabase-cache-helpers/postgrest-mutate@1.0.4
  - @supabase-cache-helpers/postgrest-fetcher@1.0.4

## 1.0.3

### Patch Changes

- 0a199ba: improve query string type to throw error if there is any '_' within the string. before, it just checked for `query === '_'`
- Updated dependencies [f4bc48c]
- Updated dependencies [0a199ba]
  - @supabase-cache-helpers/postgrest-mutate@1.0.3
  - @supabase-cache-helpers/postgrest-fetcher@1.0.3
  - @supabase-cache-helpers/postgrest-shared@1.0.1

## 1.0.2

### Patch Changes

- f0276c8: fix: readme formatting and add metadata
- Updated dependencies [ff81d5b]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.2
  - @supabase-cache-helpers/postgrest-filter@1.0.2
  - @supabase-cache-helpers/postgrest-mutate@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [c7caff3]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.1
  - @supabase-cache-helpers/postgrest-filter@1.0.1
  - @supabase-cache-helpers/postgrest-mutate@1.0.1

## 1.0.0

### Major Changes

- f73321d: The first major release of Supabase Cache Helpers is the result of months of testing in a production environment followed by a rewrite of large parts of the codebase. While the API stayed mostly the same, internals are more stable and powerful now.

  - Removed "mode" from insert and upsert mutations and only allow upsert([myItem]).
  - The query string is now dereived from the current cache keys before executing a mutation to fix issues with automatic cache updates.
  - Respect orderBy and pageSize in mutations to ensure proper sorting and pagination.
  - Added ordering to query key and exported explicit return types for hooks.
  - Use `PostgrestBuilder` or `PostgrestTransformBuilder` as parameter throughout and improve type inferrence.
  - Transform input into the format expected by cache key before mutation to update cache with mapped paths.
  - Allowed custom merge function for upsert mutation
  - throw type error if user tries to `select('*')`.
  - Introduced Tanstack query v1 (without infinite query support).
  - Improved support for storage in React Native.
  - Replaced use-mutation with useSWRMutation
  - Added demo and standalone docs.

  Checkout the new docs and get started!

### Patch Changes

- Updated dependencies [f73321d]
  - @supabase-cache-helpers/postgrest-fetcher@1.0.0
  - @supabase-cache-helpers/postgrest-filter@1.0.0
  - @supabase-cache-helpers/postgrest-mutate@1.0.0
  - @supabase-cache-helpers/postgrest-shared@1.0.0

## 0.4.17

### Patch Changes

- c264783: fixes a bug when mutating inifnite queries
- Updated dependencies [c264783]
  - @supabase-cache-helpers/postgrest-mutate@0.3.6

## 0.4.16

### Patch Changes

- 8848fa1: fix: upgrade swr to v2

## 0.4.15

### Patch Changes

- 4841493: fix: undo filter

## 0.4.14

### Patch Changes

- ec9baba: fix: mutate fn

## 0.4.13

### Patch Changes

- 681b30a: fix: type guard and export types
- Updated dependencies [681b30a]
  - @supabase-cache-helpers/postgrest-shared@0.0.6
  - @supabase-cache-helpers/postgrest-mutate@0.3.5

## 0.4.12

### Patch Changes

- 397e8cf: fix: export types

## 0.4.11

### Patch Changes

- c0fc2e5: fix: add missing export

## 0.4.10

### Patch Changes

- 53b0c0c: refactor and expose underlying cache operations

## 0.4.9

### Patch Changes

- 7d8ad05: fix: check for null before passing query to PostgrestParser

## 0.4.8

### Patch Changes

- 233483f: feat: return bound mutate for useInfiniteScrollQuery and usePaginationQuery

## 0.4.7

### Patch Changes

- Updated dependencies [e4cf514]
  - @supabase-cache-helpers/postgrest-filter@0.1.4
  - @supabase-cache-helpers/postgrest-mutate@0.3.4

## 0.4.6

### Patch Changes

- c59819c: chore: fix eslint settings and run --fix
- Updated dependencies [c59819c]
- Updated dependencies [2d0bd75]
  - @supabase-cache-helpers/postgrest-filter@0.1.3
  - @supabase-cache-helpers/postgrest-mutate@0.3.3

## 0.4.5

### Patch Changes

- Updated dependencies [8050bc5]
  - @supabase-cache-helpers/postgrest-filter@0.1.2
  - @supabase-cache-helpers/postgrest-mutate@0.3.2

## 0.4.4

### Patch Changes

- 07ae250: fix: expose isLoading and export types from postgrest-shared

## 0.4.3

### Patch Changes

- Updated dependencies [32539c4]
  - @supabase-cache-helpers/postgrest-filter@0.1.1
  - @supabase-cache-helpers/postgrest-mutate@0.3.1

## 0.4.2

### Patch Changes

- 1ee893e: feat: allow PostgresTransformBuilder
- Updated dependencies [1ee893e]
  - @supabase-cache-helpers/postgrest-fetcher@0.1.5

## 0.4.1

### Patch Changes

- 9a36fc4: docs: add primaryKeys to useInsertMutation

## 0.4.0

### Minor Changes

- 0584735: refactor: simplify types and use upsert for insert and update mutations

### Patch Changes

- 6330158: docs: add peer deps to installation instrutions
- Updated dependencies [0584735]
  - @supabase-cache-helpers/postgrest-filter@0.1.0
  - @supabase-cache-helpers/postgrest-mutate@0.3.0
  - @supabase-cache-helpers/postgrest-fetcher@0.1.4

## 0.3.1

### Patch Changes

- 4ad9ffe: add imports to doc snippets
- da10f5e: upgrade postgrest-js to 1.1.0
- Updated dependencies [da10f5e]
  - @supabase-cache-helpers/postgrest-fetcher@0.1.3
  - @supabase-cache-helpers/postgrest-filter@0.0.4
  - @supabase-cache-helpers/postgrest-mutate@0.2.2
  - @supabase-cache-helpers/postgrest-shared@0.0.5

## 0.3.0

### Minor Changes

- c94a35e: upgrade swr to v2

### Patch Changes

- abfd80a: improve test coverage
- 43c9221: upgrade supabase client packages
- Updated dependencies [abfd80a]
- Updated dependencies [43c9221]
  - @supabase-cache-helpers/postgrest-filter@0.0.3
  - @supabase-cache-helpers/postgrest-fetcher@0.1.2
  - @supabase-cache-helpers/postgrest-mutate@0.2.1
  - @supabase-cache-helpers/postgrest-shared@0.0.4

## 0.2.0

### Minor Changes

- e27cb35: add useSubscription and useSubscriptionQuery hooks
- 71da97b: refactor migrations by moving all possible logic into shared package
- f07f548: properly handle an invalid item after it was updated

### Patch Changes

- 6946b2d: upgrade supabase-js and postgrest-js
- 6e1b64b: do not apply filter when removing, since removal is done by primary keys anyways
- Updated dependencies [e27cb35]
- Updated dependencies [71da97b]
- Updated dependencies [6946b2d]
- Updated dependencies [f07f548]
  - @supabase-cache-helpers/postgrest-shared@0.0.3
  - @supabase-cache-helpers/postgrest-mutate@0.2.0
  - @supabase-cache-helpers/postgrest-filter@0.0.2
  - @supabase-cache-helpers/postgrest-fetcher@0.1.1

## 0.1.0

### Minor Changes

- a2323de: - [BREAKING] Add support for insert many
  - Allow defining the select query on mutations
  - refactor internal swr mutation functions to prepare for subscriptions
  - move mutation fetchers into common postgrest-fetcher lib

### Patch Changes

- Updated dependencies [a2323de]
  - @supabase-cache-helpers/postgrest-fetcher@0.1.0
  - @supabase-cache-helpers/postgrest-mutate@0.1.0
  - @supabase-cache-helpers/postgrest-shared@0.0.2

## 0.0.1

### Patch Changes

- a63f516: Initial Release
- Updated dependencies [a63f516]
  - @supabase-cache-helpers/postgrest-fetcher@0.0.1
  - @supabase-cache-helpers/postgrest-filter@0.0.1
  - @supabase-cache-helpers/postgrest-mutate@0.0.1
  - @supabase-cache-helpers/postgrest-shared@0.0.1
