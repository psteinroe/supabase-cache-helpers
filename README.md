# Supabase Cache Helpers

<a href="https://github.com/psteinroe/supabase-cache-helpers/actions/workflows/ci.yml"><img src="https://github.com/psteinroe/supabase-cache-helpers/actions/workflows/ci.yml/badge.svg?branch=main" alt="Latest build" target="\_parent"></a>
<a href="https://github.com/psteinroe/supabase-cache-helpers"><img src="https://img.shields.io/github/stars/psteinroe/supabase-cache-helpers.svg?style=social&amp;label=Star" alt="GitHub Stars" target="\_parent"></a>

 **A collection of framework specific Cache utilities for working with <a href="https://supabase.com" alt="Supabase" target="\_parent">Supabase</a>.**

Never worry about your frontend cache again! Just define your query and mutations, and watch how the cache is automagically populated and updated.

> This project was created as part of the Supabase Launch Week 5 Hackathon. The official submission can be found in [hackathon.md](./hackathon.md).

## 📦 Packages
The cache helpers are split up into reusable libraries in the hope that adding support for other cache libraries such as `tanstack-query` will be pretty straightforward.

### Primary Packages
  - `postgrest-swr`: [SWR](https://swr.vercel.app) wrapper for [postgrest-js](https://github.com/supabase/postgrest-js)
  - [COMING SOON] `storage-swr`: [SWR](https://swr.vercel.app) wrapper for storage [storage-js](https://github.com/supabase/storage-js)

### Shared Packages
These are not meant for direct usage.
  - `eslint-config-custom`: `eslint` configurations
  - `jest-presets`: `jest` presets
  - `postgrest-fetcher`: common fetchers for [postgrest-js](https://github.com/supabase/postgrest-js)
  - `postgrest-filter`: parse a [PostgREST](https://postgrest.org/en/stable/) query into json and build a local js filter function that tries to replicate the behavior of postgres
  - `postgrest-mutate`: common mutation functions for [postgrest-js](https://github.com/supabase/postgrest-js)
  - `postgrest-shared`: utility functions and types shared among the PostgREST packages
  - [COMING SOON] `storage-fetcher`: common fetchers for [storage-js](https://github.com/supabase/storage-js) operations
  - `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## 🛠 Utilities

This turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Jest](https://jestjs.io) for testing
