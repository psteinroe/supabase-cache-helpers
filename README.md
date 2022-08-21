# supabase-cache-helpers

A collection of framework specific Cache utilities for working with Supabase.

## Supabase Launch Week Hackathon 5 Submission

### Team

- [psteinroe](https://twitter.com/psteinroe)
- Many thanks to [dwome](https://github.com/dwome) who I bounced some of the ideas off!

### Why?

To maximize our velocity at [hellomateo](https://hellomateo.de) (we are hiring!), we always try to minimize the surface area of the tech. In other words, write as little code as possible.[[1]](https://paul.copplest.one/blog/nimbus-tech-2019-04.html) As our apps grow, our queries become more complex. At one point, we found ourselves writing a lot of repetitive code to query data, define cache keys and update the cache after mutations. Imagine a Master-Detail view. When using SWR, you will probably end up with something like this

```ts
const { data: posts, error } = useSWR("posts", () => {
  const { data: posts, error } = await supabase.from("posts").select("*");

  if (error) throw error.message;
  return posts;
});
```

Now you add filters...

```tsx
const { data: posts, error } = useSWR("posts?is_published=true", () => {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("is_published", true);

  if (error) throw error.message;
  return posts;
});
```

You can see how this becomes very cumbersome over time. It is even more fun if you want to mutate the data, e.g. insert a new post without waiting for SWR to revalidate. To make it a smooth experience for the user, the new post should appear in the list(s) instantly, and not only after a revalidation. This can be implemented by mutating the respective cache keys. But how to know what cache keys should be mutated? One would have to decode the keys and check if the table as well as the applied filters match. Imagine doing that for large queries with a lot of filters. Not fun. But what if we could implement a generalizable solution?

### How?

Now that you got the pain, here is the solution that these libaries attempt to offer:

**1. Provide query utilities that turn any supabase query into a definite cache key.**

```tsx
// The query
const { data } = useQuery(
  client
    .from<Contact>("contact")
    .select(
      "id,created_at,username,ticket_number,golden_ticket,tags,age_range,hello:metadata->>hello,catchphrase,country!inner(code,mapped_name:name,full_name)"
    )
    .eq("username", "psteinroe"),
  "single" // also works with "maybeSingle" and "multiple"
);
// is encoded into this SWR cache key
// postgrest$default$contact$select=id%2Ccreated_at%2Cusername%2Cticket_number%2Cgolden_ticket%2Ctags%2Cage_range%2Chello%3Ametadata-%3E%3Ehello%2Ccatchphrase%2Ccountry%21inner%28code%2Cmapped_name%3Aname%2Cfull_name%29&username=eq.psteinroe$null$count=null$head=false
```
There are also a few pagination goodies included. Check out the full list of query hooks [here](https://github.com/psteinroe/supabase-cache-helpers/tree/main/packages/postgrest-swr).

**2. Provide mutation utilities that update the cache automagically.**
```tsx
const { data, count } = useQuery(
        client
          .from("contact")
          .select("id,username", { count: "exact" })
          .eq("username", 'supaname'),
        "multiple"
      );
const [insert] = useInsertMutation(client.from<Contact>("contact"));

return (
  // If you click the button, "data" will contain the new contact immediately.
  <button onClick={async () => await insert({ username: 'supaname' })} />
);
```
Almost all operators are supported. Check out the full list [here](https://github.com/psteinroe/supabase-cache-helpers/blob/main/packages/postgrest-filter/src/lib/operators.ts).

### ...but, how?
Under the hood, `postgrest-swr` uses `postgrest-filter`. A few lines of code are worth more than a thousand words, so here is what it can do:
```ts
const filter = PostgrestFilter.fromFilterBuilder(
    supabase
      .from("contact")
      .select(
        "id,username,ticket_number,golden_ticket,tags,country!inner(code,name,full_name)"
      )
      .or(`username.eq.unknown,and(ticket_number.eq.2,golden_ticket.is.true)`)
      .is("golden_ticket", true)
      .in("username", ["thorwebdev"])
      .contains("tags", ["supateam"])
      .or("name.eq.unknown,and(name.eq.Singapore,code.eq.SG)", {
        foreignTable: "country",
      })
  );
console.log(
  filter.apply({
    id: "68d2e5ef-d117-4f0c-abc7-60891a643571",
    username: "thorwebdev",
    ticket_number: 2,
    golden_ticket: false,
    tags: ["supateam", "investor"],
    country: {
      code: "SG",
      name: "Singapore",
      full_name: "Republic of Singapore",
    },
  })
); // --> false
console.log(
  filter.apply({
    id: "68d2e5ef-d117-4f0c-abc7-60891a643571",
    created_at: "2022-08-19T15:30:33.072441+00:00",
    username: "thorwebdev",
    ticket_number: 2,
    golden_ticket: true,
    tags: ["supateam", "investor"],
    country: {
      code: "SG",
      name: "Singapore",
      full_name: "Republic of Singapore",
    },
  })
); // --> true
```
When a mutation was successful, the cache keys are scanned for relevant entries. For each of them, a `PostgrestFilter` is created. If `.apply(input)` returns true, the item is added to the cache. Upsert, update and remove are implemented in a similar manner. Its a bit more complex than that, and I will work on a better documentation. For now, checkout the tests for a better understanding.

## Packages
I tried my best to split up the implementation into reusable libraries in the hope that adding support for other cache libraries such as `tanstack-query` will be pretty straightforward.

- Packages
  - `eslint-config-custom`: `eslint` configurations
  - `jest-presets`: `jest` presets
  - `postgrest-fetcher`: common fetchers for postgrest-js operations
  - `postgrest-filter`: parse a postgrest query into json and build a local js filter function that tries to replicate the behavior of postgres locally
  - `postgrest-mutate`: common mutation functions for postgrest
  - `postgrest-shared`: utilites shared among the postgrest packages
  - `postgrest-swr`: SWR implementation for postgrest
  - `shared`: For now, this package contains only the generated types of the test schema
  - [COMING SOON] `storage-fetcher`: common fetchers for storage-js operations
  - [COMING SOON] `storage-swr`: SWR implementation for storage
  - `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## Utilities

This turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Jest](https://jestjs.io) for testing
