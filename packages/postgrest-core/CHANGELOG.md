# @supabase-cache-helpers/postgrest-core

## 0.9.1

### Patch Changes

- 0fe5773: feat: extrat and export parse order by helper
- 2cef149: fix: hasPath now handles nested arrays properly

## 0.9.0

### Minor Changes

- 2466274: Merge url parsing for rpc and table name and provide consistant parsing for self hosted servers

## 0.8.4

### Patch Changes

- 49a35ad: chore: update to latest supabase-js

## 0.8.3

### Patch Changes

- b06405b: fix: make delete work on single query

## 0.8.2

### Patch Changes

- bfdf3ac: fix update fetcher when primary key value is equal to false or 0

## 0.8.1

### Patch Changes

- 746cb34: fix: transform empty jsonb array cols properly

## 0.8.0

### Minor Changes

- f89f158: feat: support for aggregates

## 0.7.0

### Minor Changes

- 4d2d1e7: Strip primary keys from the update payload

## 0.6.1

### Patch Changes

- 915b917: fix: dont include wildcards from cache query

## 0.6.0

### Minor Changes

- 21e165e: feat: support for wildcard

## 0.5.3

### Patch Changes

- bfdc3ee: chore: update dependencies
- 6eadac5:

## 0.5.2

### Patch Changes

- fcf1c6d: feat: is transform builder helper

## 0.5.1

### Patch Changes

- 0c7817b: fix: better error reporting if select query cannot be parsed

## 0.5.0

### Minor Changes

- 7a99711: Adds support for parsing JSON arrow expressions in order clauses

## 0.4.7

### Patch Changes

- 99b8f68: fix: denormalize json column with top-level array

## 0.4.6

### Patch Changes

- 165ad0c: fix: flatten import

## 0.4.5

### Patch Changes

- 31e47e5: fix: denormalize now works with json(b) columns

## 0.4.4

### Patch Changes

- 406ea61: fix: refactor normalized query building and deduplication to improve maintainability and apply dedupe nested paths only

## 0.4.3

### Patch Changes

- 819bfb5: fix: apply dedupe aliased to pk filters if there are any
- 40a6327: fix: update typescript to 5.4.2

## 0.4.2

### Patch Changes

- 68b0c1c: fix: dedupe queries on the same relation with different fkeys when normalizing and denormalizing

## 0.4.1

### Patch Changes

- 0c57875: fix: revalidate relation now uses the input instead of transformedInput, and delete fetcher properly builds the query and returns the parsed results

## 0.4.0

### Minor Changes

- 7a892b7: feat: add delete many mutation

### Patch Changes

- ecbcbd3: fix: return input from mutations without query so that cache updates still work

## 0.3.0

### Minor Changes

- ae17e30: feat: add prefetch

### Patch Changes

- f2ca765: chore: upgrade supabase-js to 2.38.5
- f2ca765: chore: upgrade postgrest-js to 1.9.0

## 0.2.6

### Patch Changes

- f7b44bc: fix: make revalidate a different function than mutate

## 0.2.5

### Patch Changes

- 1946068: fix: enrich parsed filter paths with declaration from query paths

## 0.2.4

### Patch Changes

- e225881: fix: set hasMore to false if result is currently empty

## 0.2.3

### Patch Changes

- c87c5cd: chore: export normalizeResponse function

## 0.2.2

### Patch Changes

- cdfb8c3: fix: correctly handle filter on embedded 1-to-many relation

## 0.2.1

### Patch Changes

- f79dd3f: fix: use default import of flatten for esm compatiblilty

## 0.2.0

### Minor Changes

- 8c333a4: feat: mutate-item cache operation

### Patch Changes

- 8c333a4: refactor: split cache mutations and simplify

## 0.1.4

### Patch Changes

- e6cb820: fix: drop QueryWithoutWildcard type

## 0.1.3

### Patch Changes

- f2ab921: fix: return empty array if to-many relation is empty instead of removing the property altogether

## 0.1.2

### Patch Changes

- 1668390: fix: set relation to null if it is null instead of removing the property altogether when denormalizing

## 0.1.1

### Patch Changes

- c26d316: fix: alias in nested one-to-many relationships

## 0.1.0

### Minor Changes

- 9107bd1: feat: add findFilters helper fn

### Patch Changes

- 41dcd7d: feat: export order by parser fn

## 0.0.1

### Patch Changes

- 2f1d3cb: refactor: merge internal packages into one core package per product
- 1056db0: fix: use flattened object for normalized data to fix bugs with nested joins overlapping with the id
