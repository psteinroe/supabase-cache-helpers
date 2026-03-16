# Subscriptions

The cache helpers subscription hooks are simple `useEffect`-based hooks that manage a Supabase Realtime subscription. Similar to the mutation hooks, the cache is automatically populated with the incoming data.

All subscription hooks accept a single options object with the following properties:

- `client`: The Supabase client instance
- `channel`: The unique channel name for the subscription
- `event`: The event type to listen for (`'INSERT'`, `'UPDATE'`, `'DELETE'`, or `'*'` for all)
- `schema`: (optional, defaults to `'public'`) The database schema
- `table`: The table name to subscribe to
- `filter`: (optional) A filter expression for the subscription
- `primaryKeys`: An array of primary key column names
- `callback`: (optional) A callback function to invoke when events are received
- Plus any additional configuration options from the respective library

## `useSubscription`

The `useSubscription` hook simply manages a realtime subscription. Upon retrieval of an update, it updates the cache with the retrieved data the same way the mutation hooks do. NOTE: Channel names must be unique when using multiple subscription hooks.

=== "SWR"

    ```tsx
    import { useSubscription } from '@supabase-cache-helpers/postgrest-swr';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { status } = useSubscription({
        client,
        channel: 'insert-channel-name',
        event: '*',
        table: 'contact',
        schema: 'public',
        primaryKeys: ['id'],
        callback: (payload) => console.log(payload),
      });

      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useSubscription } from '@supabase-cache-helpers/postgrest-react-query';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { status } = useSubscription({
        client,
        channel: 'insert-channel-name',
        event: '*',
        table: 'contact',
        schema: 'public',
        primaryKeys: ['id'],
        callback: (payload) => console.log(payload),
      });

      return <div>...</div>;
    }
    ```

## `useSubscriptionQuery`

The `useSubscriptionQuery` hook does exactly the same as the `useSubscription` hooks, but instead of updating the cache with the data sent by realtime, it re-fetches the entity from PostgREST and updates the cache with the returned data. The main use case for this hook are [Computed Columns](https://postgrest.org/en/stable/api.html?highlight=computed%20columns#computed-virtual-columns), because these are not sent by realtime. The callback passes an additional property `data: R | T['Row']` which is populated with the data returned by the query. For `DELETE` events, `data` is populated with `old_record` for convenience.

The additional property for this hook is:

- `returning`: (optional) The columns to select when re-fetching the entity

=== "SWR"

    ```tsx
    import { useSubscriptionQuery } from '@supabase-cache-helpers/postgrest-swr';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { status } = useSubscriptionQuery({
        client,
        channel: 'insert-channel-name',
        event: '*',
        table: 'contact',
        schema: 'public',
        primaryKeys: ['id'],
        returning: 'id,username,has_low_ticket_number,ticket_number', // define the query to be executed when the realtime update arrives
        callback: (payload) => console.log(payload),
      });

      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useSubscriptionQuery } from '@supabase-cache-helpers/postgrest-react-query';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { status } = useSubscriptionQuery({
        client,
        channel: 'insert-channel-name',
        event: '*',
        table: 'contact',
        schema: 'public',
        primaryKeys: ['id'],
        returning: 'id,username,has_low_ticket_number,ticket_number', // define the query to be executed when the realtime update arrives
        callback: (payload) => console.log(payload),
      });

      return <div>...</div>;
    }
    ```
