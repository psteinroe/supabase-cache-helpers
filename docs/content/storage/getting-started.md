# Getting Started

## Installation

Inside your React project directory, run the following:

=== "SWR"

    ```bash
    pnpm add @supabase-cache-helpers/storage-swr
    ```

=== "React Query"

    ```bash
    pnpm add @supabase-cache-helpers/storage-react-query
    ```

If your package manager does not install peer dependencies automatically, you will need to install them, too.

=== "SWR"

    ```bash
    pnpm add swr react @supabase/storage-js
    ```

=== "React Query"

    ```bash
    pnpm add @tanstack/react-query react @supabase/storage-js
    ```

## Quick Start

Import [`useFileUrl`](./queries.md#usefileurl) and provide bucket id and path of the desired storage object. The cache key is automatically created from the passed details. You can pass the SWR- and React Query-native options. To list all files in a directory, import [`useDirectory`](./queries.md#usedirectory). If you need all files in a directory and their urls, import [`useDirectoryUrls`](./queries.md#usedirectoryurls).

=== "SWR"

    ```tsx
    import { useFileUrl } from "@supabase-cache-helpers/storage-swr";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { data: url } = useFileUrl(
        client.storage.from("public_contact_files"),
        "dirname/file.jpg",
        "public", // supports private and public buckets
        {
          // for public buckets. returns null if file does not exist.
          ensureExistence: true,
          revalidateOnFocus: false,
        }
      );
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useFileUrl } from "@supabase-cache-helpers/storage-react-query";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { data: url } = useFileUrl(
        client.storage.from("public_contact_files"),
        "dirname/file.jpg",
        "public", // supports private and public buckets
        {
          // for public buckets. returns null if file does not exist.
          ensureExistence: true,
          refetchOnWindowFocus: false,
        }
      );
      return <div>...</div>;
    }
    ```

To upload file(s), import [`useUpload`](./mutations.md#useupload). Note that the file queries will be revalidated if the uploaded file is relevant (e.g. if it is uploaded into a directory that is currently queried).

=== "SWR"

    ```tsx
    import { useUpload } from "@supabase-cache-helpers/storage-swr";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
        const { trigger: upload } = useUpload(
            client.storage.from("private_contact_files"),
            { buildFileName: ({ fileName, path }) => `mydirectory/${path}/${fileName}` }
        );
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useUpload } from "@supabase-cache-helpers/storage-react-query";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
        const { mutateAsync: upload } = useUpload(
            client.storage.from("private_contact_files"),
            { buildFileName: ({ fileName, path }) => `mydirectory/${path}/${fileName}` }
        );
      return <div>...</div>;
    }
    ```

Finally, you can remove files and directories with [`useRemoveDirectory`](./mutations.md#useremovedirectory) and [`useRemoveFiles`](./mutations.md#useremovefiles).

=== "SWR"

    ```tsx
    import { useRemoveDirectory } from "@supabase-cache-helpers/storage-swr";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { trigger: remove } = useRemoveDirectory(
        client.storage.from("private_contact_files")
      );
      return <div>...</div>;
    }
    ```

=== "React Query"

    ```tsx
    import { useRemoveDirectory } from "@supabase-cache-helpers/storage-react-query";

    const client = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    function Page() {
      const { mutateAsync: remove } = useRemoveDirectory(
        client.storage.from("private_contact_files")
      );
      return <div>...</div>;
    }
    ```
