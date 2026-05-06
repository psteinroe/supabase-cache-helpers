import { useInfiniteOffsetPaginationQuery } from '../../src';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import useSWRInfinite from 'swr/infinite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('swr/infinite', () => ({
  default: vi.fn(),
}));

const mockedUseSWRInfinite = vi.mocked(useSWRInfinite);

describe('useInfiniteOffsetPaginationQuery', () => {
  beforeEach(() => {
    mockedUseSWRInfinite.mockReset();
  });

  afterEach(cleanup);

  it('keeps nextPage available for loaded stale data while revalidating', () => {
    const setSize = vi.fn();
    mockedUseSWRInfinite.mockReturnValue({
      data: [{ data: [{ id: 1 }], hasMore: true }],
      setSize,
      size: 1,
      isValidating: true,
    } as any);

    function Page() {
      const { hasNextPage, nextPage } = useInfiniteOffsetPaginationQuery(null);

      return (
        <div>
          <div data-testid="hasNextPage">{String(hasNextPage)}</div>
          {nextPage && (
            <button data-testid="nextPage" onClick={() => nextPage()} />
          )}
        </div>
      );
    }

    render(<Page />);

    expect(screen.getByTestId('hasNextPage').textContent).toEqual('true');
    fireEvent.click(screen.getByTestId('nextPage'));
    expect(setSize).toHaveBeenCalledOnce();
  });

  it('does not expose nextPage again while the next page is still unloaded', () => {
    mockedUseSWRInfinite.mockReturnValue({
      data: [{ data: [{ id: 1 }], hasMore: true }],
      setSize: vi.fn(),
      size: 1,
      isValidating: true,
    } as any);

    function Page() {
      const { currentPage, nextPage } = useInfiniteOffsetPaginationQuery(null);

      return (
        <div>
          <div data-testid="currentPageLength">{currentPage?.length}</div>
          {nextPage && (
            <button data-testid="nextPage" onClick={() => nextPage()} />
          )}
        </div>
      );
    }

    render(<Page />);

    fireEvent.click(screen.getByTestId('nextPage'));

    expect(screen.getByTestId('currentPageLength').textContent).toEqual('0');
    expect(screen.queryByTestId('nextPage')).toBeNull();
  });

  it('does not expose nextPage when internal pagination has no more data', () => {
    mockedUseSWRInfinite.mockReturnValue({
      data: [{ data: [{ id: 1 }], hasMore: false }],
      setSize: vi.fn(),
      size: 1,
      isValidating: false,
    } as any);

    function Page() {
      const { hasNextPage, nextPage } = useInfiniteOffsetPaginationQuery(null);

      return (
        <div>
          <div data-testid="hasNextPage">{String(hasNextPage)}</div>
          {nextPage && <button data-testid="nextPage" />}
        </div>
      );
    }

    render(<Page />);

    expect(screen.getByTestId('hasNextPage').textContent).toEqual('false');
    expect(screen.queryByTestId('nextPage')).toBeNull();
  });
});
