import { denormalize } from '../../src/filter/denormalize';
import { parseSelectParam } from '../../src/lib/parse-select-param';

describe('denormalize', () => {
  it('should work with nested alias', () => {
    const paths = parseSelectParam(
      'note_id(test,relation_id,rel:relation_id(test))',
    );

    expect(
      denormalize(paths, {
        test: '123',
        some: '456',
        value: '789',
        'note_id.test': '123',
        'note_id.relation_id': 'id',
        'note_id.relation_id.test': '345',
      }),
    ).toEqual({
      note_id: {
        test: '123',
        relation_id: 'id',
        rel: {
          test: '345',
        },
      },
    });
  });

  it('should set null if relation is null', () => {
    expect(
      denormalize(
        [
          {
            declaration: 'assignee:assignee_id.id',
            alias: 'assignee.id',
            path: 'assignee_id.id',
          },
        ],
        {
          assignee_id: null,
        },
      ),
    ).toEqual({
      assignee: null,
    });
  });

  it('should set empty array if relation is empty array', () => {
    expect(
      denormalize(
        [
          {
            declaration: 'tags:tag.id',
            alias: 'tags.id',
            path: 'tag.id',
          },
          {
            declaration: 'tags:tag.name',
            alias: 'tags.name',
            path: 'tag.name',
          },
          {
            declaration: 'tags:tag.color',
            alias: 'tags.color',
            path: 'tag.color',
          },
        ],
        {
          tag: [],
        },
      ),
    ).toEqual({
      tags: [],
    });
  });
});
