import {
  type AnyPostgrestResponse,
  isPostgrestBuilder,
} from '@supabase-cache-helpers/postgrest-core';
import {
  PostgrestError,
  PostgrestTransformBuilder,
} from '@supabase/postgrest-js';

export async function fetchQuery<
  Response extends AnyPostgrestResponse<unknown>,
>(builder: PromiseLike<Response>, signal: AbortSignal): Promise<Response> {
  if (!isPostgrestBuilder(builder))
    throw new Error('Key is not a PostgrestBuilder');
  const url = new URL(builder['url']);
  const headers = builder['headers'];
  const offset = Number(url.searchParams.get('offset'));
  const limit = Number(url.searchParams.get('limit'));
  const isList =
    builder['method'] === 'GET' &&
    !builder['isMaybeSingle'] &&
    (!headers.get('Accept') || headers.get('Accept') === 'application/json');
  let emptyPageTotal: number | undefined;
  const fetch = builder['fetch'];
  const request = new PostgrestTransformBuilder({
    method: builder['method'],
    url,
    headers,
    schema: builder['schema'],
    body: builder['body'],
    isMaybeSingle: builder['isMaybeSingle'],
    signal,
    shouldThrowOnError: true,
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      const total = response.headers
        .get('content-range')
        ?.match(/^\*\/(\d+)$/)?.[1];
      if (
        response.status === 416 &&
        total !== undefined &&
        isList &&
        Number.isSafeInteger(offset) &&
        offset > 0 &&
        Number.isSafeInteger(limit) &&
        limit > 0 &&
        Number.isSafeInteger(Number(total)) &&
        offset >= Number(total)
      ) {
        emptyPageTotal = Number(total);
      }
      return response;
    },
  });
  try {
    return (await request) as Response;
  } catch (error) {
    // Deleting the last row of a page yields PGRST103, not a successful empty
    // response. Use only its authoritative Content-Range total; never parse prose.
    if (
      error instanceof PostgrestError &&
      error.code === 'PGRST103' &&
      emptyPageTotal !== undefined
    ) {
      return {
        data: [],
        count: /count=(exact|planned|estimated)/.test(
          headers.get('Prefer') ?? '',
        )
          ? emptyPageTotal
          : null,
        error: null,
        status: 200,
        statusText: 'OK',
      } as Response;
    }
    throw error;
  }
}
