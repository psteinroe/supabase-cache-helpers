import { PostgrestClient } from '@supabase/postgrest-js';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';

export type Row = { id: number; name: string; active: boolean };
export type Database = {
  public: {
    Tables: {
      items: {
        Row: Row;
        Insert: Row;
        Update: Partial<Row>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
};

export function database(fetch: typeof globalThis.fetch) {
  return new PostgrestClient<Database>('https://example.test/rest/v1', {
    fetch,
  });
}

export function mount<T>(
  setup: () => T,
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  }),
) {
  let result!: T;
  const app = createApp({
    setup() {
      result = setup();
      return () => null;
    },
  });
  app.use(VueQueryPlugin, { queryClient: client });
  app.mount(document.createElement('div'));
  return {
    result,
    client,
    stop() {
      app.unmount();
      client.clear();
    },
  };
}

export function response(data: unknown, count?: number) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: count === undefined ? {} : { 'content-range': `0-0/${count}` },
  });
}
