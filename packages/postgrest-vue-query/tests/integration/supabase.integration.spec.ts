import {
  encode,
  useDeleteManyMutation,
  useDeleteMutation,
  useInsertMutation,
  useQuery,
  useUpdateMutation,
  useUpsertMutation,
} from '../../src';
import { mount } from '../utils';
import { columns, fixture, type Task } from './fixture';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';

let local: ReturnType<typeof fixture>;
let a: Awaited<ReturnType<typeof local.user>>;
let b: typeof a;
const cleanups: (() => void)[] = [];
beforeAll(async () => {
  local = fixture();
  a = await local.user();
  b = await local.user();
});
beforeEach(async () => {
  await local.reset(a.id, b.id);
});
afterEach(() => cleanups.splice(0).forEach((stop) => stop()));
afterAll(async () => {
  if (local) await local.cleanup();
});

describe('real local Supabase', () => {
  it('enforces anonymous and two-user RLS, including denied mutations without cache pollution', async () => {
    const ctx = mount(() => ({
      query: useQuery(a.db.from('vue_query_tasks').select(columns).order('id')),
      insert: useInsertMutation(a.db.from('vue_query_tasks'), ['id'], columns),
      update: useUpdateMutation(a.db.from('vue_query_tasks'), ['id'], columns),
      remove: useDeleteMutation(a.db.from('vue_query_tasks'), ['id'], columns),
    }));
    const other = mount(() =>
      useQuery(b.db.from('vue_query_tasks').select(columns).order('id')),
    );
    const anon = mount(() => ({
      query: useQuery(local.anon.from('vue_query_tasks').select(columns)),
      insert: useInsertMutation(
        local.anon.from('vue_query_tasks'),
        ['id'],
        columns,
      ),
    }));
    cleanups.push(ctx.stop, other.stop, anon.stop);
    await vi.waitFor(() => expect(ctx.result.query.data.value).toHaveLength(3));
    await vi.waitFor(() => expect(other.result.data.value).toHaveLength(2));
    await vi.waitFor(() => expect(anon.result.query.data.value).toEqual([]));
    expect(
      ctx.result.query.data.value?.every((row) => row.owner_id === a.id),
    ).toBe(true);
    expect(other.result.data.value?.every((row) => row.owner_id === b.id)).toBe(
      true,
    );
    const before = ctx.result.query.data.value?.map((row) => ({ ...row }));
    await expect(
      ctx.result.insert.mutateAsync([local.task(b.id, local.ids.inserted, 1)]),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      anon.result.insert.mutateAsync([local.task(a.id, local.ids.inserted, 1)]),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      ctx.result.update.mutateAsync({ id: local.ids.foreign, title: 'stolen' }),
    ).rejects.toMatchObject({ code: 'PGRST116' });
    await expect(
      ctx.result.update.mutateAsync({ id: local.ids.first, owner_id: b.id }),
    ).rejects.toMatchObject({ code: '42501' });
    expect(
      await ctx.result.remove.mutateAsync({ id: local.ids.foreign }),
    ).toBeNull();
    expect(ctx.result.query.data.value).toEqual(before);
    const foreign = await b.db
      .from('vue_query_tasks')
      .select('title')
      .eq('id', local.ids.foreign)
      .single()
      .throwOnError();
    expect(foreign.data.title).toBe('Secret task B');
  });

  it('keeps aliased many-to-one and one-to-many relations correct through mutations', async () => {
    const ctx = mount(() => ({
      tasks: useQuery(
        a.db
          .from('vue_query_tasks')
          .select('id,title,project_id,project:vue_query_projects(id,name)')
          .order('id'),
      ),
      projects: useQuery(
        a.db
          .from('vue_query_projects')
          .select('id,name,tasks:vue_query_tasks(id,title,active,rank)')
          .order('id'),
      ),
      task: useUpdateMutation(
        a.db.from('vue_query_tasks'),
        ['id'],
        'id,title,project_id',
        {
          revalidateRelations: [
            {
              relation: 'vue_query_projects',
              relationIdColumn: 'id',
              fKeyColumn: 'project_id',
            },
          ],
        },
      ),
      project: useUpdateMutation(
        a.db.from('vue_query_projects'),
        ['id'],
        'id,name',
        {
          revalidateTables: [{ table: 'vue_query_tasks' }],
        },
      ),
    }));
    cleanups.push(ctx.stop);
    await vi.waitFor(() => expect(ctx.result.tasks.data.value).toHaveLength(3));
    await vi.waitFor(() =>
      expect(ctx.result.projects.data.value?.[0]?.tasks).toHaveLength(3),
    );
    expectTypeOf(ctx.result.tasks.data.value?.[0]?.project).toEqualTypeOf<
      { id: number; name: string } | undefined
    >();
    const updated = await ctx.result.task.mutateAsync({
      id: local.ids.first,
      title: 'changed',
      project_id: local.ids.project,
    });
    expect(updated).toEqual({
      id: local.ids.first,
      title: 'changed',
      project_id: local.ids.project,
    });
    expect(ctx.result.tasks.data.value?.[0]).toMatchObject({
      title: 'changed',
      project: { name: 'Project A' },
    });
    expect(
      ctx.result.projects.data.value?.[0]?.tasks.find(
        (row) => row.id === local.ids.first,
      )?.title,
    ).toBe('changed');
    await ctx.result.project.mutateAsync({
      id: local.ids.project,
      name: 'Renamed A',
    });
    expect(ctx.result.tasks.data.value?.[0]?.project?.name).toBe('Renamed A');
    expect(ctx.result.projects.data.value?.[0]?.tasks).toHaveLength(3);
  });

  it('applies RLS to embedded parents and rejects foreign-parent writes', async () => {
    // Administrative seed creates a child whose parent is hidden from its owner.
    await local.admin
      .from('vue_query_tasks')
      .insert({
        ...local.task(a.id, local.ids.inserted, 1),
        project_id: local.ids.otherProject,
      })
      .throwOnError();
    const ctx = mount(() => ({
      query: useQuery(
        a.db
          .from('vue_query_tasks')
          .select('id,project:vue_query_projects(id,name)')
          .eq('id', local.ids.inserted)
          .single(),
      ),
      inner: useQuery(
        a.db
          .from('vue_query_tasks')
          .select('id,project:vue_query_projects!inner(id,name)')
          .eq('id', local.ids.inserted),
      ),
      insert: useInsertMutation(a.db.from('vue_query_tasks'), ['id'], columns),
    }));
    cleanups.push(ctx.stop);
    await vi.waitFor(() =>
      expect(ctx.result.query.data.value).toEqual({
        id: local.ids.inserted,
        project: null,
      }),
    );
    await vi.waitFor(() => expect(ctx.result.inner.data.value).toEqual([]));
    await expect(
      ctx.result.insert.mutateAsync([
        {
          ...local.task(a.id, local.ids.upserted, 1),
          project_id: local.ids.otherProject,
        },
      ]),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('revalidates both old and new parent caches after moving a child', async () => {
    const parent = (id: number) =>
      a.db
        .from('vue_query_projects')
        .select('id,tasks:vue_query_tasks(id,title)')
        .eq('id', id)
        .single();
    const ctx = mount(() => ({
      old: useQuery(parent(local.ids.project)),
      next: useQuery(parent(local.ids.secondProject)),
      move: useUpdateMutation(
        a.db.from('vue_query_tasks'),
        ['id'],
        'id,project_id',
        {
          revalidateRelations: [
            {
              relation: 'vue_query_projects',
              relationIdColumn: 'id',
              fKeyColumn: 'project_id',
            },
          ],
        },
      ),
      remove: useDeleteMutation(
        a.db.from('vue_query_tasks'),
        ['id'],
        'id,project_id',
        {
          revalidateRelations: [
            {
              relation: 'vue_query_projects',
              relationIdColumn: 'id',
              fKeyColumn: 'project_id',
            },
          ],
        },
      ),
    }));
    cleanups.push(ctx.stop);
    await vi.waitFor(() =>
      expect(ctx.result.old.data.value?.tasks).toHaveLength(3),
    );
    await vi.waitFor(() =>
      expect(ctx.result.next.data.value?.tasks).toEqual([]),
    );
    await ctx.result.move.mutateAsync({
      id: local.ids.first,
      project_id: local.ids.secondProject,
    });
    const previous = await parent(local.ids.project).throwOnError();
    const next = await parent(local.ids.secondProject).throwOnError();
    expect(ctx.result.old.data.value).toEqual(previous.data);
    expect(ctx.result.next.data.value).toEqual(next.data);
    await ctx.result.remove.mutateAsync({ id: local.ids.first });
    expect(ctx.result.next.data.value?.tasks).toEqual([]);
    expect(ctx.result.old.data.value).toEqual(previous.data);
  });

  it('marks a disabled page stale and reconciles it when explicitly refetched', async () => {
    const page = () =>
      a.db
        .from('vue_query_tasks')
        .select(columns, { count: 'exact' })
        .eq('active', true)
        .order('rank')
        .order('id')
        .range(1, 1);
    const initial = await page().throwOnError();
    const ctx = mount(() => ({
      disabled: useQuery(page(), { enabled: false }),
      insert: useInsertMutation(a.db.from('vue_query_tasks'), ['id'], columns),
    }));
    cleanups.push(ctx.stop);
    const key = encode(page(), false);
    ctx.client.setQueryData(key, initial);
    await ctx.result.insert.mutateAsync([
      local.task(a.id, local.ids.inserted, 0),
    ]);
    expect(ctx.client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(ctx.result.disabled.count.value).toBe(2);
    await ctx.result.disabled.refetch();
    const server = await page().throwOnError();
    expect(ctx.result.disabled.data.value).toEqual(server.data);
    expect(ctx.result.disabled.count.value).toBe(3);
  });

  it('matches server-filtered pages, HEAD and exact totals after all CRUD operations', async () => {
    const page = (offset: number) =>
      a.db
        .from('vue_query_tasks')
        .select(columns, { count: 'exact' })
        .eq('active', true)
        .order('rank')
        .order('id')
        .range(offset, offset);
    const ctx = mount(() => ({
      first: useQuery(page(0)),
      second: useQuery(page(1)),
      head: useQuery(
        a.db
          .from('vue_query_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('active', true),
      ),
      insert: useInsertMutation(a.db.from('vue_query_tasks'), ['id'], columns),
      update: useUpdateMutation(a.db.from('vue_query_tasks'), ['id'], columns),
      upsert: useUpsertMutation(a.db.from('vue_query_tasks'), ['id'], columns),
      remove: useDeleteMutation(a.db.from('vue_query_tasks'), ['id'], columns),
      removeMany: useDeleteManyMutation(
        a.db.from('vue_query_tasks'),
        ['id'],
        columns,
      ),
    }));
    cleanups.push(ctx.stop);
    await vi.waitFor(() => expect(ctx.result.first.count.value).toBe(2));
    await vi.waitFor(() => expect(ctx.result.second.count.value).toBe(2));
    await vi.waitFor(() => expect(ctx.result.head.count.value).toBe(2));
    const assertPages = async (ids: number[], count: number) => {
      const server = await a.db
        .from('vue_query_tasks')
        .select(columns, { count: 'exact' })
        .eq('active', true)
        .order('rank')
        .order('id')
        .throwOnError();
      expect(server.count).toBe(count);
      for (const [i, query] of [
        ctx.result.first,
        ctx.result.second,
      ].entries()) {
        expect(query.isSuccess.value).toBe(true);
        expect(query.data.value).toEqual(server.data.slice(i, i + 1));
        expect(query.count.value).toBe(count);
        expect(query.data.value?.map((row) => row.id)).toEqual(
          ids.slice(i, i + 1),
        );
        const cached = ctx.client.getQueryData<{ data: Task[]; count: number }>(
          encode(page(i), false),
        );
        expect(cached?.data).toEqual(server.data.slice(i, i + 1));
        expect(cached?.count).toBe(count);
      }
      expect(ctx.result.head.count.value).toBe(count);
    };
    await assertPages([local.ids.first, local.ids.second], 2);
    await ctx.result.insert.mutateAsync([
      local.task(a.id, local.ids.inserted, 5),
    ]);
    await assertPages([local.ids.inserted, local.ids.first], 3);
    await ctx.result.update.mutateAsync({ id: local.ids.second, rank: 1 });
    await assertPages([local.ids.second, local.ids.inserted], 3);
    await ctx.result.update.mutateAsync({ id: local.ids.first, active: false });
    await assertPages([local.ids.second, local.ids.inserted], 2);
    await ctx.result.upsert.mutateAsync([
      local.task(a.id, local.ids.inserted, 100),
      local.task(a.id, local.ids.upserted, 0),
    ]);
    await assertPages([local.ids.upserted, local.ids.second], 3);
    await ctx.result.remove.mutateAsync({ id: local.ids.upserted });
    await assertPages([local.ids.second, local.ids.inserted], 2);
    await ctx.result.remove.mutateAsync({ id: local.ids.second });
    await assertPages([local.ids.inserted], 1);
    await ctx.result.removeMany.mutateAsync([{ id: local.ids.inserted }]);
    await assertPages([], 0);
  });
});
