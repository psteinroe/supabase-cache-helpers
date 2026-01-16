import { useSubscription } from '../../src/subscribe/use-subscription';
import { type SupabaseClient } from '@supabase/supabase-js';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { describe, expect, it, vi, beforeEach } from 'vitest';

type TestTable = {
  Row: {
    id: string;
    name: string;
  };
  Insert: {
    id?: string;
    name: string;
  };
  Update: {
    id?: string;
    name?: string;
  };
  Relationships: [];
};

const createMockChannel = () => {
  const subscribeFn = vi.fn(
    (callback: (status: string, error?: Error) => void) => {
      // Simulate successful subscription
      setTimeout(() => callback('SUBSCRIBED'), 0);
      return { unsubscribe: vi.fn() };
    },
  );

  const onFn = vi.fn(() => ({
    subscribe: subscribeFn,
  }));

  return {
    on: onFn,
    subscribe: subscribeFn,
    unsubscribe: vi.fn(),
  };
};

const createMockClient = (
  mockChannel: ReturnType<typeof createMockChannel>,
) => {
  return {
    channel: vi.fn(() => mockChannel),
  } as unknown as SupabaseClient;
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
);

describe('useSubscription', () => {
  let mockChannel: ReturnType<typeof createMockChannel>;
  let mockClient: SupabaseClient;

  beforeEach(() => {
    mockChannel = createMockChannel();
    mockClient = createMockClient(mockChannel);
    vi.clearAllMocks();
  });

  it('should return null status initially', () => {
    const { result } = renderHook(
      () =>
        useSubscription<TestTable>({
          client: mockClient,
          channel: 'test-channel',
          event: '*',
          table: 'test',
          primaryKeys: ['id'],
        }),
      { wrapper },
    );

    expect(result.current.status).toBeNull();
  });

  it('should subscribe to channel on mount', async () => {
    renderHook(
      () =>
        useSubscription<TestTable>({
          client: mockClient,
          channel: 'test-channel',
          event: '*',
          table: 'test',
          primaryKeys: ['id'],
        }),
      { wrapper },
    );

    expect(mockClient.channel).toHaveBeenCalledWith('test-channel');
    expect(mockChannel.on).toHaveBeenCalled();
  });

  it('should update status when subscription succeeds', async () => {
    const { result } = renderHook(
      () =>
        useSubscription<TestTable>({
          client: mockClient,
          channel: 'test-channel',
          event: '*',
          schema: 'public',
          table: 'test',
          primaryKeys: ['id'],
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('SUBSCRIBED');
    });
  });

  it('should not subscribe when client is null', () => {
    const { result } = renderHook(
      () =>
        useSubscription<TestTable>({
          client: null,
          channel: 'test-channel',
          event: '*',
          table: 'test',
          primaryKeys: ['id'],
        }),
      { wrapper },
    );

    expect(result.current.status).toBeNull();
  });

  it('should call callback when provided', async () => {
    const callback = vi.fn();
    const mockPayload = {
      eventType: 'INSERT',
      new: { id: '1', name: 'test' },
      old: {},
      table: 'test',
      schema: 'public',
      commit_timestamp: '2024-01-01',
      errors: null,
    };

    // Create a channel that triggers the callback
    const channelWithCallback = {
      on: vi.fn(
        (
          _type: string,
          _filter: object,
          handler: (payload: unknown) => void,
        ) => {
          // Store the handler to call later
          setTimeout(() => handler(mockPayload), 10);
          return {
            subscribe: vi.fn((statusCallback: (status: string) => void) => {
              setTimeout(() => statusCallback('SUBSCRIBED'), 0);
              return { unsubscribe: vi.fn() };
            }),
          };
        },
      ),
      unsubscribe: vi.fn(),
    };

    const clientWithCallback = {
      channel: vi.fn(() => channelWithCallback),
    } as unknown as SupabaseClient;

    renderHook(
      () =>
        useSubscription<TestTable>({
          client: clientWithCallback,
          channel: 'test-channel',
          event: '*',
          table: 'test',
          primaryKeys: ['id'],
          callback,
        }),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(callback).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
  });

  it('should handle filter expression', async () => {
    renderHook(
      () =>
        useSubscription<TestTable>({
          client: mockClient,
          channel: 'test-channel',
          event: 'INSERT',
          schema: 'public',
          table: 'test',
          filter: 'id=eq.1',
          primaryKeys: ['id'],
        }),
      { wrapper },
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'test',
        filter: 'id=eq.1',
      }),
      expect.any(Function),
    );
  });

  it('should use public schema by default', async () => {
    renderHook(
      () =>
        useSubscription<TestTable>({
          client: mockClient,
          channel: 'test-channel',
          event: '*',
          table: 'test',
          primaryKeys: ['id'],
        }),
      { wrapper },
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        schema: 'public',
      }),
      expect.any(Function),
    );
  });
});
