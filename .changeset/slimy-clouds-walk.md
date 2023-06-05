---
"@supabase-cache-helpers/postgrest-react-query": patch
"@supabase-cache-helpers/postgrest-swr": patch
---

fix: refactor useSubscription to create the channel internally

fixes #162

this is a breaking change! however, since this was simply not working before, I am realising it as a patch change.

to migrate, simply pass the `SupabaseClient` and the channel name, instead of the channel:

````tsx
      const { status } = useSubscription(
        client.channel(`public:contact:username=eq.${USERNAME_1}`),
        {
          event: '*',
          table: 'contact',
          schema: 'public',
          filter: `username=eq.${USERNAME_1}`,
        },
        ['id'],
        { callback: () => setCbCalled(true) }
      );
```

becomes

```tsx
      const { status } = useSubscription(
        client,
        `public:contact:username=eq.${USERNAME_1}`,
        {
          event: '*',
          table: 'contact',
          schema: 'public',
          filter: `username=eq.${USERNAME_1}`,
        },
        ['id'],
        { callback: () => setCbCalled(true) }
      );
```
````
