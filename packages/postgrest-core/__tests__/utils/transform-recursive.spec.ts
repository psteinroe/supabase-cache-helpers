import { transformRecursive } from '../../src/utils/transform-recursive';

describe('transformRecursive', () => {
  it('should transform nulls to null', () => {
    expect(
      transformRecursive(
        [
          {
            alias: 'id',
            declaration: 'id',
            path: 'id',
          },
          {
            alias: 'full_name',
            declaration: 'full_name:display_name',
            path: 'display_name',
          },
        ],
        {
          id: null,
          display_name: null,
        },
        'path'
      )
    ).toEqual({ id: null, display_name: null });
  });
  it('should transform nulls of relation to null', () => {
    expect(
      transformRecursive(
        [
          {
            alias: 'assignee.id',
            declaration: 'assignee:assignee_id.id',
            path: 'assignee_id.id',
          },
          {
            alias: 'assignee.display_name',
            declaration: 'assignee:assignee_id.display_name',
            path: 'assignee_id.display_name',
          },
        ],
        {
          assignee_id: null,
        },
        'path'
      )
    ).toEqual({ assignee_id: null });
  });
});
