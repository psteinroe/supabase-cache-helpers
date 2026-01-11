# Queries

The cache helpers query hooks wrap the data fetching hooks of the cache libraries and pass both the cache key and the fetcher function from on the PostgREST query. This is enabled primarily by a parser that turns any Supabase PostgREST query into a definite cache key. For example,

```ts
client
  .from("contact")
  .select("id,username,ticket_number", { count: "exact" })
  .eq("username", "psteinroe");
```

is parsed into

=== "SWR"

    ```
    postgrest$null$public$contact$select=id%2Cusername%2Cticket_number&username=eq.psteinroe$null$count=exact$head=false$
    ```

=== "React Query"

    ```
    [ 'postgrest', 'null', 'public', 'contact',
    'select=id%2Cusername%2Cticket_number&username=eq.psteinroe', 'null',
    'count=exact', 'head=false', '' ]
    ```

!!! warning
    Although you can use wildcards (`*`) in your query, their usage is only recommended for `head: true` and `count: true` queries. For any other query, you should be explicit about the columns you want to select. Only then is cache helpers able to do granular cache updates without refetching.

## `useQuery`

Wrapper around the default data fetching hook that returns the query including the count without any modification of the data. All hooks accept a single options object with the `query` property and any additional configuration options from the respective library.

=== "SWR"

    ```tsx
    import { useQuery } from "@supabase-cache-helpers/postgrest-swr";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
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

## `usePaginatedQuery`

A hook for traditional pagination with total page count. Unlike the infinite query hooks, this hook runs a separate count query to know the total number of pages upfront. This is useful when you need to show a page selector (e.g., "Page 1 of 10").

The count query is optimized to use `HEAD` requests and `select('*')` when possible (unless the query contains inner joins that would affect the count).

=== "SWR"

    ```tsx
    import { usePaginatedQuery } from '@supabase-cache-helpers/postgrest-swr';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const {
        data,
        count,
        page,
        pageSize,
        totalPages,
        setPage,
        nextPage,
        previousPage,
        hasNextPage,
        hasPreviousPage,
        isLoading,
        error,
      } = usePaginatedQuery({
        query: () => client
          .from('contact')
          .select('id,username')
          .order('username', { ascending: true }),
        pageSize: 10,
        countType: 'exact', // 'exact' | 'planned' | 'estimated'
      });

      return (
        <div>
          {data?.map((item) => <div key={item.id}>{item.username}</div>)}
          <div>
            Page {page + 1} of {totalPages} ({count} total items)
          </div>
          <button onClick={previousPage ?? undefined} disabled={!previousPage}>
            Previous
          </button>
          <button onClick={nextPage ?? undefined} disabled={!nextPage}>
            Next
          </button>
        </div>
      );
    }
    ```

=== "React Query"

    ```tsx
    import { usePaginatedQuery } from '@supabase-cache-helpers/postgrest-react-query';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const {
        data,
        count,
        page,
        pageSize,
        totalPages,
        setPage,
        nextPage,
        previousPage,
        hasNextPage,
        hasPreviousPage,
        isLoading,
        isFetching,
        error,
      } = usePaginatedQuery({
        query: () => client
          .from('contact')
          .select('id,username')
          .order('username', { ascending: true }),
        pageSize: 10,
        countType: 'exact', // 'exact' | 'planned' | 'estimated'
      });

      return (
        <div>
          {data?.map((item) => <div key={item.id}>{item.username}</div>)}
          <div>
            Page {page + 1} of {totalPages} ({count} total items)
          </div>
          <button onClick={previousPage ?? undefined} disabled={!previousPage}>
            Previous
          </button>
          <button onClick={nextPage ?? undefined} disabled={!nextPage}>
            Next
          </button>
        </div>
      );
    }
    ```

## `useInfiniteOffsetPaginationQuery`

Wrapper around the infinite hooks that transforms the data into pages and returns helper functions to paginate through them. The `range` filter is automatically applied based on the `pageSize` parameter. The respective configuration options can be passed as part of the options object.

`nextPage()` and `previousPage()` are `null` if there is no next or previous page respectively. `setPage` allows you to jump to a page.

The hook does not use a count query and therefore does not know how many pages there are in total. Instead, it queries one item more than the `pageSize` to know whether there is another page after the current one.

=== "SWR"

    ```tsx
    import { useInfiniteOffsetPaginationQuery } from '@supabase-cache-helpers/postgrest-swr';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const {
        currentPage,
        nextPage,
        previousPage,
        setPage,
        pages,
        pageIndex,
        isValidating,
        error,
      } = useInfiniteOffsetPaginationQuery({
        query: () => client
          .from('contact')
          .select('id,username')
          .order('username', { ascending: true }),
        pageSize: 1,
        revalidateOnReconnect: true,
      });
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useInfiniteOffsetPaginationQuery } from '@supabase-cache-helpers/postgrest-react-query';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const {
        currentPage,
        nextPage,
        previousPage,
        setPage,
        pages,
        pageIndex,
        isFetching,
        error,
      } = useInfiniteOffsetPaginationQuery({
        query: () => client
          .from('contact')
          .select('id,username')
          .order('username', { ascending: true }),
        pageSize: 1,
      });
      return <div>...</div>;
    }
    ```

## `useOffsetInfiniteScrollQuery`

Wrapper around the infinite hooks that transforms the data into a flat list and returns a `loadMore` function. The `range` filter is automatically applied based on the `pageSize` parameter.

`loadMore()` is `undefined` if there is no more data to load.

The hook does not use a count query and therefore does not know how many items there are in total. Instead, it queries one item more than the `pageSize` to know whether there is more data to load.

=== "SWR"

    ```tsx
    import { useOffsetInfiniteScrollQuery } from '@supabase-cache-helpers/postgrest-swr';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { data, loadMore, isValidating, error } = useOffsetInfiniteScrollQuery({
        query: () => client
          .from('contact')
          .select('id,username')
          .order('username', { ascending: true }),
        pageSize: 1,
      });
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useOffsetInfiniteScrollQuery } from '@supabase-cache-helpers/postgrest-react-query';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { data, loadMore, isFetchingNextPage, error } = useOffsetInfiniteScrollQuery({
        query: () => client
          .from('contact')
          .select('id,username')
          .order('username', { ascending: true }),
        pageSize: 1,
      });
      return <div>...</div>;
    }
    ```

## `useCursorInfiniteScrollQuery`

!!! warning
    After using this hook in production, a few subtile issues were discovered. Please use it with caution. While improving the stability, I might introduce breaking changes.

Similar to `useOffsetInfiniteScrollQuery`, but instead of using the `offset` filter to paginate, it uses a cursor. You can find a longer rationale on why this is more performant than offset-based pagination [here](https://the-guild.dev/blog/graphql-cursor-pagination-with-postgresql#).

For the cursor pagination to work, the query _has to have_:

- at least one `order` clause on a column that is unique,
- all ordered column in the `select` clause,
- and a `limit` clause that defines page size.

`loadMore()` is `undefined` if there is no more data to load.

The hook does not use a count query and therefore does not know how many items there are in total. `loadMore` will always be truthy if the last page had a number of elements equal to the page size.

You need to provide the `orderBy` (and optionally `uqOrderBy`) properties to the options object:

- `orderBy`: The column to order by
- `uqOrderBy`: If the `orderBy` column is not unique, you need to provide a second, unique column. This can be the primary key.

Both columns needs to have an `order` clause on the query. If your primary ordering column is not unique, you need to provide a second column that is unique. This can be the primary key of the table. Otherwise, we might skip values. For an in-depth explanation, check out [this blogpost](https://medium.com/@ietienam/efficient-pagination-with-postgresql-using-cursors-83e827148118).

=== "SWR"

    ```tsx
    import { useCursorInfiniteScrollQuery } from '@supabase-cache-helpers/postgrest-swr';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { data, loadMore, isValidating, error } =
        useCursorInfiniteScrollQuery({
          query: () => client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true })
            .order('id', { ascending: true })
            .limit(1),
          orderBy: 'username',
          uqOrderBy: 'id',
          revalidateOnFocus: false,
        });

      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useCursorInfiniteScrollQuery } from '@supabase-cache-helpers/postgrest-react-query';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { data, loadMore, isFetchingNextPage, error } =
        useCursorInfiniteScrollQuery({
          query: () => client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true })
            .order('id', { ascending: true })
            .limit(1),
          orderBy: 'username',
          uqOrderBy: 'id',
        });

      return <div>...</div>;
    }
    ```

## `useOffsetInfiniteQuery`

Wrapper around the infinite hook that returns the query without any modification of the data.

=== "SWR"

    ```tsx
    import { useOffsetInfiniteQuery } from '@supabase-cache-helpers/postgrest-swr';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { data, size, setSize, isValidating, error, mutate } = useOffsetInfiniteQuery({
        query: () => client
          .from('contact')
          .select('id,username')
          .order('username', { ascending: true }),
        pageSize: 1,
      });
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useOffsetInfiniteQuery } from '@supabase-cache-helpers/postgrest-react-query';
    import { createClient } from '@supabase/supabase-js';
    import { Database } from './types';

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { data, fetchNextPage, hasNextPage, isFetching, error } = useOffsetInfiniteQuery({
        query: () => client
          .from('contact')
          .select('id,username')
          .order('username', { ascending: true }),
        pageSize: 1,
      });
      return <div>...</div>;
    }
    ```

## Using Infinite Queries with RPCs

At some point, you might start to write RPCs to optimse specific queries. In these cases, you most likely want to "push down" the pagination into the RPC. For this case, all infinite query hooks accept an `rpcArgs` property in their options. If set, the pagination will be applied to the body of the RPC instead of the query:

```tsx
import { useCursorInfiniteScrollQuery } from '@supabase-cache-helpers/postgrest-swr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const client = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function Page() {
  const { data, loadMore, isValidating, error } =
    useCursorInfiniteScrollQuery({
      query: () => client
        .rpc('contacts_cursor', {
          v_username_filter: `${testRunPrefix}%`,
          v_limit: 2,
        })
        .select('username'),
      orderBy: 'username',
      uqOrderBy: 'id',
      rpcArgs: {
        // the "username" cursor value will be passed as `v_username_cursor` to the RPC
        orderBy: 'v_username_cursor',
        // the "id" cursor value will be passed as `v_id_cursor` to the RPC
        uqOrderBy: 'v_id_cursor',
      },
    });

  return <div>...</div>;
}
```
