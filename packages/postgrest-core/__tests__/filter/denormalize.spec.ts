import { denormalize } from '../../src/filter/denormalize';
import { parseSelectParam } from '../../src/lib/parse-select-param';

describe('denormalize', () => {
  it('should work with nested alias', () => {
    const paths = parseSelectParam(
      'note_id(test,relation_id,rel:relation_id(test))'
    );

    expect(
      denormalize(paths, {
        test: '123',
        some: '456',
        value: '789',
        'note_id.test': '123',
        'note_id.relation_id': 'id',
        'note_id.relation_id.test': '345',
      })
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
});
