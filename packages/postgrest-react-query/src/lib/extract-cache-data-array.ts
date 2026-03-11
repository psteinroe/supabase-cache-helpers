import {
  isAnyPostgrestResponse,
  isPostgrestHasMorePaginationResponse,
} from '@supabase-cache-helpers/postgrest-core';

/**
 * Extracts an array of items from various cache data structures.
 * Handles:
 * - Simple arrays (direct query results)
 * - PostgrestResponse ({ data: T[], count, error, status, statusText })
 * - PostgrestHasMorePaginationResponse ({ data: T[], hasMore: boolean })
 * - React Query infinite data ({ pages: Page[], pageParams: unknown[] })
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

  // Handle React Query infinite data structure
  if (
    typeof data === 'object' &&
    'pages' in (data as object) &&
    Array.isArray((data as { pages: unknown[] }).pages)
  ) {
    const pages = (data as { pages: unknown[] }).pages;
    return pages.flatMap((page) => {
      // Handle PostgrestResponse in page
      if (isAnyPostgrestResponse<Type>(page)) {
        const pageData = page.data;
        if (Array.isArray(pageData)) {
          return pageData;
        }
        if (pageData && typeof pageData === 'object') {
          return [pageData as Type];
        }
        return [];
      }
      if (isPostgrestHasMorePaginationResponse<Type>(page)) {
        return page.data;
      }
      if (Array.isArray(page)) {
        return page as Type[];
      }
      if (page && typeof page === 'object') {
        return [page as Type];
      }
      return [];
    });
  }

  // Handle simple array
  if (Array.isArray(data)) {
    // If empty array, return empty array
    if (data.length === 0) {
      return [];
    }

    // If first item is PostgrestHasMorePaginationResponse, it might be paginated
    const firstItem = data[0];
    if (isPostgrestHasMorePaginationResponse<Type>(firstItem)) {
      return data.flatMap((page) =>
        isPostgrestHasMorePaginationResponse<Type>(page) ? page.data : [],
      );
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
