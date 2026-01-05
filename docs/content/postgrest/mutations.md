# Mutations

The cache helpers wrap the mutation hooks of the cache libraries and automatically keep your cache up-to-date through smart revalidation.

When the mutation returns, all queries currently in the cache are analyzed to see if they are affected by the mutation. If the mutated item matches any cached query (based on table, schema, and filters), that query is automatically revalidated to fetch fresh data from the server. This ensures your UI always reflects the latest server state.

If you need to revalidate additional cache items that are not automatically inferred, e.g. relations of the updated table, you can set `revalidateTables` and `revalidateRelations` on any mutation:

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
   * Will set all keys of the tables where relation.relationIdColumn === mutatedObj.fKeyColumn to stale
   */
  revalidateRelations?: {
    schema?: string;
    relation: string;
    relationIdColumn: string;
    fKeyColumn: keyof Type;
  }[];
};
```

All mutation hooks accept a single options object with the following properties:

- `query`: The PostgREST query builder (e.g., `client.from('contact')`)
- `primaryKeys`: An array of primary key column names
- `returning`: (optional) The columns to return after the mutation (matches PostgreSQL's `RETURNING` clause)
- Plus any additional configuration options from the respective library

## `useInsertMutation`

Insert entities. Requires the primary keys to be defined explicitly.

=== "SWR"

    ```tsx
    import { useInsertMutation } from '@supabase-cache-helpers/postgrest-swr'
    import { createClient } from "@supabase/supabase-js";
    import { Database } from './types'

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
    ```

=== "React Query"

    ```tsx
    import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
    import { createClient } from "@supabase/supabase-js";
    import { Database } from './types'

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
    ```

## `useUpdateMutation`

Update an entity. Requires the primary keys to be defined explicitly.

=== "SWR"

    ```tsx
    import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-swr'
    import { createClient } from "@supabase/supabase-js";
    import { Database } from './types'

    const client = createClient<Database>(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { trigger: update } = useUpdateMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'ticket_number',
        onSuccess: () => console.log('Success!'),
      });
      return <div>...</div>;
    ```

=== "React Query"

    ```tsx
    import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
    import { createClient } from "@supabase/supabase-js";
    import { Database } from './types'

    const client = createClient<Database>(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { mutateAsync: update } = useUpdateMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'ticket_number',
        onSuccess: () => console.log('Success!'),
      });
      return <div>...</div>;
    ```

## `useUpsertMutation`

Upsert entities. Requires the primary keys to be defined explicitly.

=== "SWR"

    ```tsx
    import { useUpsertMutation } from '@supabase-cache-helpers/postgrest-swr'
    import { createClient } from "@supabase/supabase-js";
    import { Database } from './types'

    const client = createClient<Database>(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { trigger: upsert } = useUpsertMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'ticket_number',
        onSuccess: () => console.log('Success!'),
      });
      return <div>...</div>;
    ```

=== "React Query"

    ```tsx
    import { useUpsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
    import { createClient } from "@supabase/supabase-js";
    import { Database } from './types'

    const client = createClient<Database>(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { mutateAsync: upsert } = useUpsertMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'ticket_number',
        onSuccess: () => console.log('Success!'),
      });
      return <div>...</div>;
    ```

## `useDeleteMutation`

Delete an item by primary key(s). Requires the primary keys to be defined explicitly.

=== "SWR"

    ```tsx
    import { useDeleteMutation } from '@supabase-cache-helpers/postgrest-swr'
    import { createClient } from "@supabase/supabase-js";
    import { Database } from './types'

    const client = createClient<Database>(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { trigger: deleteFn } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'ticket_number',
        onSuccess: () => console.log('Success!'),
      });
      return <div>...</div>;
    ```

=== "React Query"

    ```tsx
    import { useDeleteMutation } from '@supabase-cache-helpers/postgrest-react-query'
    import { createClient } from "@supabase/supabase-js";
    import { Database } from './types'

    const client = createClient<Database>(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { mutateAsync: deleteFn } = useDeleteMutation({
        query: client.from('contact'),
        primaryKeys: ['id'],
        returning: 'ticket_number',
        onSuccess: () => console.log('Success!'),
      });
      return <div>...</div>;
    ```
