# PostgREST SWR

A collection of SWR utilities for working with Supabase.

<a href="https://github.com/psteinroe/supabase-cache-helpers/actions/workflows/ci.yml"><img src="https://github.com/psteinroe/supabase-cache-helpers/actions/workflows/ci.yml/badge.svg?branch=main" alt="Latest build" target="\_parent"></a>
<a href="https://github.com/psteinroe/supabase-cache-helpers"><img src="https://img.shields.io/github/stars/psteinroe/supabase-cache-helpers.svg?style=social&amp;label=Star" alt="GitHub Stars" target="\_parent"></a>
[![codecov](https://codecov.io/gh/psteinroe/supabase-cache-helpers/branch/main/graph/badge.svg?token=SPMWSVBRGX)](https://codecov.io/gh/psteinroe/supabase-cache-helpers)
## Introduction

The cache helpers bridge the gap between popular frontend cache management solutions such as [SWR](https://swr.vercel.app) or [React Query](https://tanstack.com/query/latest), and the Supabase client libraries. All features of [`postgrest-js`](https://github.com/supabase/postgrest-js), [`storage-js`](https://github.com/supabase/storage-js) and [`realtime-js`](https://github.com/supabase/realtime-js) are supported. It also provides a simple server-side abstraction to cache queries to the `PostgREST` API. The cache helpers parse any query into a unique and definite query key, and automatically populates your query cache with every mutation using implicit knowledge of the schema. Check out the [demo](https://supabase-cache-helpers-swr.vercel.app) and find out how it feels like for your users.

## Features

With just one single line of code, you can simplify the logic of **fetching, subscribing to updates, and mutating data as well as storage objects** in your project, and have all the amazing features of [SWR](https://swr.vercel.app) or [React Query](https://tanstack.com/query/latest) out-of-the-box.

- **Seamless** integration with [SWR](https://swr.vercel.app) and [React Query](https://tanstack.com/query/latest)
- Support for **Server-Side** queries
- **Automatic** cache key generation
- Easy **Pagination** and **Infinite Scroll** queries
- **Insert**, **update**, **upsert** and **delete** mutations
- **Auto-populate** cache after mutations and subscriptions
- **Auto-expand** mutation queries based on existing cache data to keep app up-to-date
- One-liner to upload, download and remove **Supabase Storage** objects

And a lot [more](https://psteinroe.github.io/supabase-cache-helpers/).

---

**View full documentation and examples on [psteinroe.github.io/supabase-cache-helpers](https://psteinroe.github.io/supabase-cache-helpers/).**


