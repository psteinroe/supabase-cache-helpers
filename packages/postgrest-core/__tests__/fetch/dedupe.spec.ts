import { buildDedupePath } from '../../src/fetch/dedupe';

describe('buildDedupePath', () => {
  it('should apply alias to nested path correctly', () => {
    expect(
      buildDedupePath(0, {
        path: 'note_id.relation_id',
        declaration: 'note_id.relation_id',
      })
    ).toMatchObject({
      path: 'note_id.relation_id',
      declaration: 'note_id.d_0_relation_id:relation_id',
      alias: 'note_id.d_0_relation_id',
    });
  });
});
