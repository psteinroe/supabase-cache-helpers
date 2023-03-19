# PostgREST React Query

This submodule provides convenience helpers for querying and mutating data with postgrest-js and React Query. It is designed to work as black box that "just works".

- [⚡️ Quick Start](#️-quick-start)
- [📝 Features](#-features)
  - [Queries](#queries)
    - [`useQuery`](#usequery)
  - [Mutations](#mutations)
    - [`useInsertMutation`](#useinsertmutation)
    - [`useUpdateMutation`](#useupdatemutation)
    - [`useDeleteMutation`](#usedeletemutation)
    - [`useUpsertMutation`](#useupsertmutation)
  - [Subscriptions](#subscriptions)
    - [`useSubscription`](#usesubscription)
    - [`useSubscriptionQuery`](#usesubscriptionquery)
  - [Custom Cache Updates](#custom-cache-updates)
    - [`useDeleteItem`](#usedeleteitem)
    - [`useUpsertItem`](#useupsertitem)

## ⚡️ Quick Start

PostgREST React-Query is available as a package on NPM, install with your favorite package manager:

```shell
pnpm install @supabase-cache-helpers/postgrest-react-query

npm install @supabase-cache-helpers/postgrest-react-query

yarn add @supabase-cache-helpers/postgrest-react-query
```

If your package manager does not install peer dependencies automatically, you will need to install them, too.

```shell
pnpm install swr react @supabase/postgrest-js

npm install swr react @supabase/postgrest-js

yarn add swr react @supabase/postgrest-js
```

```tsx
import {
  useQuery,
  useInsertMutation,
  useSubscription,
} from '@supabase-cache-helpers/postgrest-swr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const client = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function Page() {
  // Define the query.
  const { data, count } = useQuery(
    client
      .from('contact')
      .select('id,username,ticket_number', { count: 'exact' })
      .eq('username', 'psteinroe'),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Define the mutation. Update, Upsert, and Delete are also supported.
  const [insert] = useInsertMutation(client.from('contact'), ['id']);

  // Subscriptions are also supported.
  const { status } = useSubscription(
    client.channel('random'),
    {
      event: '*',
      table: 'contact',
      schema: 'public',
    },
    ['id'],
    { callback: (payload) => console.log(payload) }
  );

  return <div>...</div>;
}
```

## 📝 Features

### Queries

#### `useQuery`

Wrapper around `useQuery` that returns the query including the count without any modification of the data. The `UseQueryOptions` can be passed as second argument.

```tsx
import { useQuery } from '@supabase-cache-helpers/postgrest-swr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const client = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function Page() {
  const { data, count, isValidating, mutate, error } = useQuery(
    client
      .from('contact')
      .select('id,username', { count: 'exact' })
      .eq('username', 'psteinroe')
  );
  return (
    <div>
      <div>
        {(data ?? []).find((d) => d.username === 'psteinroe')?.username}
      </div>
      <div data-testId="count">{count}</div>
    </div>
  );
}
```

### Mutations

Supported operations are insert many, update one, upsert many and delete one. Specifying the selected columns is also supported.

All hooks share the same config argument `PostgrestSWRMutatorOpts`, which is a union of `SWRMutatorOptions` from `swr`, `UseMutationOptions` from `use-mutation` and `PostgrestMutatorOpts`:

```ts
declare type PostgrestMutatorOpts<Type> = {
  /**
   * Will set all keys of the tables to stale
   */
  revalidateTables?: {
    schema?: string;
    table: string;
  }[];
  /**
   * Will set all keys of the tables where relation.primaryKey === myObj.fKey
   */
  revalidateRelations?: {
    schema?: string;
    relation: string;
    relationIdColumn: string;
    fKeyColumn: keyof Type;
  }[];
};
```

#### `useInsertMutation`

Insert an item. Will also update the count if applicable. Note that hook requires the user to define the primary keys of the relation, because the items are upserted to the cache to prevent duplicates, e.g. if a subscription is used in parallel.

```tsx
import { useQuery, useInsertMutation } from '@supabase-cache-helpers/postgrest-swr'
import { createClient } from "@supabase/supabase-js";
import { Database } from './types'

const client = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function Page() {
    const { data, count } = useQuery(
    client
        .from("contact")
        .select("id,username", { count: "exact" })
        .eq("username", "supausername")
    );
    const [insert] = useInsertMutation(client.from("contact"), "single", ["id"]);
    return (
    <div
        data-testid="insert"
        onClick={async () => await insert([{ username: "supausername" }])}
    >
        <span>{data?.find((d) => d.username === "supausername")?.username}</span>
        <span data-testid="count">{`count: ${count}`}</span>
    </div>
    );
```

#### `useUpdateMutation`

Update an item. Requires the primary keys to be defined explicitly.

```tsx
import { useQuery, useUpdateMutation } from '@supabase-cache-helpers/postgrest-swr'
import { createClient } from "@supabase/supabase-js";
import { Database } from './types'

const client = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function Page() {
    const { data, count } = useQuery(
    client
        .from("contact")
        .select("id,username", { count: "exact" })
        .eq("username", ['supaname', 'supadupaname'])
    );
    const [update] = useUpdateMutation(client.from("contact"), ["id"]);
    return (
    <div>
        <div
        data-testid="update"
        onClick={async () =>
            await update({
                id: (data ?? []).find((d) => d.username === 'supaname')?.id,
                username: 'supadupaname,
            })
        }
        />
        <span>
        {
            data?.find((d) =>
            ['supaname', 'supadupaname'].includes(d.username ?? "")
            )?.username
        }
        </span>
        <span data-testid="count">{`count: ${count}`}</span>
    </div>
    );
}
```

#### `useDeleteMutation`

Delete an item by primary key(s). Requires the primary keys to be defined explicitly. Will also update the count of the queries.

```tsx
import {
  useQuery,
  useDeleteMutation,
} from '@supabase-cache-helpers/postgrest-swr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const client = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function Page() {
  const { data, count } = useQuery(
    client
      .from('contact')
      .select('id,username', { count: 'exact' })
      .eq('username', 'supaname')
  );
  const [deleteContact] = useDeleteMutation(client.from('contact'), ['id']);
  return (
    <div>
      <div
        data-testid="delete"
        onClick={async () =>
          await deleteContact({
            id: data?.find((d) => d.username === USERNAME)?.id,
          })
        }
      />
      {(data ?? []).map((d) => (
        <span key={d.id}>{d.username}</span>
      ))}
      <span data-testid="count">{`count: ${count}`}</span>
    </div>
  );
}
```

#### `useUpsertMutation`

Upsert one or multiple items. Requires the primary keys to be defined explicitly. Will also add one to the count if an item is inserted.

```tsx
import {
  useQuery,
  useUpsertMutation,
} from '@supabase-cache-helpers/postgrest-swr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const client = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function Page() {
  const { data, count } = useQuery(
    client
      .from('contact')
      .select('id,username,golden_ticket', { count: 'exact' })
      .in('username', [USERNAME, USERNAME_2])
  );

  const [upsertMany] = useUpsertMutation(client.from('contact'), ['id']);

  return (
    <div>
      <div
        data-testid="upsertMany"
        onClick={async () =>
          await upsertMany([
            {
              id: data?.find((d) => d.username === 'supabame')?.id,
              username: 'supabame',
              golden_ticket: true,
            },
            {
              id: uuid(),
              username: 'supadupaname',
              golden_ticket: null,
            },
          ])
        }
      />
      {(data ?? []).map((d) => (
        <span key={d.id}>{`${d.username} - ${d.golden_ticket ?? 'null'}`}</span>
      ))}
      <span data-testid="count">{`count: ${count}`}</span>
    </div>
  );
}
```

### Subscriptions

#### `useSubscription`

The useSubscription hook simply manages a realtime subscription. Upon retrieval of an update, it updates the cache with the retrieved data the same way the mutation hooks do. It exposes all params of the .on() method, including the callback, as well as the `PostgrestSWRMutatorOpts`.

```tsx
import {
  useQuery,
  useSubscription,
} from '@supabase-cache-helpers/postgrest-swr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const client = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function Page() {
  const { data, count } = useQuery(
    client
      .from('contact')
      .select('id,username,ticket_number', { count: 'exact' })
      .eq('username', USERNAME_1),
    'multiple',
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { status } = useSubscription(
    client.channel(`random`),
    {
      event: '*',
      table: 'contact',
      schema: 'public',
    },
    ['id'],
    { callback: (payload) => console.log(payload) }
  );

  return (
    <div>
      {(data ?? []).map((d) => (
        <span key={d.id}>{`ticket_number: ${d.ticket_number}`}</span>
      ))}
      <span data-testid="count">{`count: ${count}`}</span>
      <span data-testid="status">{status}</span>
    </div>
  );
}
```

#### `useSubscriptionQuery`

The useSubscriptionQuery hook does exactly the same, but instead of updating the cache with the data sent by realtime, it fetches the latest data from PostgREST and updates the cache with that. The main use case for this hook are [Computed Columns](https://postgrest.org/en/stable/api.html?highlight=computed%20columns#computed-virtual-columns), because these are not sent by realtime. The ccallback contains an additional property `data: R | T['Row']` which is populated with the data returned by the query. For `DELETE` events, `data` is populated with `old_record` for convenience.

```tsx
import {
  useQuery,
  useSubscriptionQuery,
} from '@supabase-cache-helpers/postgrest-swr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const client = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function Page() {
  const { data, count } = useQuery(
    client
      .from('contact')
      // has_low_ticket_number is a computed column
      .select('id,username,has_low_ticket_number,ticket_number', {
        count: 'exact',
      })
      .eq('username', USERNAME_1)
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { status } = useSubscriptionQuery(
    client,
    `random`,
    {
      event: '*',
      table: 'contact',
      schema: 'public',
    },
    ['id'],
    'id,username,has_low_ticket_number,ticket_number', // define the query to be executed when the realtime update arrives
    { callback: (payload) => console.log(payload) }
  );

  return (
    <div>
      {(data ?? []).map((d) => (
        <span
          key={d.id}
        >{`ticket_number: ${d.ticket_number} | has_low_ticket_number: ${d.has_low_ticket_number}`}</span>
      ))}
      <span data-testid="count">{`count: ${count}`}</span>
      <span data-testid="status">{status}</span>
    </div>
  );
}
```

### Custom Cache Updates

For more complex mutation, the SWR cache can also be updated directly. The library exports two convenience hooks that expose the underlying cache operations.

#### `useDeleteItem`

Delete a postgrest entity from the cache.

```ts
const deleteItem = useDeleteItem({
  primaryKeys: ['id'],
  table: 'contact',
  schema: 'public',
  opts, // `PostgrestMutatorOpts`, for details see above
});

await deleteItem(input);
```

#### `useUpsertItem`

Upsert a postgrest entity into the cache.

```ts
const upsertItem = useUpsertItem({
  primaryKeys: ['id'],
  table: 'contact',
  schema: 'public',
  opts, // `PostgrestMutatorOpts`, for details see above
});

await upsertItem(input);
```
