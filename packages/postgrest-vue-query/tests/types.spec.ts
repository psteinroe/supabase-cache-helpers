import {
  useDeleteMutation,
  useInsertMutation,
  useQuery,
  useUpdateMutation,
} from '../src';
import { database, mount, response, type Row } from './utils';
import { expectTypeOf, it } from 'vitest';
import { computed } from 'vue';

it('preserves selected columns, single/null shape and mutation inputs', () => {
  const db = database(async () => response([]));
  const ctx = mount(() => {
    const list = useQuery(() => db.from('items').select('id,name'));
    const single = useQuery(db.from('items').select('id').single());
    const maybe = useQuery(
      computed(() => db.from('items').select('id').maybeSingle()),
    );
    const insert = useInsertMutation(db.from('items'), ['id'], 'id,name');
    const update = useUpdateMutation(db.from('items'), ['id'], 'id');
    const remove = useDeleteMutation(db.from('items'), ['id'], 'id');
    expectTypeOf(list.data.value).toEqualTypeOf<
      Pick<Row, 'id' | 'name'>[] | null | undefined
    >();
    expectTypeOf(single.data.value).toEqualTypeOf<
      Pick<Row, 'id'> | null | undefined
    >();
    expectTypeOf(maybe.data.value).toEqualTypeOf<
      Pick<Row, 'id'> | null | undefined
    >();
    expectTypeOf(insert.data.value).toEqualTypeOf<
      Pick<Row, 'id' | 'name'>[] | null | undefined
    >();
    expectTypeOf(update.data.value).toEqualTypeOf<
      Pick<Row, 'id'> | null | undefined
    >();
    expectTypeOf(remove.data.value).toEqualTypeOf<
      Pick<Row, 'id'> | null | undefined
    >();
    const invalidInputs = () => {
      // @ts-expect-error Insert requires every required column.
      insert.mutate([{ id: 1 }]);
      // @ts-expect-error Update uses the database's number primary key type.
      update.mutate({ id: 'invalid' });
      // @ts-expect-error Primary keys must be columns of the table.
      useDeleteMutation(db.from('items'), ['missing']);
      // @ts-expect-error Query keys are owned by the adapter.
      useQuery(db.from('items').select(), { queryKey: ['manual'] });
    };
    expectTypeOf(invalidInputs).toBeFunction();
  });
  ctx.stop();
});
