# @supabase-cache-helpers/postgrest-core

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
