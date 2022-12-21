# PostgREST Filter

This package provides a few utility classes around PostgREST queries.

## Installation

```sh
pnpm install @supabase-cache-helpers/postgrest-filter

npm install @supabase-cache-helpers/postgrest-filter

yarn add @supabase-cache-helpers/postgrest-filter
```

## `PostgrestQueryParser` and `PostgrestParser`

`PostgrestQueryParser` decompose the select and filter query parameters of a PostgREST query into JSON.

`PostgrestParser` extends `PostgrestQueryParser` and extracts all relevant information from a `PostrestFilterBuilder` instance (schema, table, body, count, head, ...) and parse them into definite keys.

Here is an example:

```ts
const p = new PostgrestParser(
  c
    .from("test")
    .select(
      `name,
           city:cities (
            test:name
          ),
          countries (
            capital,
            population,
            some_ref (
              test:first,
              second
            )
          )`,
      { head: false, count: "exact" }
    )
    .or(
      "full_name.eq.20,test.neq.true,and(full_name.eq.Test Name,email.eq.test@mail.com)"
    )
    .eq("id", "123")
    .contains("id", "456")
);
console.log(p.bodyKey); // undefined
console.log(p.count); // exact
console.log(p.isHead); // false
console.log(p.queryKey); // id=cs.456&id=eq.123&or=%28full_name.eq.20%2Ctest.neq.true%2Cand%28full_name.eq.Test+Name%2Cemail.eq.test%40mail.com%29%29&select=name%2Ccity%3Acities%28test%3Aname%29%2Ccountries%28capital%2Cpopulation%2Csome_ref%28test%3Afirst%2Csecond%29%29
console.log(p.schema); // undefined --> default schema
console.log(p.table); // test
console.log(p.paths);
//  [
//    { alias: undefined, path: "name" },
//    { alias: "city.test", path: "cities.name" },
//    { alias: undefined, path: "countries.capital" },
//    { alias: undefined, path: "countries.population" },
//    {
//      alias: "countries.some_ref.test",
//      path: "countries.some_ref.first",
//    },
//    { alias: undefined, path: "countries.some_ref.second" },
//  ];
console.log(JSON.stringify(p.filters, null, 2));
// [
//   {
//     or: [
//       {
//         path: "full_name",
//         negate: false,
//         operator: "eq",
//         value: 20,
//       },
//       {
//         path: "test",
//         negate: false,
//         operator: "neq",
//         value: true,
//       },
//       {
//         and: [
//           {
//             path: "full_name",
//             negate: false,
//             operator: "eq",
//             value: "Test Name",
//           },
//           {
//             path: "email",
//             negate: false,
//             operator: "eq",
//             value: "test@mail.com",
//           },
//         ],
//       },
//     ],
//   },
//   {
//     path: "id",
//     negate: false,
//     operator: "eq",
//     value: 123,
//   },
//   {
//     path: "id",
//     negate: false,
//     operator: "cs",
//     value: 456,
//   },
// ];
```

## `PostgrestFilter`

Use the filters and selected paths extracted from `PostgrestQueryParser` to build a filter function.

- `.hasPaths(input): boolean` checks that the input has a value (not undefined) for all `.paths`
- `.applyFilters(input): boolean` applies all `.filters` to the input
- `.apply(input): boolean` applies both of the above

Here is an example:

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

## Limitations

- When mutating data, we oftentimes do not use the same mapped paths despite it being the same object. Hence, the .`hasPath()` function should try to transform the input object using the knowledge it has about paths and aliases of the expected obejct.
