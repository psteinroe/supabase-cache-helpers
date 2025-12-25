# Server Side Rendering with SWR

SWR allows a user to [pre-render with default data](https://swr.vercel.app/docs/with-nextjs). Specifically, you can either pass `fallbackData` directly to `useSWR`,

```tsx
const { data } = useSWR("/api/article", fetcher, { fallbackData });
```

or define it globally in `SWRConfig`

```tsx
<SWRConfig value={{ fallback }}>
  <Article />
</SWRConfig>
```

Supabase Cache Helpers exports helper to simplify it for every query type.

!!! warning
    Using the NextJS App Router and react server components requires importing `fetchQueryFallbackData`, `fetchOffsetPaginationFallbackData`, `fetchOffsetPaginationHasMoreFallbackData` from `@supabase-cache-helpers/postgrest-swr/react-server`. All other exports are suitable for client components only.

### `useQuery`

Fetch fallback data for `useQuery` using `fetchQueryFallbackData`.

```tsx
const buildQuery = (supabase: SupabaseClient) => {
    return supabase.from('article').select('id,title');
};

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [key, fallbackData] = await fetchQueryFallbackData(
    buildQuery(supabase),
  );
  return {
    props: {
      fallback: fallbackData,
    },
  };
}

export default function Articles({ fallback }) {
    const supabase = useSupabaseClient();

    const { data } = useQuery(buildQuery(supabase), { fallbackData: fallback });
    ...

}

```

The data can also be passed globally using `key`.

```tsx
const buildQuery = (supabase: SupabaseClient) => {
   return supabase.from('article').select('id,title');
};

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [key, fallbackData] = await fetchQueryFallbackData(
    buildQuery(supabase),
  );
  return {
    props: {
      fallback {
        [key]: fallbackData,
    },
  };
}

export default function App({ fallback }) {
    return (
        <SWRConfig value={{ fallback }}>
            <Article />
        </SWRConfig>
    )
}
```

### `useOffsetInfiniteQuery`

To fetch fallback data for `useOffsetInfiniteQuery`, use `fetchOffsetPaginationFallbackData`.

```tsx
const buildQuery = (supabase: SupabaseClient) => {
   return supabase.from('article').select('id,title');
};

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [key, fallbackData] = await fetchOffsetPaginationFallbackData(
    buildQuery(supabase), 1
  );
  return {
    props: {
      fallback: fallbackData,
    },
  };
}

export default function Articles({ fallback }) {
    const supabase = useSupabaseClient();

    const { data } = useOffsetInfiniteQuery(buildQuery(supabase), {
        pageSize: 1,
        fallbackData,
    });
    ...

}
```

!!! note
    Unfortunately, passing it globally to `SWRConfig` does not work. There seems to be an issue with `fallbackData` in `useSWRInfinite` that I could not figure out yet.

### `useOffsetInfiniteScrollQuery`

To fetch fallback data for `useOffsetInfiniteScrollQuery`, use `fetchOffsetPaginationHasMoreFallbackData`.

```tsx
const buildQuery = (supabase: SupabaseClient) => {
   return supabase.from('article').select('id,title');
};

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [key, fallbackData] = await fetchOffsetPaginationHasMoreFallbackData(
    buildQuery(supabase), 1
  );
  return {
    props: {
      fallback: fallbackData,
    },
  };
}

export default function Articles({ fallback }) {
    const supabase = useSupabaseClient();

    const { data } = useOffsetInfiniteScrollQuery(buildQuery(supabase), {
        pageSize: 1,
        fallbackData,
    });
    ...

}
```

!!! note
    Unfortunately, passing it globally to `SWRConfig` does not work. There seems to be an issue with `fallbackData` in `useSWRInfinite` that I could not figure out yet.

### `useInfiniteOffsetPaginationQuery`

To fetch fallback data for `useInfiniteOffsetPaginationQuery`, use `fetchOffsetPaginationHasMoreFallbackData`.

```tsx
const buildQuery = (supabase: SupabaseClient) => {
   return supabase.from('article').select('id,title');
};

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [key, fallbackData] = await fetchOffsetPaginationHasMoreFallbackData(
    buildQuery(supabase), 1
  );
  return {
    props: {
      fallback: fallbackData,
    },
  };
}

export default function Articles({ fallback }) {
    const supabase = useSupabaseClient();

    const { data } = useInfiniteOffsetPaginationQuery(buildQuery(supabase), {
        pageSize: 1,
        fallbackData,
    });
    ...

}
```

!!! note
    Unfortunately, passing it globally to `SWRConfig` does not work. There seems to be an issue with `fallbackData` in `useSWRInfinite` that I could not figure out yet.
