import { transformRecursive } from '../../src';

describe('transformRecursive', () => {
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
