---
"@supabase-cache-helpers/storage-fetcher": minor
"@supabase-cache-helpers/storage-swr": minor
---

refactor(storage): build upload path using an overwriteable fn

BREAKING: the second arg of useUpload, path, has been removed in favor of config.buildFileName
