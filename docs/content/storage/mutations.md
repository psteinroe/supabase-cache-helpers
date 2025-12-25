# Mutations

The cache helpers query hooks wrap the mutation hooks of the cache libraries and automatically revalidate the relevant queries across your app. For example, if you list all files in `dirname/` with `useDirectory`, and upload a new file into `dirname/file.jpg`, the query is revalidated after the upload succeeded. The same goes for file removals.

## `useUpload`

Upload a list of files. Accepts `File[]`, `FileList` and `{ data: ArrayBuffer; type: string; name: string }` objects. The latter is primarily useful for uploading from React Native. By default, the path to which the file is uploaded to is computed with

```ts
const defaultBuildFileName: BuildFileNameFn = ({ path, fileName }) =>
  [path, fileName].filter(Boolean).join("/");
```

A custom `BuildFileNameFn` can be passed to `config.buildFileName`.

=== "SWR"

    ```tsx
    import { useUpload } from '@supabase-cache-helpers/storage-swr';
    import { createClient } from '@supabase/supabase-js';

    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const dirName = 'my-directory';

    function Page() {
      const { trigger: upload } = useUpload(
        client.storage.from('private_contact_files'),
        { buildFileName: ({ fileName, path }) => `${dirName}/${path}/${fileName}` }
      );
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useUpload } from '@supabase-cache-helpers/storage-react-query';
    import { createClient } from '@supabase/supabase-js';

    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const dirName = 'my-directory';

    function Page() {
      const { mutateAsync: upload } = useUpload(
        client.storage.from('private_contact_files'),
        { buildFileName: ({ fileName, path }) => `${dirName}/${path}/${fileName}` }
      );
      return <div>...</div>;
    }
    ```

## `useRemoveDirectory`

Remove all files in a directory. Does not delete files recursively.

=== "SWR"

    ```tsx
    import { useRemoveDirectory } from '@supabase-cache-helpers/storage-swr';
    import { createClient } from '@supabase/supabase-js';

    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { trigger: remove } = useRemoveDirectory(
        client.storage.from('private_contact_files')
      );
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useRemoveDirectory } from '@supabase-cache-helpers/storage-react-query';
    import { createClient } from '@supabase/supabase-js';

    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { mutateAsync: remove } = useRemoveDirectory(
        client.storage.from('private_contact_files')
      );
      return <div>...</div>;
    }
    ```

## `useRemoveFiles`

Remove a list of files by paths.

=== "SWR"

    ```tsx
    import { useRemoveFiles } from '@supabase-cache-helpers/storage-swr';
    import { createClient } from '@supabase/supabase-js';

    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { trigger: remove } = useRemoveFiles(
        client.storage.from('private_contact_files')
      );
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useRemoveFiles } from '@supabase-cache-helpers/storage-react-query';
    import { createClient } from '@supabase/supabase-js';

    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { mutateAsync: remove } = useRemoveFiles(
        client.storage.from('private_contact_files')
      );
      return <div>...</div>;
    }
    ```
