import { encode } from '../lib/key';
import { fetchQuery } from './fetch-query';
import type { AnyPostgrestResponse } from '@supabase-cache-helpers/postgrest-core';
import type { PostgrestError } from '@supabase/postgrest-js';
import {
  type UseQueryOptions as VueQueryOptions,
  useQuery as useVueQuery,
} from '@tanstack/vue-query';
import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue';

export type UseQueryOptions<Response> = MaybeRefOrGetter<
  Omit<
    Exclude<VueQueryOptions<Response, PostgrestError>, Ref>,
    'queryKey' | 'queryFn' | 'select'
  >
>;

/** Pass a getter or computed builder to track filters, ordering and range. */
export function useQuery<Response extends AnyPostgrestResponse<unknown>>(
  query: MaybeRefOrGetter<PromiseLike<Response>>,
  config?: UseQueryOptions<Response>,
) {
  const options = computed(() => {
    // Capture the builder together with its key: an older request must not read
    // a newer filter while a reactive parameter is changing.
    const builder = toValue(query);
    return {
      ...toValue(config),
      queryKey: encode(builder, false),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchQuery(builder, signal),
    };
  });
  const result = useVueQuery<Response, PostgrestError>(options);

  return {
    ...result,
    data: computed((): Response['data'] | undefined => result.data.value?.data),
    count: computed(() => result.data.value?.count ?? null),
  };
}
