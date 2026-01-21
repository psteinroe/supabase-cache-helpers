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

  it('should handle SWR infinite data (array of PostgrestHasMorePaginationResponse)', () => {
    const page1: TestItem[] = [{ id: '1', name: 'one' }];
    const page2: TestItem[] = [{ id: '2', name: 'two' }];
    const infiniteData = [
      { data: page1, hasMore: true },
      { data: page2, hasMore: false },
    ];
    expect(extractCacheDataArray<TestItem>(infiniteData)).toEqual([
      ...page1,
      ...page2,
    ]);
  });

  it('should handle SWR infinite data (array of arrays - PostgrestPaginationResponse)', () => {
    const page1: TestItem[] = [{ id: '1', name: 'one' }];
    const page2: TestItem[] = [{ id: '2', name: 'two' }];
    const infiniteData = [page1, page2];
    expect(extractCacheDataArray<TestItem>(infiniteData)).toEqual([
      ...page1,
      ...page2,
    ]);
  });
});
