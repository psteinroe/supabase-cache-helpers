# Custom Cache Updates

Sometimes, you will find yourself writing custom cache updates. The library exports convenience hooks that trigger cache revalidation for specific items.

!!! info
    These hooks do not make any API requests. They trigger revalidation of cached queries that contain the specified item, causing those queries to refetch from the server.

## `useRevalidateForDelete`

Trigger revalidation of all cached queries that contain a specific item. This is useful when you've deleted an item through a custom API call and need to update the cache. Note that you have to pass a value for all primary keys in the input.

Revalidates queries that currently contain the item (found by primary key in cache).

=== "SWR"

    ```tsx
    import { useRevalidateForDelete } from "@supabase-cache-helpers/postgrest-swr";

    function Page() {
        const revalidateForDelete = useRevalidateForDelete({
          primaryKeys: ['id'],
          table: 'contact',
          schema: 'public',
        });

        // Trigger revalidation after a custom delete
        await revalidateForDelete({ id: 1 });

      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useRevalidateForDelete } from "@supabase-cache-helpers/postgrest-react-query";

    function Page() {
        const revalidateForDelete = useRevalidateForDelete({
          primaryKeys: ['id'],
          table: 'contact',
          schema: 'public',
        });

        // Trigger revalidation after a custom delete
        await revalidateForDelete({ id: 1 });

      return <div>...</div>;
    }
    ```

## `useRevalidateForUpsert`

Trigger revalidation of all cached queries affected by an upsert. This is useful when you've inserted or updated an item through a custom API call and need to update the cache. Note that you have to pass a value for all primary keys in the input.

Revalidates queries where:
1. The item **should be** in the query (matches filters), OR
2. The item **was** in the query (found by PK in cache, may need removal after update)

=== "SWR"

    ```tsx
    import { useRevalidateForUpsert } from "@supabase-cache-helpers/postgrest-swr";

    function Page() {
        const revalidateForUpsert = useRevalidateForUpsert({
          primaryKeys: ['id'],
          table: 'contact',
          schema: 'public',
        });

        // Trigger revalidation after a custom insert/update
        await revalidateForUpsert({ id: 1, username: 'new_value' });

      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useRevalidateForUpsert } from "@supabase-cache-helpers/postgrest-react-query";

    function Page() {
        const revalidateForUpsert = useRevalidateForUpsert({
          primaryKeys: ['id'],
          table: 'contact',
          schema: 'public',
        });

        // Trigger revalidation after a custom insert/update
        await revalidateForUpsert({ id: 1, username: 'new_value' });

      return <div>...</div>;
    }
    ```

## `useRevalidateTables`

Revalidate all queries for the given tables.

!!! info "RPC Queries"
    To revalidate RPC queries, prefix the table name with `rpc/`. For example: `{ table: 'rpc/my_rpc_name' }`.

=== "SWR"

    ```tsx
    import { useRevalidateTables } from "@supabase-cache-helpers/postgrest-swr";

    function Page() {
        const revalidateTables = useRevalidateTables([{ schema: 'public', table: 'contact' }]);

      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useRevalidateTables } from "@supabase-cache-helpers/postgrest-react-query";

    function Page() {
        const revalidateTables = useRevalidateTables([{ schema: 'public', table: 'contact' }]);

      return <div>...</div>;
    }
    ```
