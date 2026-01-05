# Migrating to v2

Version 2.0 introduces a breaking change to all hooks: they now accept a single options object instead of positional arguments. This follows the same pattern as [TanStack Query v4](https://tanstack.com/query/v4/docs/react/guides/migrating-to-react-query-4#query-keys-and-query-functions-need-to-be-passed-with-an-object-form) and makes the API more consistent and easier to use.

## Quick Start with Codemod

The easiest way to migrate is to use the provided codemod:

```bash
# Install the codemod
npm install -D @supabase-cache-helpers/postgrest-codemod

# Run the migration on your source directory
npx postgrest-codemod migrate-to-v2 ./src

# Or run specific transforms
npx postgrest-codemod query-hooks ./src
npx postgrest-codemod mutation-hooks ./src
npx postgrest-codemod subscription-hooks ./src
```

The codemod will automatically transform your code to the new API. After running it, review the changes and run your tests.

## Manual Migration

### Query Hooks

**Before (v1.x):**

```tsx
// useQuery
const { data } = useQuery(
  client.from('contact').select('id,name'),
  { revalidateOnFocus: false }
);

// useOffsetInfiniteQuery
const { data } = useOffsetInfiniteQuery(
  () => client.from('contact').select('id,name'),
  { pageSize: 10 }
);

// useCursorInfiniteScrollQuery
const { data } = useCursorInfiniteScrollQuery(
  () => client.from('contact').select('id,name').order('id').limit(10),
  { orderBy: 'id', revalidateOnFocus: false }
);
```

**After (v2.x):**

```tsx
// useQuery
const { data } = useQuery({
  query: client.from('contact').select('id,name'),
  revalidateOnFocus: false,
});

// useOffsetInfiniteQuery
const { data } = useOffsetInfiniteQuery({
  query: () => client.from('contact').select('id,name'),
  pageSize: 10,
});

// useCursorInfiniteScrollQuery
const { data } = useCursorInfiniteScrollQuery({
  query: () => client.from('contact').select('id,name').order('id').limit(10),
  orderBy: 'id',
  revalidateOnFocus: false,
});
```

### Mutation Hooks

The mutation hooks have two naming changes:
- The first argument (`qb`) is now `query`
- The third argument (`query` for selecting columns) is now `returning` (to match PostgreSQL's `RETURNING` clause)

**Before (v1.x):**

```tsx
const { trigger: insert } = useInsertMutation(
  client.from('contact'),
  ['id'],
  'id,name,ticket_number',
  { onSuccess: () => console.log('Success!') }
);

const { trigger: update } = useUpdateMutation(
  client.from('contact'),
  ['id'],
  'id,name',
  { onSuccess: () => console.log('Updated!') }
);

const { trigger: deleteFn } = useDeleteMutation(
  client.from('contact'),
  ['id'],
  null,
  { onSuccess: () => console.log('Deleted!') }
);
```

**After (v2.x):**

```tsx
const { trigger: insert } = useInsertMutation({
  query: client.from('contact'),
  primaryKeys: ['id'],
  returning: 'id,name,ticket_number',
  onSuccess: () => console.log('Success!'),
});

const { trigger: update } = useUpdateMutation({
  query: client.from('contact'),
  primaryKeys: ['id'],
  returning: 'id,name',
  onSuccess: () => console.log('Updated!'),
});

const { trigger: deleteFn } = useDeleteMutation({
  query: client.from('contact'),
  primaryKeys: ['id'],
  onSuccess: () => console.log('Deleted!'),
});
```

### Subscription Hooks

The subscription hooks have flattened the filter object and renamed some parameters:
- `channelName` is now `channel`
- The filter object (`{ event, schema, table }`) is now flattened into the main options object

**Before (v1.x):**

```tsx
const { status } = useSubscription(
  client,
  'my-channel',
  {
    event: '*',
    schema: 'public',
    table: 'contact',
  },
  ['id'],
  { callback: (payload) => console.log(payload) }
);

const { status } = useSubscriptionQuery(
  client,
  'my-channel',
  {
    event: '*',
    schema: 'public',
    table: 'contact',
  },
  ['id'],
  'id,name,computed_column',
  { callback: (payload) => console.log(payload) }
);
```

**After (v2.x):**

```tsx
const { status } = useSubscription({
  client,
  channel: 'my-channel',
  event: '*',
  schema: 'public',
  table: 'contact',
  primaryKeys: ['id'],
  callback: (payload) => console.log(payload),
});

const { status } = useSubscriptionQuery({
  client,
  channel: 'my-channel',
  event: '*',
  schema: 'public',
  table: 'contact',
  primaryKeys: ['id'],
  returning: 'id,name,computed_column',
  callback: (payload) => console.log(payload),
});
```

## Summary of Changes

| Hook Type | Parameter Changes |
|-----------|------------------|
| Query hooks | First arg becomes `query`, config is spread into options |
| Mutation hooks | `qb` → `query`, `query` → `returning` |
| Subscription hooks | `channelName` → `channel`, filter object flattened |

## TypeScript

All hooks now export their options types, making it easier to type your code:

```tsx
import type {
  UseQueryOpts,
  UseInsertMutationOpts,
  UseSubscriptionOpts,
} from '@supabase-cache-helpers/postgrest-swr';

// Or for React Query
import type {
  UseQueryOpts,
  UseInsertMutationOpts,
  UseSubscriptionOpts,
} from '@supabase-cache-helpers/postgrest-react-query';
```

## Need Help?

If you encounter any issues during migration, please [open an issue](https://github.com/psteinroe/supabase-cache-helpers/issues) on GitHub.
