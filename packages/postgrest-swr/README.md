# PostgREST SWR

This submodule provides convenience helpers for querying and mutating data with postgrest-js and SWR. It is designed to work as black box that "just works (most of the time)".

## Installation

```sh
pnpm install @supabase-cache-helpers/postgrest-swr

npm install @supabase-cache-helpers/postgrest-swr

yarn add @supabase-cache-helpers/postgrest-swr
```

## Queries

### `useQuery`
Wrapper around `useSWR` that returns the query including the count without any modification of the data.

Supports `single`, `maybeSingle` and `multiple`. The `SWRConfiguration` can be passed as third argument.

```tsx
function Page() {
    const { data, count, isValidating, mutate, error } = useQuery(
    client
        .from("contact")
        .select("id,username", { count: "exact" })
        .eq("username", "psteinroe"),
    "multiple",
    { revalidateOnFocus: false }
    );
    return (
    <div>
        <div>
        {(data ?? []).find((d) => d.username === "psteinroe")?.username}
        </div>
        <div data-testId="count">{count}</div>
    </div>
    );
}
```

### `usePaginationQuery`
Wrapper around `useSWRInfinite` that transforms the data into pages and returns helper functions to paginate through them. The `range` filter is automatically applied based on the `pageSize` parameter. The `SWRConfigurationInfinite` can be passed as second argument.

`nextPage()` and `previousPage()` are `undefined` if there is no next or previous page respectively. `setPage` allows you to jump to a page.

The hook does not use a count query and therefore does not know how many pages there are in total. Instead, it queries one item more than the `pageSize` to know whether there is another page after the current one.

```tsx
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
    } = usePaginationQuery(
    client
        .from("contact")
        .select("id,username")
        .order("username", { ascending: true }),
    { pageSize: 1, revalidateOnReconnect: true }
    );
    return (
        <div>
            {nextPage && (
            <div data-testid="nextPage" onClick={() => nextPage()} />
            )}
            {previousPage && (
            <div data-testid="previousPage" onClick={() => previousPage()} />
            )}
            <div data-testid="goToPageZero" onClick={() => setPage(0)} />
            <div data-testid="currentPage">
            {(currentPage ?? []).map((p) => (
                <div key={p.id}>{p.username}</div>
            ))}
            </div>
            <div data-testid="pages">
            {(pages ?? []).flat().map((p) => (
                <div key={p.id}>{p.id}</div>
            ))}
            </div>
            <div data-testid="pageIndex">{pageIndex}</div>
        </div>
    );
}
```

### `useInfiniteScrollQuery`
Wrapper around `useSWRInfinite` that transforms the data into a flat list and returns a `loadMore` function. The `range` filter is automatically applied based on the `pageSize` parameter. The `SWRConfigurationInfinite` can be passed as second argument.

`loadMore()` is `undefined` if there is no more data to load.

The hook does not use a count query and therefore does not know how many items there are in total. Instead, it queries one item more than the `pageSize` to know whether there is more data to load.

```tsx
function Page() {
    const { data, loadMore, isValidating, error } = useInfiniteScrollQuery(
    client
        .from("contact")
        .select("id,username")
        .order("username", { ascending: true }),
    { pageSize: 1 }
    );
    return (
    <div>
        {loadMore && (
        <div data-testid="loadMore" onClick={() => loadMore()} />
        )}
        <div data-testid="list">
        {(data ?? []).map((p) => (
            <div key={p.id}>{p.username}</div>
        ))}
        </div>
    </div>
    );
}
```

### `useInfiniteQuery`
Wrapper around `useSWRInfinite` that returns the query without any modification of the data. The `SWRConfigurationInfinite` can be passed as second argument.

```tsx
function Page() {
    const { data, size, setSize, isValidating, error, mutate } =
        useInfiniteQuery(
            client
            .from("contact")
            .select("id,username")
            .order("username", { ascending: true }),
            { pageSize: 1 }
        );
        return (
        <div>
            <div data-testid="setSizeTo3" onClick={() => setSize(3)} />
            <div data-testid="list">
            {(data ?? []).flat().map((p) => (
                <div key={p.id}>{p.username}</div>
            ))}
            </div>
            <div data-testid="size">{size}</div>
        </div>
        );
    }
```

### `useCountedPagination`
Helper hook that combines a count query with a pagination query and returns a very similar API as `usePaginationQuery` does, but instead of fetching one more item to know whether there is a next page, it is aware of the total number of pages. The `range` filter is automatically applied based on the `pageSize` parameter. Please note that the `pageSize` argument of the hook must match the pageSize argument of the `dataQuery` hook.

```tsx
function Page() {
    const {
        currentPage,
        nextPage,
        previousPage,
        setPage,
        pages,
        pageIndex,
        pageCount,
    } = useCountedPagination({
    pageSize: 1,
    countQuery: useQuery(
        client
        .from("contact")
        .select("id,username", { count: "exact", head: true })
        .order("username", { ascending: true }),
        "multiple"
    ),
    dataQuery: useInfiniteQuery(
        client
        .from("contact")
        .select("id,username")
        .order("username", { ascending: true }),
        { pageSize: 1 }
    ),
    });
    return (
    <div>
        {nextPage && (
            <div data-testid="nextPage" onClick={() => nextPage()} />
        )}
        {previousPage && (
            <div data-testid="previousPage" onClick={() => previousPage()} />
        )}
        <div data-testid="goToPageZero" onClick={() => setPage(0)} />
        <div data-testid="currentPage">
            {(currentPage ?? []).map((p) => (
                <div key={p.id}>{p.username}</div>
            ))}
        </div>
        <div data-testid="pages">
            {(pages ?? []).flat().map((p) => (
                <div key={p.id}>{p.id}</div>
            ))}
        </div>
        <div data-testid="pageIndex">{pageIndex}</div>
        <div data-testid="pageCount">{pageCount}</div>
    </div>
    );
    }
```

## Mutations
Supported operations are insert, update, upsert and delete. Right now, inserting multiple items is not supported, but upserting multiple items is. Further, the mutations always apply `.select(*)` and return the entire row.

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
    schema?: string;
};
```
### `useInsertMutation`
Insert an item. Will also update the count if applicable.

```tsx
function Page() {
    const { data, count } = useQuery(
    client
        .from("contact")
        .select("id,username", { count: "exact" })
        .eq("username", "supausername"),
    "multiple"
    );
    const [insert] = useInsertMutation(client.from("contact"));
    return (
    <div
        data-testid="insert"
        onClick={async () => await insert({ username: "supausername" })}
    >
        <span>{data?.find((d) => d.username === "supausername")?.username}</span>
        <span data-testid="count">{`count: ${count}`}</span>
    </div>
    );
```
### `useUpdateMutation`
Update an item. Requires the primary keys to be defined explicitly.

```tsx
function Page() {
    const { data, count } = useQuery(
    client
        .from("contact")
        .select("id,username", { count: "exact" })
        .eq("username", ['supaname', 'supadupaname']),
    "multiple"
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

### `useDeleteMutation`
Delete an item by primary key(s). Requires the primary keys to be defined explicitly. Will also update the count of the queries.

```tsx
function Page() {
      const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .eq("username", 'supaname'),
        "multiple"
      );
      const [deleteContact] = useDeleteMutation(client.from("contact"), ["id"]);
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
### `useUpsertMutation`
Upsert one or multiple items. Requires the primary keys to be defined explicitly. Will also add one to the count if an item is inserted.

```tsx
function Page() {
    const { data, count } = useQuery(
    client
        .from("contact")
        .select("id,username,golden_ticket", { count: "exact" })
        .in("username", [USERNAME, USERNAME_2]),
    "multiple");

    const [upsertMany] = useUpsertMutation(
        client.from("contact"),
        "multiple",
        ["id"]
    );

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
        <span key={d.id}>
            {`${d.username} - ${d.golden_ticket ?? "null"}`}
        </span>
        ))}
        <span data-testid="count">{`count: ${count}`}</span>
    </div>
    );
    }
```