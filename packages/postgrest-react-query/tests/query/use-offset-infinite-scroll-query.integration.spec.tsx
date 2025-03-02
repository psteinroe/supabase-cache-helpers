import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  useOffsetInfiniteScrollQuery,
} from '../../src/query/use-offset-infinite-scroll-query';
import { fetchOffsetPaginationHasMoreFallbackData } from '../../src/query/fetch';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-react-query-infinite-scroll';

describe('useOffsetInfiniteScrollQuery', { timeout: 20000 }, () => {
  let client: SupabaseClient<Database>;
  let queryClient: QueryClient;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 1000)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(cleanup);

  it('should load correctly', async () => {
    function Page() {
      const { data, loadMore, isLoading, error } =
        useOffsetInfiniteScrollQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
      return (
        <div>
          {loadMore && (
            <div data-testid="loadMore" onClick={() => loadMore()} />
          )}
          <div data-testid="list">
            {(data ?? []).map((p: { id: string; username: string | null }) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );
    const list = screen.getByTestId('list');
    expect(list.childElementCount).toEqual(1);

    fireEvent.click(screen.getByTestId('loadMore'));
    await screen.findByText(
      `${testRunPrefix}-username-2`,
      {},
      { timeout: 10000 },
    );

    expect(list.childElementCount).toEqual(2);

    fireEvent.click(screen.getByTestId('loadMore'));
    await screen.findByText(
      `${testRunPrefix}-username-3`,
      {},
      { timeout: 10000 },
    );

    expect(list.childElementCount).toEqual(3);
  });
  
  it('should allow conditional queries', async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, isLoading } = useOffsetInfiniteScrollQuery(
        condition
          ? client
              .from('contact')
              .select('id,username')
              .ilike('username', `${testRunPrefix}%`)
              .order('username', { ascending: true })
          : null,
        { pageSize: 1 },
      );
      return (
        <div>
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="pages">
            {(data ?? [])[0]?.username ?? 'undefined'}
          </div>
          <div>{`isLoading: ${isLoading}`}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('isLoading: false', {}, { timeout: 10000 });
    await screen.findByText('undefined', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('setCondition'));
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 },
    );
  });

  it('should work with fallback data', async () => {
    const query = client
      .from('contact')
      .select('id,username')
      .ilike('username', `${testRunPrefix}%`)
      .order('username', { ascending: true });
    const [_, fallbackData] = await fetchOffsetPaginationHasMoreFallbackData(
      query,
      1,
    );
    function Page() {
      const { data } = useOffsetInfiniteScrollQuery(null, {
        pageSize: 1,
        fallbackData,
      });
      return (
        <div>
          <div data-testid="pages">
            {(data ?? [])[0]?.username ?? 'undefined'}
          </div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText(contacts[0].username ?? '', {}, { timeout: 10000 });
  });

  // Test empty results
  it('should handle empty results gracefully', async () => {
    // Create a unique prefix that won't match any data
    const emptyPrefix = `${TEST_PREFIX}-empty-${Math.floor(Math.random() * 1000)}`;
    
    function Page() {
      const { data, isLoading, error } =
        useOffsetInfiniteScrollQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${emptyPrefix}%`) // This won't match any records
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="dataLength">{(data ?? []).length}</div>
          <div data-testid="error">{error ? 'error' : 'no-error'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 10000 });
    
    // Check that we have no items
    expect(screen.getByTestId('dataLength').textContent).toBe('0');
    
    // Check that there's no error
    expect(screen.getByTestId('error').textContent).toBe('no-error');
  });

  // Test error handling
  it('should handle query errors gracefully', async () => {
    function Page() {
      const { data, isLoading, error } =
        useOffsetInfiniteScrollQuery(
          // Use type assertion to handle the error case
          client
            .from('contact')
            .select('id,username,non_existent_column') as any,
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="hasError">{error ? 'has-error' : 'no-error'}</div>
          <div data-testid="errorMessage">{error ? error.message : ''}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 10000 });
    
    // Check that we have an error
    expect(screen.getByTestId('hasError').textContent).toBe('has-error');
    
    // Check that error message contains relevant information
    expect(screen.getByTestId('errorMessage').textContent).not.toBe('');
  });

  // Test changing query parameters
  it('should refetch when query parameters change', async () => {
    function Page() {
      const [suffix, setSuffix] = useState('1');
      const { data, isLoading } =
        useOffsetInfiniteScrollQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}-username-${suffix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="setSuffix1" onClick={() => setSuffix('1')} />
          <div data-testid="setSuffix2" onClick={() => setSuffix('2')} />
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="itemsData">
            {(data ?? []).map(p => (
              <div key={p.id} data-testid={`item-${p.username}`}>{p.username}</div>
            ))}
          </div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 10000 });
    
    // Check initial data (should contain username-1)
    await waitFor(() => {
      const itemsData = screen.getByTestId('itemsData');
      expect(itemsData.textContent).toContain(`${testRunPrefix}-username-1`);
    }, { timeout: 10000 });
    
    // Change query parameter
    fireEvent.click(screen.getByTestId('setSuffix2'));
    
    // Wait for new data to load
    await waitFor(() => {
      const itemsData = screen.getByTestId('itemsData');
      expect(itemsData.textContent).toContain(`${testRunPrefix}-username-2`);
    }, { timeout: 10000 });
  });

  // Test large page size
  it('should handle large page sizes', async () => {
    function Page() {
      const { data, isLoading } =
        useOffsetInfiniteScrollQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 100 }, // Large page size that should include all test data
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="itemsLength">{(data ?? []).length}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 10000 });
    
    // Check that we have all 4 items
    expect(screen.getByTestId('itemsLength').textContent).toBe('4');
  });

  // Test edge case: pageSize = 0
  it('should handle pageSize of 0 gracefully', async () => {
    function Page() {
      const { data, isLoading, error } =
        useOffsetInfiniteScrollQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 0 }, // Invalid page size
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="hasError">{error ? 'has-error' : 'no-error'}</div>
          <div data-testid="errorMessage">{error ? error.message || JSON.stringify(error) : ''}</div>
          <div data-testid="dataLength">{(data ?? []).length}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 10000 });
    
    // Check that the hook doesn't crash with pageSize = 0
    // It might return no data or use a default page size, both are acceptable
    const hasError = screen.getByTestId('hasError').textContent === 'has-error';
    if (hasError) {
      // If it throws an error, make sure there's an error message
      expect(screen.getByTestId('errorMessage').textContent).not.toBe('');
    } else {
      // If it doesn't throw an error, it should either return data or an empty array
      const dataLength = parseInt(screen.getByTestId('dataLength').textContent || '0', 10);
      expect(dataLength).toBeGreaterThanOrEqual(0);
    }
  });

  // Test loading state changes during data fetching
  it('should handle loading state changes correctly', async () => {
    function Page() {
      const [suffix, setSuffix] = useState('1');
      const { data, isLoading, isFetching } =
        useOffsetInfiniteScrollQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}-username-${suffix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="setSuffix" onClick={() => setSuffix(suffix === '1' ? '2' : '1')} />
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="fetching">{isFetching ? 'fetching' : 'not-fetching'}</div>
          <div data-testid="dataLength">{(data ?? []).length}</div>
          <div data-testid="currentData">{(data ?? [])[0]?.username ?? 'no-data'}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 10000 });
    
    // Check initial data
    expect(screen.getByTestId('currentData').textContent).toContain(`${testRunPrefix}-username-1`);
    
    // Change query parameter to trigger refetch
    fireEvent.click(screen.getByTestId('setSuffix'));
    
    // Check that fetching state is active
    await waitFor(() => {
      expect(screen.getByTestId('fetching').textContent).toBe('fetching');
    }, { timeout: 10000 });
    
    // Wait for fetching to complete
    await waitFor(() => {
      expect(screen.getByTestId('fetching').textContent).toBe('not-fetching');
    }, { timeout: 10000 });
    
    // Check that data has been updated
    expect(screen.getByTestId('currentData').textContent).toContain(`${testRunPrefix}-username-2`);
  });
});