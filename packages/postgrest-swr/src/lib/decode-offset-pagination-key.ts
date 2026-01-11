import { decode } from './decode';
import { decodeObject } from '@supabase-cache-helpers/postgrest-core';

/**
 * Decodes an offset pagination key to extract limit and offset values.
 * Handles both regular queries and RPC queries with custom argument names.
 *
 * @param key - The encoded SWR key string
 * @param rpcArgs - Optional RPC argument names for limit and offset
 * @returns An object with limit and offset values
 */
export const decodeOffsetPaginationKey = (
  key: string,
  rpcArgs?: { limit: string; offset: string },
): { limit?: number; offset?: number } => {
  const decodedKey = decode(key);
  if (!decodedKey) {
    throw new Error('Not a SWRPostgrest key');
  }

  // Handle RPC queries with custom argument names
  if (rpcArgs) {
    if (decodedKey.bodyKey && decodedKey.bodyKey !== 'null') {
      const body = decodeObject(decodedKey.bodyKey);

      const limit = body[rpcArgs.limit];
      const offset = body[rpcArgs.offset];

      return {
        limit: typeof limit === 'number' ? limit : undefined,
        offset: typeof offset === 'number' ? offset : undefined,
      };
    } else {
      const sp = new URLSearchParams(decodedKey.queryKey);
      const limitValue = sp.get(rpcArgs.limit);
      const offsetValue = sp.get(rpcArgs.offset);
      return {
        limit: limitValue ? parseInt(limitValue, 10) : undefined,
        offset: offsetValue ? parseInt(offsetValue, 10) : undefined,
      };
    }
  }

  // Handle regular queries
  return {
    limit: decodedKey.limit,
    offset: decodedKey.offset,
  };
};
