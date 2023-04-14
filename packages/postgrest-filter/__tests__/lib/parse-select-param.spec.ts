import { parseSelectParam } from '../../src';

describe('parseSelectParam', () => {
  it('should return input if falsy', () => {
    expect(
      parseSelectParam(
        'id,assignee:assignee_id(id,test_name:display_name),tags:tag(id,tag_name:name)'
      )
    ).toEqual([
      {
        alias: undefined,
        declaration: 'id',
        path: 'id',
      },
      {
        alias: 'assignee.id',
        declaration: 'assignee:assignee_id.id',
        path: 'assignee_id.id',
      },
      {
        alias: 'assignee.test_name',
        declaration: 'assignee:assignee_id.test_name:display_name',
        path: 'assignee_id.display_name',
      },
      {
        alias: 'tags.id',
        declaration: 'tags:tag.id',
        path: 'tag.id',
      },
      {
        alias: 'tags.tag_name',
        declaration: 'tags:tag.tag_name:name',
        path: 'tag.name',
      },
    ]);
  });
});
null;
