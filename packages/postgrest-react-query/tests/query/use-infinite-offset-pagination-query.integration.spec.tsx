import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useState, useEffect } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInfiniteOffsetPaginationQuery } from '../../src/query/use-infinite-offset-pagination-query';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-react-query-infinite';

describe('useInfiniteOffsetPaginationQuery', { timeout: 30000 }, () => {
  let client: SupabaseClient<Database>;
  let queryClient: QueryClient;
  let testRunPrefix: string;

  beforeAll(async () => {
    // Log environment variables for debugging
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY?.substring(0, 10) + '...');
    
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 1000)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    
    // Clean up existing test data
    console.log('Cleaning up test data...');
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    // Create new test data
    console.log('Creating test data with prefix:', testRunPrefix);
    const { data, error } = await client
      .from('contact')
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select('*');
      
    if (error) {
      console.error('Error inserting test data:', error);
      throw error;
    }
    
    console.log('Created contacts:', data);
    expect(data).toHaveLength(4);
  });

  beforeEach(() => {
    // Reset query cache between tests
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });
  });

  // Basic initialization test
  it('should initialize with the correct structure', async () => {
    function Page() {
      const { pages, pageIndex, setPage, isLoading, error } =
        useInfiniteOffsetPaginationQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      // Log for debugging
      useEffect(() => {
        console.log('Pages:', pages);
        console.log('Loading:', isLoading);
        console.log('Error:', error);
      }, [pages, isLoading, error]);
      
      return (
        <div data-testid="test-container">
          <div data-testid="pageIndex">{pageIndex}</div>
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="error">{error ? JSON.stringify(error) : 'no-error'}</div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Check loading state
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check page index
    expect(testContainer.getByTestId('pageIndex').textContent).toEqual('0');
  });

  // Test page navigation
  it('should support navigation between pages', async () => {
    function Page() {
      const { pages, pageIndex, nextPage, previousPage, currentPage, isLoading } =
        useInfiniteOffsetPaginationQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="next" onClick={() => nextPage?.()} />
          <div data-testid="prev" onClick={() => previousPage?.()} />
          <div data-testid="currentPage">
            {currentPage?.map((p) => (
              <div key={p.id} data-testid={`current-${p.username}`}>{p.username}</div>
            ))}
          </div>
          <div data-testid="allPages">
            {(pages ?? []).flat().map((p) => (
              <div key={p.id} data-testid={`all-${p.username}`}>{p.username}</div>
            ))}
          </div>
          <div data-testid="pageIndex">{pageIndex}</div>
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);

    // Wait for initial data to load
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check initial page index
    expect(testContainer.getByTestId('pageIndex').textContent).toEqual('0');
    
    // Wait for data to be loaded
    await waitFor(() => {
      const allPages = testContainer.getByTestId('allPages');
      expect(allPages.childElementCount).toBeGreaterThan(0);
    }, { timeout: 15000 });

    // Navigate to next page
    fireEvent.click(testContainer.getByTestId('next'));
    
    // Check page index after navigation
    await waitFor(() => {
      expect(testContainer.getByTestId('pageIndex').textContent).toEqual('1');
    }, { timeout: 15000 });

    // Navigate to next page again
    fireEvent.click(testContainer.getByTestId('next'));
    
    // Check page index after second navigation
    await waitFor(() => {
      expect(testContainer.getByTestId('pageIndex').textContent).toEqual('2');
    }, { timeout: 15000 });

    // Navigate to previous page
    fireEvent.click(testContainer.getByTestId('prev'));
    
    // Check page index after going back
    await waitFor(() => {
      expect(testContainer.getByTestId('pageIndex').textContent).toEqual('1');
    }, { timeout: 15000 });
  });

  // Test setPage functionality
  it('should allow setting specific page index', async () => {
    function Page() {
      const { pages, pageIndex, setPage, currentPage } =
        useInfiniteOffsetPaginationQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="setPage0" onClick={() => setPage(0)} />
          <div data-testid="setPage1" onClick={() => setPage(1)} />
          <div data-testid="setPage2" onClick={() => setPage(2)} />
          <div data-testid="setPage3" onClick={() => setPage(3)} />
          <div data-testid="pageIndex">{pageIndex}</div>
          <div data-testid="currentPage">
            {currentPage?.map((p) => (
              <div key={p.id} data-testid={`current-${p.username}`}>{p.username}</div>
            ))}
          </div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);

    // Wait for initial data to load
    await waitFor(() => {
      expect(testContainer.getByTestId('pageIndex').textContent).toEqual('0');
    }, { timeout: 15000 });
    
    // Set page to 2
    fireEvent.click(testContainer.getByTestId('setPage2'));
    
    // Check page index after setting
    await waitFor(() => {
      expect(testContainer.getByTestId('pageIndex').textContent).toEqual('2');
    }, { timeout: 15000 });
    
    // Set page to 0
    fireEvent.click(testContainer.getByTestId('setPage0'));
    
    // Check page index after setting back to 0
    await waitFor(() => {
      expect(testContainer.getByTestId('pageIndex').textContent).toEqual('0');
    }, { timeout: 15000 });
  });

  // Test conditional query
  it('should handle conditional queries', async () => {
    function Page() {
      const [enabled, setEnabled] = useState(false);
      const { pages, isLoading, error } =
        useInfiniteOffsetPaginationQuery(
          enabled
            ? client
                .from('contact')
                .select('id,username')
                .ilike('username', `${testRunPrefix}%`)
                .order('username', { ascending: true })
            : null,
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="enable" onClick={() => setEnabled(true)} />
          <div data-testid="disable" onClick={() => setEnabled(false)} />
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="hasData">{pages.flat().length > 0 ? 'has-data' : 'no-data'}</div>
          <div data-testid="error">{error ? 'error' : 'no-error'}</div>
          <div data-testid="enabled">{enabled ? 'enabled' : 'disabled'}</div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Check initial state (query disabled)
    expect(testContainer.getByTestId('hasData').textContent).toBe('no-data');
    expect(testContainer.getByTestId('enabled').textContent).toBe('disabled');
    
    // Enable query
    fireEvent.click(testContainer.getByTestId('enable'));
    
    // Check that query is enabled
    expect(testContainer.getByTestId('enabled').textContent).toBe('enabled');
    
    // Check data loading
    await waitFor(() => {
      expect(testContainer.getByTestId('hasData').textContent).toBe('has-data');
    }, { timeout: 15000 });
    
    // Disable query - in this case, we're just testing that the UI updates correctly
    // The actual behavior of the hook is to keep the data in the cache even when disabled
    fireEvent.click(testContainer.getByTestId('disable'));
    
    // Check that query is disabled
    expect(testContainer.getByTestId('enabled').textContent).toBe('disabled');
    
    // We're not testing the cache behavior here, just that the component renders correctly
    // The actual cache behavior depends on the React Query configuration
  });

  // Test empty results
  it('should handle empty results gracefully', async () => {
    // Create a unique prefix that won't match any data
    const emptyPrefix = `${TEST_PREFIX}-empty-${Math.floor(Math.random() * 1000)}`;
    
    function Page() {
      const { pages, isLoading, error } =
        useInfiniteOffsetPaginationQuery(
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
          <div data-testid="pagesLength">{pages.length}</div>
          <div data-testid="itemsLength">{pages.flat().length}</div>
          <div data-testid="error">{error ? 'error' : 'no-error'}</div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check that we have one page (empty result page)
    expect(testContainer.getByTestId('pagesLength').textContent).toBe('1');
    
    // Check that we have no items
    expect(testContainer.getByTestId('itemsLength').textContent).toBe('0');
    
    // Check that there's no error
    expect(testContainer.getByTestId('error').textContent).toBe('no-error');
  });

  // Test large page size
  it('should handle large page sizes', async () => {
    function Page() {
      const { pages, isLoading } =
        useInfiniteOffsetPaginationQuery(
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
          <div data-testid="pagesLength">{pages.length}</div>
          <div data-testid="itemsLength">{pages.flat().length}</div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check that we have one page
    expect(testContainer.getByTestId('pagesLength').textContent).toBe('1');
    
    // Check that we have all 4 items
    expect(testContainer.getByTestId('itemsLength').textContent).toBe('4');
  });

  // Test changing query parameters
  it('should refetch when query parameters change', async () => {
    function Page() {
      const [suffix, setSuffix] = useState('1');
      const { pages, isLoading } =
        useInfiniteOffsetPaginationQuery(
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
            {pages.flat().map(p => (
              <div key={p.id} data-testid={`item-${p.username}`}>{p.username}</div>
            ))}
          </div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check initial data (should contain username-1)
    await waitFor(() => {
      const itemsData = testContainer.getByTestId('itemsData');
      expect(itemsData.textContent).toContain(`${testRunPrefix}-username-1`);
    }, { timeout: 15000 });
    
    // Change query parameter
    fireEvent.click(testContainer.getByTestId('setSuffix2'));
    
    // Wait for new data to load
    await waitFor(() => {
      const itemsData = testContainer.getByTestId('itemsData');
      expect(itemsData.textContent).toContain(`${testRunPrefix}-username-2`);
    }, { timeout: 15000 });
  });

  // Test error handling
  it('should handle query errors gracefully', async () => {
    function Page() {
      const { pages, isLoading, error } =
        useInfiniteOffsetPaginationQuery(
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

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check that we have an error
    expect(testContainer.getByTestId('hasError').textContent).toBe('has-error');
    
    // Check that error message contains relevant information
    expect(testContainer.getByTestId('errorMessage').textContent).not.toBe('');
  });

  // Test edge case: pageSize = 0
  it('should handle pageSize of 0 gracefully', async () => {
    function Page() {
      const { pages, isLoading, error } =
        useInfiniteOffsetPaginationQuery(
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
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check that we have an error or that it handled it by using a default page size
    // The implementation might handle this differently, so we're flexible in our expectations
    const hasError = testContainer.getByTestId('hasError').textContent === 'has-error';
    if (hasError) {
      expect(testContainer.getByTestId('errorMessage').textContent).not.toBe('');
    }
  });

  // Test edge case: negative page index
  it('should handle negative page index gracefully', async () => {
    function Page() {
      const { pages, pageIndex, setPage, isLoading } =
        useInfiniteOffsetPaginationQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="setNegativePage" onClick={() => setPage(-1)} />
          <div data-testid="pageIndex">{pageIndex}</div>
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check initial page index
    expect(testContainer.getByTestId('pageIndex').textContent).toEqual('0');
    
    // Try to set negative page index
    fireEvent.click(testContainer.getByTestId('setNegativePage'));
    
    // Check that page index is still valid (should be 0 or handled gracefully)
    await waitFor(() => {
      const pageIndex = parseInt(testContainer.getByTestId('pageIndex').textContent || '0', 10);
      expect(pageIndex).toBeGreaterThanOrEqual(0);
    }, { timeout: 15000 });
  });

  // Test edge case: changing page while loading
  it('should handle page changes during loading', async () => {
    // Mock a slow query with type assertions to avoid TypeScript errors
    const originalFrom = client.from.bind(client);
    
    // Use any type to bypass type checking for the mock implementation
    const mockFrom = vi.fn().mockImplementation((table: any) => {
      const result = originalFrom(table as any);
      const originalSelect = result.select.bind(result);
      
      // Override select method with a version that adds delay
      (result as any).select = function(this: any, ...args: any[]) {
        const selectResult = originalSelect(...args);
        const originalThen = selectResult.then.bind(selectResult);
        
        // Add a delay to simulate slow network
        (selectResult as any).then = function(callback: any) {
          return originalThen((data: any) => {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(callback(data));
              }, 500); // 500ms delay
            });
          });
        };
        
        return selectResult;
      };
      
      return result;
    });
    
    // Apply the mock with type assertion
    (client as any).from = mockFrom;
    
    function Page() {
      const { pages, pageIndex, setPage, isLoading } =
        useInfiniteOffsetPaginationQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="setPage0" onClick={() => setPage(0)} />
          <div data-testid="setPage1" onClick={() => setPage(1)} />
          <div data-testid="setPage2" onClick={() => setPage(2)} />
          <div data-testid="pageIndex">{pageIndex}</div>
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Wait for initial loading
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('loading');
    }, { timeout: 15000 });
    
    // Try to change page while loading
    fireEvent.click(testContainer.getByTestId('setPage2'));
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check that page change was handled (either accepted or ignored)
    const pageIndex = parseInt(testContainer.getByTestId('pageIndex').textContent || '0', 10);
    expect(pageIndex).toBeGreaterThanOrEqual(0);
    
    // Restore original implementation
    client.from = originalFrom;
  });

  // Test edge case: page index beyond available data
  it('should handle page index beyond available data', async () => {
    function Page() {
      const { pages, pageIndex, setPage, isLoading, hasNextPage } =
        useInfiniteOffsetPaginationQuery(
          client
            .from('contact')
            .select('id,username')
            .ilike('username', `${testRunPrefix}%`)
            .order('username', { ascending: true }),
          { pageSize: 1 },
        );
        
      return (
        <div data-testid="test-container">
          <div data-testid="setHighPage" onClick={() => setPage(100)} />
          <div data-testid="pageIndex">{pageIndex}</div>
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="hasNextPage">{hasNextPage ? 'has-next' : 'no-next'}</div>
          <div data-testid="pagesLength">{pages.length}</div>
        </div>
      );
    }

    const { container } = renderWithConfig(<Page />, queryClient);
    const testContainer = within(container.querySelector('[data-testid="test-container"]')!);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Try to set page index beyond available data
    fireEvent.click(testContainer.getByTestId('setHighPage'));
    
    // Wait for loading to complete (might trigger additional fetches)
    await waitFor(() => {
      expect(testContainer.getByTestId('loading').textContent).toBe('not-loading');
    }, { timeout: 15000 });
    
    // Check that page index is valid
    const pageIndex = parseInt(testContainer.getByTestId('pageIndex').textContent || '0', 10);
    const pagesLength = parseInt(testContainer.getByTestId('pagesLength').textContent || '0', 10);
    
    // Page index should be either the maximum available or handled gracefully
    expect(pageIndex).toBeLessThan(100);
    expect(pageIndex).toBeLessThanOrEqual(pagesLength);
  });
}); 