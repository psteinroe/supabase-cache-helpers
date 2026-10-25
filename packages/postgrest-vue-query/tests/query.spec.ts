import { encode, useQuery } from '../src';
import { database, mount, response } from './utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, nextTick, ref, type EffectScope } from 'vue';

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach((stop) => stop()));

describe('useQuery', () => {
  it.each([
    ['PGRST103', '*/1', true],
    ['PGRST103', undefined, false],
    ['42501', '*/1', false],
    ['PGRST103', '*/100', false],
  ] as const)(
    'only normalizes a confirmed empty range: code=%s range=%s',
    async (code, range, empty) => {
      const db = database(
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                code,
                message: 'range error',
                details: '',
                hint: null,
              }),
              {
                status: 416,
                headers: range ? { 'content-range': range } : {},
              },
            ),
        ),
      );
      const ctx = mount(() =>
        useQuery(db.from('items').select('id', { count: 'exact' }).range(1, 1)),
      );
      cleanups.push(ctx.stop);
      if (empty) {
        await vi.waitFor(() => expect(ctx.result.isSuccess.value).toBe(true));
        expect(ctx.result.data.value).toEqual([]);
        expect(ctx.result.count.value).toBe(1);
      } else {
        await vi.waitFor(() => expect(ctx.result.isError.value).toBe(true));
        expect(ctx.result.error.value?.code).toBe(code);
      }
    },
  );

  it('tracks getter filters and computed range without losing response reactivity', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (input) => {
      const url = new URL(String(input));
      return response(
        [
          {
            id: Number(url.searchParams.get('id')?.slice(3)),
            name: 'item',
            active: true,
          },
        ],
        8,
      );
    });
    const db = database(fetch);
    const id = ref(1);
    const page = ref(0);
    const query = computed(() =>
      db
        .from('items')
        .select('id,name,active', { count: 'exact' })
        .eq('id', id.value)
        .range(page.value * 2, page.value * 2 + 1),
    );
    const ctx = mount(() => useQuery(query));
    cleanups.push(ctx.stop);
    await vi.waitFor(() => expect(ctx.result.data.value?.[0]?.id).toBe(1));
    expect(ctx.result.count.value).toBe(8);
    id.value = 2;
    page.value = 1;
    await vi.waitFor(() => expect(ctx.result.data.value?.[0]?.id).toBe(2));
    expect(String(fetch.mock.calls.at(-1)?.[0])).toContain('offset=2');
    expect(
      ctx.client
        .getQueryCache()
        .getAll()
        .filter((q) => q.queryKey[0] === 'postgrest'),
    ).toHaveLength(1);
    const refreshed = await ctx.result.refetch();
    expect(refreshed.data?.count).toBe(8);
    expect(ctx.result.data.value?.[0]?.id).toBe(2);
  });

  it('supports getter builders and reactive enabled options', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => response([]));
    const db = database(fetch);
    const enabled = ref(false);
    const ctx = mount(() =>
      useQuery(() => db.from('items').select('id'), { enabled }),
    );
    cleanups.push(ctx.stop);
    await nextTick();
    expect(fetch).not.toHaveBeenCalled();
    enabled.value = true;
    await vi.waitFor(() => expect(ctx.result.data.value).toEqual([]));
  });

  it('does not let a late old-filter response overwrite the current query', async () => {
    let resolveFirst!: (value: Response) => void;
    let firstSignal: AbortSignal | null | undefined;
    const first = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const fetch = vi.fn<typeof globalThis.fetch>((input, init) => {
      if (new URL(String(input)).searchParams.get('id') === 'eq.1') {
        firstSignal = init?.signal;
        return first;
      }
      return Promise.resolve(response([{ id: 2 }]));
    });
    const db = database(fetch);
    const id = ref(1);
    const ctx = mount(() =>
      useQuery(() => db.from('items').select('id').eq('id', id.value)),
    );
    cleanups.push(ctx.stop);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    id.value = 2;
    await vi.waitFor(() => expect(ctx.result.data.value).toEqual([{ id: 2 }]));
    expect(firstSignal?.aborted).toBe(true);
    resolveFirst(response([{ id: 1 }]));
    await first;
    await nextTick();
    expect(ctx.result.data.value).toEqual([{ id: 2 }]);
  });

  it('keeps array, single and maybeSingle keys distinct', () => {
    const db = database(vi.fn());
    const list = encode(db.from('items').select('id'), false);
    const single = encode(db.from('items').select('id').single(), false);
    const maybe = encode(db.from('items').select('id').maybeSingle(), false);
    expect(
      new Set([list, single, maybe].map((key) => JSON.stringify(key))).size,
    ).toBe(3);
  });

  it('unwraps single rows and preserves an empty maybeSingle as null', async () => {
    const db = database(
      vi.fn(async (_input, init) =>
        response(
          new Headers(init?.headers).get('Accept')?.includes('object')
            ? { id: 1 }
            : [],
        ),
      ),
    );
    const ctx = mount(() => ({
      single: useQuery(db.from('items').select('id').single()),
      maybe: useQuery(db.from('items').select('id').maybeSingle()),
    }));
    cleanups.push(ctx.stop);
    await vi.waitFor(() =>
      expect(ctx.result.single.data.value).toEqual({ id: 1 }),
    );
    await vi.waitFor(() => expect(ctx.result.maybe.data.value).toBeNull());
    expect(ctx.result.maybe.isSuccess.value).toBe(true);
  });

  it('surfaces PostgREST errors instead of caching them as successful data', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(
          JSON.stringify({
            message: 'denied',
            code: '42501',
            details: '',
            hint: '',
          }),
          { status: 403 },
        ),
    );
    const ctx = mount(() =>
      useQuery(database(fetch).from('items').select('id')),
    );
    cleanups.push(ctx.stop);
    await vi.waitFor(() => expect(ctx.result.isError.value).toBe(true));
    expect(ctx.result.error.value?.code).toBe('42501');
    expect(ctx.result.data.value).toBeUndefined();
  });

  it.each(['scope', 'unmount'])(
    'unsubscribes and aborts an in-flight request on %s disposal',
    async (kind) => {
      let signal: AbortSignal | undefined;
      const fetch = vi.fn<typeof globalThis.fetch>((_input, init) => {
        signal = init?.signal ?? undefined;
        return new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      });
      let scope!: EffectScope;
      const ctx = mount(() => {
        scope = effectScope();
        return scope.run(() =>
          useQuery(database(fetch).from('items').select('id')),
        )!;
      });
      cleanups.push(ctx.stop);
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
      const cached = ctx.client.getQueryCache().getAll()[0];
      expect(cached.getObserversCount()).toBe(1);
      if (kind === 'scope') scope.stop();
      else ctx.stop();
      expect(cached.getObserversCount()).toBe(0);
      expect(signal?.aborted).toBe(true);
    },
  );
});
