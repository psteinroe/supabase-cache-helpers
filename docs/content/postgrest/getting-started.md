# Getting Started

## Installation

Inside your React project directory, run the following:

=== "SWR"

    ```bash
    pnpm add @supabase-cache-helpers/postgrest-swr
    ```

=== "React Query"

    ```bash
    pnpm add @supabase-cache-helpers/postgrest-react-query
    ```

If your package manager does not install peer dependencies automatically, you will need to install them, too.

=== "SWR"

    ```bash
    pnpm add swr react @supabase/postgrest-js
    ```

=== "React Query"

    ```bash
    pnpm add @tanstack/react-query react @supabase/postgrest-js
    ```

## Quick Start

Import [`useQuery`](./queries.md#usequery) and define a simple query. All hooks accept a single options object with the `query` property. The cache key is automatically created from the query. You can pass additional SWR- and React Query-native options in the same object. For pagination and infinite scroll queries, use [`useInfiniteOffsetPaginationQuery`](./queries.md#useinfiniteoffsetpaginationquery), [`useOffsetInfiniteScrollQuery`](./queries.md#useoffsetinfinitescrollquery) and [`useCursorInfiniteScrollQuery`](./queries.md#usecursorinfinitescrollquery).

=== "SWR"

    ```tsx
    import { useQuery } from "@supabase-cache-helpers/postgrest-swr";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      // Define the query, and its automatically parsed into an unique cache key.
      // `count` queries are supported, too
      const { data, count } = useQuery({
        query: client
          .from("contact")
          .select("id,username,ticket_number", { count: "exact" })
          .eq("username", "psteinroe"),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      // Define the query, and its automatically parsed into an unique cache key.
      // `count` queries are supported, too
      const { data, count } = useQuery({
        query: client
          .from("contact")
          .select("id,username,ticket_number", { count: "exact" })
          .eq("username", "psteinroe"),
        enabled: false,
      });
      return <div>...</div>;
    }
    ```

Somewhere in your app, import [`useInsertMutation`](./mutations.md#useinsertmutation) and define a mutation. Pass an options object with `query` (the query builder), `primaryKeys` (the primary key columns), and optionally `returning` (the columns to return). The mutation will automatically revalidate the query cache of related queries. Other operations are supported with [`useUpsertMutation`](./mutations.md#useupsertmutation), [`useUpdateMutation`](./mutations.md#useupdatemutation) and [`useDeleteMutation`](./mutations.md#usedeletemutation).

=== "SWR"

    ```tsx
    import { useInsertMutation } from "@supabase-cache-helpers/postgrest-swr";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { trigger: insert } = useInsertMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'ticket_number',
        onSuccess: () => console.log('Success!'),
      });
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useInsertMutation } from "@supabase-cache-helpers/postgrest-react-query";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { mutateAsync: insert } = useInsertMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'ticket_number',
        onSuccess: () => console.log('Success!'),
      });
      return <div>...</div>;
    }
    ```

To subscribe to changes, import [`useSubscription`](./subscriptions.md#usesubscription) and define a subscription. Pass an options object with `client`, `channel` (unique channel name), `event`, `table`, `schema`, and `primaryKeys`. You can also include SWR and React Query-native mutation options.

The query cache will automatically be revalidated when new data comes in. If you use [computed / virtual columns](https://postgrest.org/en/stable/api.html?highlight=computed%20columns#computed-virtual-columns) or relations, you can use [`useSubscriptionQuery`](./subscriptions.md#usesubscriptionquery) to fetch the entity from `PostgREST` before updating the cache.

=== "SWR"

    ```tsx
    import { useSubscription } from "@supabase-cache-helpers/postgrest-swr";

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
    import { useSubscription } from "@supabase-cache-helpers/postgrest-react-query";

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
