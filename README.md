# Supabase Cache Helpers

<a href="https://github.com/psteinroe/supabase-cache-helpers/actions/workflows/ci.yml"><img src="https://github.com/psteinroe/supabase-cache-helpers/actions/workflows/ci.yml/badge.svg?branch=main" alt="Latest build" target="\_parent"></a>
<a href="https://github.com/psteinroe/supabase-cache-helpers"><img src="https://img.shields.io/github/stars/psteinroe/supabase-cache-helpers.svg?style=social&amp;label=Star" alt="GitHub Stars" target="\_parent"></a>
[![codecov](https://codecov.io/gh/psteinroe/supabase-cache-helpers/branch/main/graph/badge.svg?token=SPMWSVBRGX)](https://codecov.io/gh/psteinroe/supabase-cache-helpers)

**A collection of framework specific Cache utilities for working with <a href="https://supabase.com" alt="Supabase" target="\_parent">Supabase</a>.**

> This project was initially created as part of the Supabase Launch Week 5 Hackathon and was awarded "Best Overall Project" 🥇. The official submission can be found in [hackathon.md](./hackathon.md).

The cache helpers bridge the gap between popular frontend cache management solutions such as SWR and React Query, and Supabase client libraries. It supports PostgREST, Supabase Storage and Supabase Realtime and leverages implicit knowledge of the schema to keep your data up-to-date across all queries. Check out the [demo](TODO) and find out how it feels like for your users.

All the benefits come with as little boilerplate as possible.

```tsx
import {
  useQuery,
  useInsertMutation,
  useSubscription,
} from "@supabase-cache-helpers/postgrest-swr";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const client = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function Page() {
  // Define the query. Special hooks for pagination and infinite scrolling are also available.
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

  // Define the mutation. update, upsert, and delete are also supported.
  // The cache is automatically populated when data comes in.
  const [insert] = useInsertMutation(client.from("contact"), ["id"]);

  // Subscripe to a change. The cache is automatically populated when data comes in.
  const { status } = useSubscription(
    client.channel("random"),
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

## 📦 Packages

The cache helpers are split up into reusable libraries.

### Primary Packages

- [`postgrest-swr`](./packages/postgrest-swr/README.md): [SWR](https://swr.vercel.app) wrapper for [postgrest-js](https://github.com/supabase/postgrest-js).
  - [⚡️ Quick Start](./packages/postgrest-swr/README.md/#⚡️-quick-start)
- [`storage-swr`](./packages/storage-swr/README.md): [SWR](https://swr.vercel.app) wrapper for storage [storage-js](https://github.com/supabase/storage-js)
- [`postgrest-react-query`](./packages/postgrest-react-query/README.md): [React Query](https://tanstack.com/query/latest) wrapper for [postgrest-js](https://github.com/supabase/postgrest-js).
  - [⚡️ Quick Start](./packages/postgrest-react-query/README.md/#⚡️-quick-start)

### Shared Packages

These are not meant for direct usage.

- `eslint-config-custom`: `eslint` configurations
- `jest-presets`: `jest` presets
- `postgrest-fetcher`: common fetchers for [postgrest-js](https://github.com/supabase/postgrest-js)
- `postgrest-filter`: parse a [PostgREST](https://postgrest.org/en/stable/) query into json and build a local js filter function that tries to replicate the behavior of postgres
- `postgrest-mutate`: common mutation functions for [postgrest-js](https://github.com/supabase/postgrest-js)
- `postgrest-shared`: utility functions and types shared among the PostgREST packages
- `storage-fetcher`: common fetchers for [storage-js](https://github.com/supabase/storage-js) operations
- `storage-mutate`: common mutation functions for [storage-js](https://github.com/supabase/storage-js) operations
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## ❤️ Sponsors

<table>
  <tr>
    <td align="center">
      <a href="https://hellomateo.de">
        <img src="https://avatars.githubusercontent.com/u/72967210?s=200&v=4" style="width:100px;border-radius:50%" alt="Mateo" />
      </a>
      <br />
      <b>Mateo</b>
      <br />
      (we are <a href="https://join.com/companies/mateoestate/5588976-senior-frontend-developer">hiring</a>!)
    </td>
     <td align="center">
      <a href="https://supabase.com/">
        <img src="https://avatars.githubusercontent.com/u/54469796?s=200&v=4" style="width:100px;border-radius:50%" " alt="Supabase" />
      </a>
      <br />
      <b>Supabase</b>
      <br />
      <a href="https://supabase.com">https://supabase.com</a>
      <br />
    </td>
    <td align="center">
      <a href="https://github.com/Marviel">
        <img src="https://avatars.githubusercontent.com/u/2037165?v=4" style="width:100px;border-radius:50%" " alt="Marviel" />
      </a>
      <br />
      <b>Luke Bechtel</b>
      <br />
      <a href="https://github.com/Marviel">@Marviel</a>
      <br />
    </td>
  </tr>
</table>

## 🛠 Utilities

This turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Jest](https://jestjs.io) for testing
