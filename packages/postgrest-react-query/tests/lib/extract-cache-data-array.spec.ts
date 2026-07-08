import { extractCacheDataArray } from '../../src/lib/extract-cache-data-array';
import { describe, expect, it } from 'vitest';

type TestItem = {
  id: string;
  name: string;
};

describe('extractCacheDataArray', () => {
  it('should return undefined for null', () => {
    expect(extractCacheDataArray(null)).toBeUndefined();
  });

  it('should return undefined for undefined', () => {
    expect(extractCacheDataArray(undefined)).toBeUndefined();
  });

  it('should return empty array for empty array', () => {
    expect(extractCacheDataArray([])).toEqual([]);
  });

  it('should return simple array as-is', () => {
    const items: TestItem[] = [
      { id: '1', name: 'one' },
      { id: '2', name: 'two' },
    ];
    expect(extractCacheDataArray<TestItem>(items)).toEqual(items);
  });

  it('should handle single object by wrapping in array', () => {
    const item: TestItem = { id: '1', name: 'one' };
    expect(extractCacheDataArray<TestItem>(item)).toEqual([item]);
  });

  it('should handle PostgrestResponse with array data', () => {
    const items: TestItem[] = [
      { id: '1', name: 'one' },
      { id: '2', name: 'two' },
    ];
    const response = {
      data: items,
      count: 2,
      error: null,
      status: 200,
      statusText: 'OK',
    };
    expect(extractCacheDataArray<TestItem>(response)).toEqual(items);
  });

  it('should handle PostgrestResponse with single object data', () => {
    const item: TestItem = { id: '1', name: 'one' };
    const response = {
      data: item,
      count: 1,
      error: null,
      status: 200,
      statusText: 'OK',
    };
    expect(extractCacheDataArray<TestItem>(response)).toEqual([item]);
  });

  it('should handle PostgrestResponse with null data', () => {
    const response = {
      data: null,
      count: 0,
      error: null,
      status: 200,
      statusText: 'OK',
    };
    expect(extractCacheDataArray<TestItem>(response)).toBeUndefined();
  });

  it('should handle PostgrestHasMorePaginationResponse', () => {
    const items: TestItem[] = [
      { id: '1', name: 'one' },
      { id: '2', name: 'two' },
    ];
    const response = {
      data: items,
      hasMore: true,
    };
    expect(extractCacheDataArray<TestItem>(response)).toEqual(items);
  });

  it('should handle React Query infinite data structure', () => {
    const page1: TestItem[] = [{ id: '1', name: 'one' }];
    const page2: TestItem[] = [{ id: '2', name: 'two' }];
    const infiniteData = {
      pages: [page1, page2],
      pageParams: [0, 1],
    };
    expect(extractCacheDataArray<TestItem>(infiniteData)).toEqual([
      ...page1,
      ...page2,
    ]);
  });

  it('should handle React Query infinite data with PostgrestResponse pages', () => {
    const page1: TestItem[] = [{ id: '1', name: 'one' }];
    const page2: TestItem[] = [{ id: '2', name: 'two' }];
    const infiniteData = {
      pages: [
        { data: page1, count: 1, error: null, status: 200, statusText: 'OK' },
        { data: page2, count: 1, error: null, status: 200, statusText: 'OK' },
      ],
      pageParams: [0, 1],
    };
    expect(extractCacheDataArray<TestItem>(infiniteData)).toEqual([
      ...page1,
      ...page2,
    ]);
  });

  it('should handle React Query infinite data with PostgrestHasMorePaginationResponse pages', () => {
    const page1: TestItem[] = [{ id: '1', name: 'one' }];
    const page2: TestItem[] = [{ id: '2', name: 'two' }];
    const infiniteData = {
      pages: [
        { data: page1, hasMore: true },
        { data: page2, hasMore: false },
      ],
      pageParams: [0, 1],
    };
    expect(extractCacheDataArray<TestItem>(infiniteData)).toEqual([
      ...page1,
      ...page2,
    ]);
  });

  it('should handle React Query infinite data with single object pages', () => {
    const item1: TestItem = { id: '1', name: 'one' };
    const item2: TestItem = { id: '2', name: 'two' };
    const infiniteData = {
      pages: [item1, item2],
      pageParams: [0, 1],
    };
    expect(extractCacheDataArray<TestItem>(infiniteData)).toEqual([
      item1,
      item2,
    ]);
  });

  it('should handle React Query infinite data with PostgrestResponse containing single object', () => {
    const item1: TestItem = { id: '1', name: 'one' };
    const infiniteData = {
      pages: [
        { data: item1, count: 1, error: null, status: 200, statusText: 'OK' },
      ],
      pageParams: [0],
    };
    expect(extractCacheDataArray<TestItem>(infiniteData)).toEqual([item1]);
  });

  it('should handle React Query infinite data with empty pages', () => {
    const infiniteData = {
      pages: [
        { data: null, count: 0, error: null, status: 200, statusText: 'OK' },
      ],
      pageParams: [0],
    };
    expect(extractCacheDataArray<TestItem>(infiniteData)).toEqual([]);
  });

  it('should handle array of PostgrestHasMorePaginationResponse', () => {
    const page1: TestItem[] = [{ id: '1', name: 'one' }];
    const page2: TestItem[] = [{ id: '2', name: 'two' }];
    const paginatedArray = [
      { data: page1, hasMore: true },
      { data: page2, hasMore: false },
    ];
    expect(extractCacheDataArray<TestItem>(paginatedArray)).toEqual([
      ...page1,
      ...page2,
    ]);
  });
});
