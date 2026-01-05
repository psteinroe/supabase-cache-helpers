import {
  isAnyPostgrestResponse,
  isPostgrestHasMorePaginationResponse,
  isPostgrestPaginationResponse,
} from '@supabase-cache-helpers/postgrest-core';

/**
 * Extracts an array of items from various cache data structures.
 * Handles:
 * - Simple arrays (direct query results)
 * - PostgrestResponse ({ data: T[], count, error, status, statusText })
 * - PostgrestHasMorePaginationResponse ({ data: T[], hasMore: boolean })
 * - PostgrestPaginationResponse (T[])
 * - SWR infinite data (array of pages)
 * - Single objects (wrapped in array)
 *
 * @returns Type[] | undefined
 */
export const extractCacheDataArray = <Type extends Record<string, unknown>>(
  data: unknown,
): Type[] | undefined => {
  if (data === undefined || data === null) {
    return undefined;
  }

  // Handle SWR infinite data (array of pages)
  if (Array.isArray(data)) {
    // Check if it's an array of pages (each page could be PostgrestHasMorePaginationResponse or array)
    const firstItem = data[0];

    // If empty array, return empty array
    if (data.length === 0) {
      return [];
    }

    // If first item is PostgrestHasMorePaginationResponse, flatten all pages
    if (isPostgrestHasMorePaginationResponse<Type>(firstItem)) {
      return data.flatMap((page) =>
        isPostgrestHasMorePaginationResponse<Type>(page) ? page.data : [],
      );
    }

    // If first item is an array (PostgrestPaginationResponse), flatten all pages
    if (Array.isArray(firstItem)) {
      return data.flat() as Type[];
    }

    // Otherwise, it's a simple array of items
    return data as Type[];
  }

  // Handle PostgrestHasMorePaginationResponse
  if (isPostgrestHasMorePaginationResponse<Type>(data)) {
    return data.data;
  }

  // Handle PostgrestResponse ({ data, count, error, ... })
  if (isAnyPostgrestResponse<Type>(data)) {
    const responseData = data.data;
    if (Array.isArray(responseData)) {
      return responseData;
    }
    if (responseData && typeof responseData === 'object') {
      return [responseData as Type];
    }
    return undefined;
  }

  // Handle single object (wrap in array)
  if (typeof data === 'object') {
    return [data as Type];
  }

  return undefined;
};
