import { PostgrestQueryParser } from '../src/postgrest-query-parser';

describe('PostgrestQueryParser', () => {
  it('should work if the column has the name as the operator', () => {
    expect(
      new PostgrestQueryParser(
        'fts=fts.12%3A*&limit=50&offset=0&order=name.asc&organisation_id=eq.7ffe8eab-8e99-4b63-be2d-a418d4cb767b&select=id%2Cname%2Cwhatsapp_status%2Ctype%2Crequest_approvals%2Clanguage%28name%29%2Ctext%2Cupdated_at%2Cprovider_template_approval%28status%2Ccategory%29',
      ).filters,
    ).toEqual([
      {
        alias: undefined,
        negate: false,
        operator: 'fts',
        path: 'fts',
        value: '12:*',
      },
      {
        alias: undefined,
        negate: false,
        operator: 'eq',
        path: 'organisation_id',
        value: '7ffe8eab-8e99-4b63-be2d-a418d4cb767b',
      },
    ]);
  });
});
