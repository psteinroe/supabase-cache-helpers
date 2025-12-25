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

Import [`useQuery`](./queries.md#usequery) and define a simple query. The cache key is automatically created from the query. You can pass the SWR- and React Query-native options as a second argument. For pagination and infinite scroll queries, use [`useInfiniteOffsetPaginationQuery`](./queries.md#useinfiniteoffsetpaginationquery), [`useOffsetInfiniteScrollQuery`](./queries.md#useoffsetinfinitescrollquery) and [`useCursorInfiniteScrollQuery`](./queries.md#usecursorinfinitescrollquery).

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
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username,ticket_number", { count: "exact" })
          .eq("username", "psteinroe"),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }
      );
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
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username,ticket_number", { count: "exact" })
          .eq("username", "psteinroe"),
        {
          enabled: false
        }
      );
      return <div>...</div>;
    }
    ```

Somewhere in your app, import [`useInsertMutation`](./mutations.md#useinsertmutation) and define a mutation. For the automatic cache population to work, you need to pass the primary key(s) of the relation as a second argument. To return data from the mutation, pass a `.select('...')` string as the third argument. Pass `null` to skip. The fourth argument is the SWR- and React Query-native `options` object. The mutation will automatically update the query cache of the contact query defined above. Other operations are supported with [`useUpsertMutation`](./mutations.md#useupsertmutation), [`useUpdateMutation`](./mutations.md#useupdatemutation) and [`useDeleteMutation`](./mutations.md#usedeletemutation).

=== "SWR"

    ```tsx
    import { useInsertMutation } from "@supabase-cache-helpers/postgrest-swr";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { trigger: insert } = useInsertMutation(
        client.from('contact'),
        ['id'],
        'ticket_number',
        {
          onSuccess: () => console.log('Success!'),
        }
      );
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
      const { mutateAsync: insert } = useInsertMutation(
        client.from('contact'),
        ['id'],
        'ticket_number',
        {
          onSuccess: () => console.log('Success!'),
        }
      );
      return <div>...</div>;
    }
    ```

To subscribe to changes, import [`useSubscription`](./subscriptions.md#usesubscription) and define a subscription. Use any channel name, and define the subscription as you know it from the Supabase client. For the automatic cache population to work, you need to pass the primary key(s) of the relation. You can pass the SWR and React Query-native mutation options.

The query cache will automatically be updated when new data comes in. If you use [computed / virtual columns](https://postgrest.org/en/stable/api.html?highlight=computed%20columns#computed-virtual-columns) or relations, you can use [`useSubscriptionQuery`](./subscriptions.md#usesubscriptionquery) to fetch the entity from `PostgREST` before populating the cache with it.

=== "SWR"

    ```tsx
    import { useSubscription } from "@supabase-cache-helpers/postgrest-swr";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { status } = useSubscription(
        client,
        `insert-channel-name`,
        {
          event: "*",
          table: "contact",
          schema: "public",
        },
        ["id"],
        { callback: (payload) => console.log(payload) }
      );
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
      const { status } = useSubscription(
        client,
        `insert-channel-name`,
        {
          event: "*",
          table: "contact",
          schema: "public",
        },
        ["id"],
        { callback: (payload) => console.log(payload) }
      );
      return <div>...</div>;
    }
    ```
