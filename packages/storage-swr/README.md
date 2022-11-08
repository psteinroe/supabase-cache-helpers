# Storage SWR

This submodule provides convenience helpers for querying and mutating files with storage-js and SWR. 

- [⚡️ Quick Start](#️-quick-start)
- [📝 Features](#-features)
  - [Queries](#queries)
    - [`useFileUrl`](#usefileurl)
    - [`useDirectory`](#usedirectory)
    - [`useDirectoryUrls`](#usedirectoryurls)
  - [Mutations](#mutations)
    - [`useRemoveDirectory`](#useremovedirectory)
    - [`useRemoveFiles`](#useremovefiles)
    - [`useUpload`](#useupload)

## ⚡️ Quick Start
Storage-SWR is available as a package on NPM, install with your favorite package manager:

```shell
pnpm install @supabase-cache-helpers/storage-swr

npm install @supabase-cache-helpers/storage-swr

yarn add @supabase-cache-helpers/storage-swr
```

If your package manager does not install peer dependencies automatically, you will need to install them, too.

```shell
pnpm install swr@2.0.0-rc.0 react @supabase/storage-js

npm install swr@2.0.0-rc.0 react @supabase/storage-js

yarn add swr@2.0.0-rc.0 react @supabase/storage-js
```


## 📝 Features

### Queries

#### `useFileUrl`
Wrapper around `useSWR` that returns the url of a file.

Supports `private`, and `public` buckets. The third argument is an union of `SWRConfiguration` and `URLFetcherConfig`. 

```ts
type URLFetcherConfig = {
    // For private buckets only, set how long the signed url should be valid
    expiresIn?: number;
    // For public buckets only, if true queries the file using .list() 
    // and returns null if file does not exist
    ensureExistence?: boolean;
};
```

```tsx
import { useFileUrl } from '@supabase-cache-helpers/storage-swr'
import { createClient } from "@supabase/supabase-js";

const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function Page() {
    const { data: url } = useFileUrl(
    client.storage.from("public_contact_files"),
    `${dirName}/${publicFiles[0]}`,
    "public",
    {
        ensureExistence: true,
        revalidateOnFocus: false
    }
    );
    return <div>{url}</div>;
}
```

#### `useDirectory`
Wrapper around `useSWR` that returns all files of a directory.


```tsx
import { useDirectory } from '@supabase-cache-helpers/storage-swr'
import { createClient } from "@supabase/supabase-js";

const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function Page() {
    const { data: files } = useDirectory(
        client.storage.from("private_contact_files"),
        dirName,
        {
            revalidateOnFocus: false
        }
    );
    return (
        <div>
            {(files ?? []).map((f) => (
            <span key={f.name}>{f.name}</span>
            ))}
        </div>
    );
}
```

#### `useDirectoryUrls`
Convenience hook that returns the files in a directory similar to `useDirectory` but adds the `url` for each similar to `useFileUrl`.

```tsx
import { useDirectoryFileUrls } from '@supabase-cache-helpers/storage-swr'
import { createClient } from "@supabase/supabase-js";

const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function Page() {
    const { data: files } = useDirectoryFileUrls(
        client.storage.from("private_contact_files"),
        dirName,
        "private",
        {
            revalidateOnFocus: false
        }
    );
    return (
        <div>
            {(files ?? []).map((f) => (
                <span key={f.name}>{`${f.name}: ${f.url ? "exists" : f.url}`}</span>
            ))}
        </div>
    );
}
```


### Mutations
Supported operations are upload, remove files (by paths) and remove all files in a directory (non-recursive).

#### `useRemoveDirectory`
Remove all files in a directory. Does not delete files recursively.

```tsx
import { useRemoveDirectory } from '@supabase-cache-helpers/storage-swr'
import { createClient } from "@supabase/supabase-js";

const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function Page() {
    const [remove, { status }] = useRemoveDirectory(
        client.storage.from("private_contact_files")
    );
    return (
        <>
            <div data-testid="remove" onClick={() => remove(dirName)} />
            <div>{`status: ${status}`}</div>
        </>
    );
}
```
#### `useRemoveFiles`
Remove a list of files by path.

```tsx
import { useRemoveFiles } from '@supabase-cache-helpers/storage-swr'
import { createClient } from "@supabase/supabase-js";

const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

function Page() {
    const [remove, { status }] = useRemoveFiles(
        client.storage.from("private_contact_files")
    );
    return (
        <>
            <div
            data-testid="remove"
            onClick={() => remove(files.map((f) => [dirName, f].join("/")))}
            />
            <div>{`status: ${status}`}</div>
        </>
    );
}
```

#### `useUpload`
Upload a list of files. Accepts `File[]` and `FileList`. By default, the path to which the file is uploaded to is computed with `const defaultBuildFileName: BuildFileNameFn = ({ path, fileName }) => [path, fileName].filter(Boolean).join("/");`. A custom `BuildFileNameFn` can be passed to `config.buildFileName`.

```tsx
import { useUpload } from '@supabase-cache-helpers/storage-swr'
import { createClient } from "@supabase/supabase-js";

const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const dirName = 'my-directory';

function Page() {
    const [upload, { status }] = useUpload(
        client.storage.from("private_contact_files"),
        { buildFileName: ({ fileName, path }) => `${dirName}/${path}/${fileName}`}
    );
    return (
        <>
            <div data-testid="upload" onClick={() => upload({ 
                files, 
                path: "my-path" 
            })} />
            <div>{`status: ${status}`}</div>
        </>
    );
}
```