# Custom Cache Updates

Sometimes, you will find yourself writing custom cache updates. The library exports two convenience hooks that expose the underlying cache operations.

!!! danger
    These hooks do not do any API requests. They only update the local cache.

## `useDeleteItem`

Delete a postgrest entity from the cache. Note that you have to pass a value for all primary keys in the input.

=== "SWR"

    ```tsx
    import { useDeleteItem } from "@supabase-cache-helpers/postgrest-swr";

    function Page() {
        const deleteItem = useDeleteItem({
          primaryKeys: ['id'],
          table: 'contact',
          schema: 'public',
          opts,
        });

      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useDeleteItem } from "@supabase-cache-helpers/postgrest-react-query";

    function Page() {
        const deleteItem = useDeleteItem({
          primaryKeys: ['id'],
          table: 'contact',
          schema: 'public',
          opts,
        });

      return <div>...</div>;
    }
    ```

## `useUpsertItem`

Upsert a postgrest entity into the cache. Note that you have to pass a value for all primary keys in the input.

=== "SWR"

    ```tsx
    import { useUpsertItem } from "@supabase-cache-helpers/postgrest-swr";

    function Page() {
        const upsertItem = useUpsertItem({
          primaryKeys: ['id'],
          table: 'contact',
          schema: 'public',
          opts,
        });

      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useUpsertItem } from "@supabase-cache-helpers/postgrest-react-query";

    function Page() {
        const upsertItem = useUpsertItem({
          primaryKeys: ['id'],
          table: 'contact',
          schema: 'public',
          opts,
        });

      return <div>...</div>;
    }
    ```

## `useRevalidateTables`

Revalidate all queries for the given tables.

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
