### PostgREST SWR

This submodule provides convenience helpers for querying and mutating data with postgrest-js and SWR. It is designed to work as black box that "just works (most of the time)".

## Installation

Use your favorite package manager: 
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

useInsertMutation
useUpdateMutation
useDeleteMutation
useUpsertMutation
