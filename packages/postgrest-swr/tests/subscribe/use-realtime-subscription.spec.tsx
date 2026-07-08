import { useRealtimeSubscription } from '../../src/subscribe/use-realtime-subscription';
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

type TestRow = {
  id: string;
  name: string;
};

const createMockChannel = () => {
  const subscribeFn = vi.fn(
    (callback: (status: string, error?: Error) => void) => {
      setTimeout(() => callback('SUBSCRIBED'), 0);
      return { unsubscribe: vi.fn() };
    },
  );

  const onFn = vi.fn(() => ({
    on: onFn,
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

describe('useRealtimeSubscription', () => {
  let mockChannel: ReturnType<typeof createMockChannel>;
  let mockClient: SupabaseClient;

  beforeEach(() => {
    mockChannel = createMockChannel();
    mockClient = createMockClient(mockChannel);
    vi.clearAllMocks();
  });

  it('should return null status initially', () => {
    const onPayload = vi.fn();
    const { result } = renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: '*',
        table: 'test',
        onPayload,
      }),
    );

    expect(result.current.status).toBeNull();
  });

  it('should subscribe to channel on mount', async () => {
    const onPayload = vi.fn();
    renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: '*',
        table: 'test',
        onPayload,
      }),
    );

    expect(mockClient.channel).toHaveBeenCalledWith('test-channel');
    expect(mockChannel.on).toHaveBeenCalled();
  });

  it('should update status when subscription succeeds', async () => {
    const onPayload = vi.fn();
    const { result } = renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: '*',
        schema: 'public',
        table: 'test',
        onPayload,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('SUBSCRIBED');
    });
  });

  it('should not subscribe when client is null', () => {
    const onPayload = vi.fn();
    const { result } = renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: null,
        channel: 'test-channel',
        event: '*',
        table: 'test',
        onPayload,
      }),
    );

    expect(result.current.status).toBeNull();
    expect(result.current.channel).toBeUndefined();
  });

  it('should subscribe with event type ALL (*)', async () => {
    const onPayload = vi.fn();
    renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: '*',
        schema: 'public',
        table: 'test',
        onPayload,
      }),
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
      expect.objectContaining({
        event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
        schema: 'public',
        table: 'test',
      }),
      expect.any(Function),
    );
  });

  it('should subscribe with event type INSERT', async () => {
    const onPayload = vi.fn();
    renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: 'INSERT',
        schema: 'public',
        table: 'test',
        onPayload,
      }),
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
      expect.objectContaining({
        event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT,
        schema: 'public',
        table: 'test',
      }),
      expect.any(Function),
    );
  });

  it('should subscribe with event type UPDATE', async () => {
    const onPayload = vi.fn();
    renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: 'UPDATE',
        schema: 'public',
        table: 'test',
        onPayload,
      }),
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
      expect.objectContaining({
        event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE,
        schema: 'public',
        table: 'test',
      }),
      expect.any(Function),
    );
  });

  it('should subscribe with event type DELETE', async () => {
    const onPayload = vi.fn();
    renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: 'DELETE',
        schema: 'public',
        table: 'test',
        onPayload,
      }),
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
      expect.objectContaining({
        event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE,
        schema: 'public',
        table: 'test',
      }),
      expect.any(Function),
    );
  });

  it('should include filter in subscription', async () => {
    const onPayload = vi.fn();
    renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: 'INSERT',
        schema: 'public',
        table: 'test',
        filter: 'id=eq.1',
        onPayload,
      }),
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
      expect.objectContaining({
        event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT,
        schema: 'public',
        table: 'test',
        filter: 'id=eq.1',
      }),
      expect.any(Function),
    );
  });

  it('should use public schema by default', async () => {
    const onPayload = vi.fn();
    renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: mockClient,
        channel: 'test-channel',
        event: '*',
        table: 'test',
        onPayload,
      }),
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
      expect.objectContaining({
        schema: 'public',
      }),
      expect.any(Function),
    );
  });

  it('should call onPayload when event is received', async () => {
    const onPayload = vi.fn();
    const mockPayload = {
      eventType: 'INSERT',
      new: { id: '1', name: 'test' },
      old: {},
      table: 'test',
      schema: 'public',
      commit_timestamp: '2024-01-01',
      errors: null,
    };

    const channelWithCallback = {
      on: vi.fn(
        (
          _type: string,
          _filter: object,
          handler: (payload: unknown) => void,
        ) => {
          setTimeout(() => handler(mockPayload), 10);
          return {
            on: vi.fn().mockReturnThis(),
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

    renderHook(() =>
      useRealtimeSubscription<TestRow>({
        client: clientWithCallback,
        channel: 'test-channel',
        event: '*',
        table: 'test',
        onPayload,
      }),
    );

    await waitFor(
      () => {
        expect(onPayload).toHaveBeenCalledWith(mockPayload);
      },
      { timeout: 1000 },
    );
  });
});
