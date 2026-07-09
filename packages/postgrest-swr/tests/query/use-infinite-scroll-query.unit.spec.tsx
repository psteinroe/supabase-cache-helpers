import {
  useCursorInfiniteScrollQuery,
  useOffsetInfiniteScrollQuery,
} from '../../src';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import useSWRInfinite from 'swr/infinite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('swr/infinite', () => ({
  default: vi.fn(),
}));

const mockedUseSWRInfinite = vi.mocked(useSWRInfinite);
const cursorQueryFactory = () =>
  ({
    url: new URL('https://example.com?limit=1'),
  }) as any;

describe('useOffsetInfiniteScrollQuery', () => {
  beforeEach(() => {
    mockedUseSWRInfinite.mockReset();
  });

  afterEach(cleanup);

  it('keeps loadMore available for loaded stale data while revalidating', () => {
    const setSize = vi.fn();
    mockedUseSWRInfinite.mockReturnValue({
      data: [{ data: [{ id: 1 }], hasMore: true }],
      setSize,
      size: 1,
      isValidating: true,
    } as any);

    function Page() {
      const { loadMore } = useOffsetInfiniteScrollQuery(null);

      return (
        <div>
          {loadMore && (
            <button data-testid="loadMore" onClick={() => loadMore()} />
          )}
        </div>
      );
    }

    render(<Page />);

    fireEvent.click(screen.getByTestId('loadMore'));
    expect(setSize).toHaveBeenCalledOnce();
  });

  it('does not expose loadMore while the next page is still unloaded', () => {
    mockedUseSWRInfinite.mockReturnValue({
      data: [{ data: [{ id: 1 }], hasMore: true }],
      setSize: vi.fn(),
      size: 2,
      isValidating: true,
    } as any);

    function Page() {
      const { loadMore } = useOffsetInfiniteScrollQuery(null);

      return <div>{loadMore && <button data-testid="loadMore" />}</div>;
    }

    render(<Page />);

    expect(screen.queryByTestId('loadMore')).toBeNull();
  });
});

describe('useCursorInfiniteScrollQuery', () => {
  beforeEach(() => {
    mockedUseSWRInfinite.mockReset();
  });

  afterEach(cleanup);

  it('keeps loadMore available for loaded stale data while revalidating', () => {
    const setSize = vi.fn();
    mockedUseSWRInfinite.mockReturnValue({
      data: [[{ id: 1 }]],
      setSize,
      size: 1,
      isValidating: true,
    } as any);

    function Page() {
      const { loadMore } = useCursorInfiniteScrollQuery(cursorQueryFactory, {
        orderBy: 'id',
      });

      return (
        <div>
          {loadMore && (
            <button data-testid="loadMore" onClick={() => loadMore()} />
          )}
        </div>
      );
    }

    render(<Page />);

    fireEvent.click(screen.getByTestId('loadMore'));
    expect(setSize).toHaveBeenCalledOnce();
  });

  it('does not expose loadMore while the next page is still unloaded', () => {
    mockedUseSWRInfinite.mockReturnValue({
      data: [[{ id: 1 }]],
      setSize: vi.fn(),
      size: 2,
      isValidating: true,
    } as any);

    function Page() {
      const { loadMore } = useCursorInfiniteScrollQuery(cursorQueryFactory, {
        orderBy: 'id',
      });

      return <div>{loadMore && <button data-testid="loadMore" />}</div>;
    }

    render(<Page />);

    expect(screen.queryByTestId('loadMore')).toBeNull();
  });
});
