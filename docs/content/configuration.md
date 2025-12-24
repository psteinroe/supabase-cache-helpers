# Configuration

Supabase Cache Helpers does a decent job at keeping your data up-to-date. This allows you to deviate from the standard configuration and reduce the number of requests to your backend while keeping your app fresh.

=== "SWR"

    ```tsx
    function Page() {
      return (
            <SWRConfig
                value={{
                    revalidateIfStale: false,
                    revalidateOnFocus: false,
                }}
            >
            ...
            </SWRConfig>
      )
    }
    ```

=== "React Query"

    !!! info
        You can find more details on the [React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start).

    ```tsx
    function Page() {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            gcTime: Infinity,
          },
        },
      });

      return (
        <QueryClientProvider client={queryClient}>
          {/* Your components */}
        </QueryClientProvider>
      );
    }
    ```
